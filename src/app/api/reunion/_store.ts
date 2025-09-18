import { NextResponse } from 'next/server';

type Candidate = RTCIceCandidateInit;

type RoomRecord = {
  roomId: string;
  createdAt: number;
  offer?: string | null;
  answer?: string | null;
  candidates: { caller: Candidate[]; callee: Candidate[] };
};

type Store = {
  rooms: Map<string, RoomRecord>;
};

export function getStore(): Store {
  const g = globalThis as unknown as { __reunionStore?: Store };
  if (!g.__reunionStore) {
    g.__reunionStore = { rooms: new Map<string, RoomRecord>() };
  }
  return g.__reunionStore;
}

export function getOrCreateRoom(roomId: string): RoomRecord {
  const store = getStore();
  if (!store.rooms.has(roomId)) {
    store.rooms.set(roomId, { roomId, createdAt: Date.now(), offer: null, answer: null, candidates: { caller: [], callee: [] } });
  }
  return store.rooms.get(roomId)!;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as unknown as Record<string, unknown>, { status: 200, ...(init || {}) });
}

export function jsonErr(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}
