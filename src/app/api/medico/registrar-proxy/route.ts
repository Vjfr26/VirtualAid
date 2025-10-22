import { NextRequest } from "next/server";

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_PROXY_BASE_URL || process.env.BACKEND_BASE_URL || "http://13.60.223.37").replace(/\/$/, "");
const LARAVEL_ENDPOINT = `${BACKEND_BASE}/api/medico/registrar`;
const MAX_PROXY_BODY_BYTES = 20 * 1024 * 1024; // 20 MB

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function streamToBuffer(stream: ReadableStream<Uint8Array> | null, limitBytes: number) {
  if (!stream) return null;

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > limitBytes) {
      reader.releaseLock();
      throw Object.assign(new Error("PAYLOAD_TOO_LARGE"), { code: "PAYLOAD_TOO_LARGE" });
    }
    chunks.push(value);
  }

  reader.releaseLock();
  if (!chunks.length) return Buffer.alloc(0);

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)));
}

export async function POST(req: NextRequest) {
  try {
    const abortController = new AbortController();
    const clientAbort = req.signal;

    if (clientAbort.aborted) {
      abortController.abort();
    } else {
      clientAbort.addEventListener("abort", () => abortController.abort(), { once: true });
    }

    const bodyBuffer = await streamToBuffer(req.body, MAX_PROXY_BODY_BYTES);

    const headers = new Headers();
    for (const [key, value] of req.headers) {
      if (["host", "content-length"].includes(key)) continue;
      headers.set(key, value);
    }
    if (bodyBuffer) {
      headers.set("content-length", String(bodyBuffer.length));
    }

    console.info("Proxying registro médico hacia:", LARAVEL_ENDPOINT);
    const response = await fetch(LARAVEL_ENDPOINT, {
      method: "POST",
      headers,
      body: bodyBuffer ?? undefined,
      signal: abortController.signal,
    });

    console.log("Laravel response status:", response.status);
    console.log("Laravel response headers:", Object.fromEntries(response.headers.entries()));

    const responseBuffer = await response.arrayBuffer();
    const responseText = new TextDecoder().decode(responseBuffer);
    console.log("Laravel response body (first 500 chars):", responseText.substring(0, 500));

    const responseHeaders = new Headers();
    const upstreamContentType = response.headers.get("content-type") ?? "application/json";
    responseHeaders.set("content-type", upstreamContentType);
    responseHeaders.set("cache-control", "no-store");

    return new Response(responseBuffer, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error al registrar médico:", error);

    if (error instanceof Error && (error as any).code === "PAYLOAD_TOO_LARGE") {
      return new Response(JSON.stringify({ message: "El archivo excede el límite permitido (20MB)." }), {
        status: 413,
        headers: { "content-type": "application/json" },
      });
    }

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Solicitud cancelada por el cliente"
        : "No fue posible contactar el servicio de registro";

    return new Response(JSON.stringify({ message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
