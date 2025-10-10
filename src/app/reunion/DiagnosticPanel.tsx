'use client';

import React, { useState, useEffect } from 'react';
import { ReunionDiagnostics, type DiagnosticResult } from './diagnostics';

interface DiagnosticPanelProps {
  roomId: string | null;
  role: 'caller' | 'callee' | null;
  connectionState: string;
  dataChannelState: string;
  signalingState?: string;
  iceConnectionState?: string;
}

export default function DiagnosticPanel({
  roomId,
  role,
  connectionState,
  dataChannelState,
  signalingState,
  iceConnectionState
}: DiagnosticPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runDiagnostic = React.useCallback(async () => {
    if (!roomId || !role) return;
    
    setIsRunning(true);
    const diag = new ReunionDiagnostics(roomId, role);
    const newResults = await diag.runFullDiagnostic();
    setResults(newResults);
    setIsRunning(false);
  }, [roomId, role]);

  useEffect(() => {
    if (!autoRefresh || !roomId || !role) return;
    
    const interval = setInterval(() => {
      runDiagnostic();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, roomId, role, runDiagnostic]);

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-900/30';
      case 'error': return 'text-red-400 bg-red-900/30';
      case 'warning': return 'text-yellow-400 bg-yellow-900/30';
      case 'pending': return 'text-blue-400 bg-blue-900/30';
    }
  };

  const getStatusEmoji = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'pending': return '⏳';
    }
  };

  const getConnectionColor = (state: string) => {
    switch (state) {
      case 'connected':
      case 'open':
        return 'text-green-400';
      case 'connecting':
      case 'checking':
        return 'text-yellow-400';
      case 'failed':
      case 'closed':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const summary = results.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { success: 0, error: 0, warning: 0, pending: 0 }
  );

  if (!roomId) {
    return null;
  }

  return (
    <>
      {/* Botón flotante para abrir panel */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg border border-gray-600 transition-all"
        title="Diagnóstico WebRTC"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>

      {/* Panel lateral deslizable */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-gray-900 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🔍 Diagnóstico WebRTC
                  {role && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-600">
                      {role === 'caller' ? '🏥 Médico' : '🧑‍💼 Paciente'}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Sala: {roomId}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Estados de conexión */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">Estados de Conexión</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">RTCPeerConnection:</span>
                    <span className={`font-mono font-semibold ${getConnectionColor(connectionState)}`}>
                      {connectionState}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">DataChannel:</span>
                    <span className={`font-mono font-semibold ${getConnectionColor(dataChannelState)}`}>
                      {dataChannelState}
                    </span>
                  </div>
                  {signalingState && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Signaling:</span>
                      <span className={`font-mono font-semibold ${getConnectionColor(signalingState)}`}>
                        {signalingState}
                      </span>
                    </div>
                  )}
                  {iceConnectionState && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">ICE Connection:</span>
                      <span className={`font-mono font-semibold ${getConnectionColor(iceConnectionState)}`}>
                        {iceConnectionState}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Controles */}
              <div className="flex gap-2">
                <button
                  onClick={runDiagnostic}
                  disabled={isRunning || !role}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  {isRunning ? '⏳ Ejecutando...' : '▶️ Ejecutar Diagnóstico'}
                </button>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    autoRefresh
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
                </button>
              </div>

              {/* Resumen */}
              {results.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-semibold text-white mb-3">Resumen</h3>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-2xl mb-1">✅</div>
                      <div className="text-gray-400">Exitosos</div>
                      <div className="text-green-400 font-bold">{summary.success}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">⚠️</div>
                      <div className="text-gray-400">Warnings</div>
                      <div className="text-yellow-400 font-bold">{summary.warning}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">❌</div>
                      <div className="text-gray-400">Errores</div>
                      <div className="text-red-400 font-bold">{summary.error}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">⏳</div>
                      <div className="text-gray-400">Pendientes</div>
                      <div className="text-blue-400 font-bold">{summary.pending}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados */}
              {results.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Resultados Detallados</h3>
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 border-l-4 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getStatusEmoji(result.status)}</span>
                          <span className="font-semibold text-sm">{result.step}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 ml-7">{result.message}</p>
                      {result.data !== undefined && result.data !== null && (
                        <details className="mt-2 ml-7">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                            Ver datos técnicos
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-950 rounded p-2 overflow-x-auto text-gray-400">
                            {(() => {
                              try {
                                return typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
                              } catch {
                                return String(result.data);
                              }
                            })()}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {results.length === 0 && !isRunning && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Haz clic en "Ejecutar Diagnóstico" para analizar la conexión</p>
                </div>
              )}

              {/* Ayuda */}
              <details className="bg-gray-800 rounded-lg border border-gray-700">
                <summary className="p-4 cursor-pointer text-sm font-semibold text-white hover:bg-gray-750">
                  ❓ ¿Qué verifico en el diagnóstico?
                </summary>
                <div className="p-4 pt-0 text-xs text-gray-400 space-y-2">
                  <p><strong className="text-white">1. Room State:</strong> Verifica que la sala existe y tiene el estado correcto (offer/answer disponibles)</p>
                  <p><strong className="text-white">2. GET /offer:</strong> Confirma que la oferta del médico está accesible</p>
                  <p><strong className="text-white">3. GET /answer:</strong> Confirma que la respuesta del paciente está accesible</p>
                  <p><strong className="text-white">4. GET /candidates:</strong> Verifica que hay ICE candidates para la negociación</p>
                  <p className="mt-4 pt-4 border-t border-gray-700">
                    <strong className="text-yellow-400">💡 Tip:</strong> Si ves errores, revisa la consola del navegador (F12) para logs más detallados.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
