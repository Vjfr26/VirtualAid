/**
 * 🔍 HERRAMIENTA DE DIAGNÓSTICO WEBRTC
 * 
 * Verifica el flujo completo de señalización:
 * 1. Médico POST offer
 * 2. Paciente GET offer
 * 3. Paciente POST answer
 * 4. Médico GET answer
 * 5. Ambos intercambian ICE candidates
 */

import { getState, getOffer, getAnswer, getCandidates } from './services';

export interface DiagnosticResult {
  timestamp: string;
  roomId: string;
  step: string;
  status: 'success' | 'error' | 'pending' | 'warning';
  message: string;
  data?: unknown;
}

export class ReunionDiagnostics {
  private roomId: string;
  private role: 'caller' | 'callee';
  private results: DiagnosticResult[] = [];

  constructor(roomId: string, role: 'caller' | 'callee') {
    this.roomId = roomId;
    this.role = role;
  }

  private log(step: string, status: DiagnosticResult['status'], message: string, data?: unknown) {
    const result: DiagnosticResult = {
      timestamp: new Date().toISOString(),
      roomId: this.roomId,
      step,
      status,
      message,
      data
    };
    this.results.push(result);
    
    const emoji = {
      success: '✅',
      error: '❌',
      pending: '⏳',
      warning: '⚠️'
    }[status];
    
    console.log(`[Diagnóstico ${emoji}] ${this.role.toUpperCase()} - ${step}: ${message}`, data || '');
    
    return result;
  }

  /**
   * Verifica que la sala existe y tiene el estado esperado
   */
  async checkRoomState(): Promise<DiagnosticResult> {
    try {
      const state = await getState(this.roomId);
      
      if (this.role === 'caller') {
        // Caller debe ver su propia offer
        if (state.hasOffer) {
          return this.log(
            '1. Room State (Caller)',
            'success',
            'Sala existe y tiene offer publicada',
            state
          );
        } else {
          return this.log(
            '1. Room State (Caller)',
            'warning',
            'Sala existe pero no tiene offer aún (normal si acaba de empezar)',
            state
          );
        }
      } else {
        // Callee debe ver la offer del caller
        if (state.hasOffer) {
          return this.log(
            '1. Room State (Callee)',
            'success',
            'Sala tiene offer disponible del médico',
            state
          );
        } else {
          return this.log(
            '1. Room State (Callee)',
            'error',
            'La sala NO tiene offer. El médico debe iniciar primero.',
            state
          );
        }
      }
    } catch (error) {
      return this.log(
        '1. Room State',
        'error',
        `Error al verificar estado de sala: ${error}`,
        error
      );
    }
  }

  /**
   * Verifica que la offer está disponible
   */
  async checkOffer(): Promise<DiagnosticResult> {
    try {
      const { offer } = await getOffer(this.roomId);
      
      if (offer) {
        // Intentar parsear el SDP
        try {
          const parsed = JSON.parse(offer);
          if (parsed.type === 'offer' && parsed.sdp) {
            return this.log(
              '2. GET /offer',
              'success',
              `Offer válida recibida (${parsed.sdp.length} caracteres SDP)`,
              { type: parsed.type, sdpLength: parsed.sdp.length }
            );
          } else {
            return this.log(
              '2. GET /offer',
              'error',
              'Offer existe pero formato inválido (falta type o sdp)',
              parsed
            );
          }
        } catch (e) {
          return this.log(
            '2. GET /offer',
            'error',
            'Offer existe pero no es JSON válido',
            { offer, error: e }
          );
        }
      } else {
        if (this.role === 'caller') {
          return this.log(
            '2. GET /offer',
            'pending',
            'Offer aún no publicada (normal si acabas de crear la sala)',
            null
          );
        } else {
          return this.log(
            '2. GET /offer',
            'error',
            'No hay offer disponible. El médico debe iniciar la reunión primero.',
            null
          );
        }
      }
    } catch (error) {
      return this.log(
        '2. GET /offer',
        'error',
        `Error al obtener offer: ${error}`,
        error
      );
    }
  }

  /**
   * Verifica que la answer está disponible
   */
  async checkAnswer(): Promise<DiagnosticResult> {
    try {
      const { answer } = await getAnswer(this.roomId);
      
      if (answer) {
        // Intentar parsear el SDP
        try {
          const parsed = JSON.parse(answer);
          if (parsed.type === 'answer' && parsed.sdp) {
            return this.log(
              '3. GET /answer',
              'success',
              `Answer válida recibida (${parsed.sdp.length} caracteres SDP)`,
              { type: parsed.type, sdpLength: parsed.sdp.length }
            );
          } else {
            return this.log(
              '3. GET /answer',
              'error',
              'Answer existe pero formato inválido (falta type o sdp)',
              parsed
            );
          }
        } catch (e) {
          return this.log(
            '3. GET /answer',
            'error',
            'Answer existe pero no es JSON válido',
            { answer, error: e }
          );
        }
      } else {
        if (this.role === 'callee') {
          return this.log(
            '3. GET /answer',
            'pending',
            'Answer aún no publicada (normal si acabas de responder)',
            null
          );
        } else {
          return this.log(
            '3. GET /answer',
            'warning',
            'No hay answer aún. El paciente debe unirse y responder.',
            null
          );
        }
      }
    } catch (error) {
      return this.log(
        '3. GET /answer',
        'error',
        `Error al obtener answer: ${error}`,
        error
      );
    }
  }

  /**
   * Verifica ICE candidates
   */
  async checkCandidates(): Promise<DiagnosticResult> {
    try {
      const forRole = this.role === 'caller' ? 'caller' : 'callee';
      const { candidates } = await getCandidates(this.roomId, forRole);
      
      if (candidates && candidates.length > 0) {
        return this.log(
          '4. GET /candidates',
          'success',
          `${candidates.length} ICE candidate(s) disponibles`,
          { count: candidates.length, firstCandidate: candidates[0] }
        );
      } else {
        return this.log(
          '4. GET /candidates',
          'pending',
          'No hay ICE candidates aún (normal al inicio)',
          { count: 0 }
        );
      }
    } catch (error) {
      return this.log(
        '4. GET /candidates',
        'error',
        `Error al obtener candidates: ${error}`,
        error
      );
    }
  }

  /**
   * Ejecuta diagnóstico completo
   */
  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    console.log(`\n🔍 ====== DIAGNÓSTICO WEBRTC (${this.role.toUpperCase()}) ======`);
    console.log(`📍 Sala: ${this.roomId}`);
    console.log(`⏰ Hora: ${new Date().toLocaleString()}\n`);
    
    this.results = [];

    await this.checkRoomState();
    await this.checkOffer();
    await this.checkAnswer();
    await this.checkCandidates();

    // Resumen
    const errors = this.results.filter(r => r.status === 'error').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const success = this.results.filter(r => r.status === 'success').length;

    console.log(`\n📊 ====== RESUMEN DEL DIAGNÓSTICO ======`);
    console.log(`✅ Exitosos: ${success}`);
    console.log(`⚠️  Advertencias: ${warnings}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`======================================\n`);

    if (errors > 0) {
      console.error('⚠️  SE ENCONTRARON ERRORES CRÍTICOS');
      console.error('Revisa los logs anteriores para más detalles');
    } else if (warnings > 0) {
      console.warn('⚠️  Hay advertencias pero el flujo puede continuar');
    } else {
      console.log('✅ Todo parece correcto!');
    }

    return this.results;
  }

  /**
   * Genera reporte HTML para mostrar en UI
   */
  generateHTMLReport(): string {
    const statusColors = {
      success: '#10b981',
      error: '#ef4444',
      pending: '#f59e0b',
      warning: '#f59e0b'
    };

    const statusEmojis = {
      success: '✅',
      error: '❌',
      pending: '⏳',
      warning: '⚠️'
    };

    return `
      <div style="font-family: monospace; background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px;">
        <h3 style="color: #60a5fa; margin-top: 0;">🔍 Diagnóstico WebRTC - ${this.role.toUpperCase()}</h3>
        <p style="color: #94a3b8; font-size: 12px;">Sala: ${this.roomId}</p>
        
        ${this.results.map(r => `
          <div style="margin: 12px 0; padding: 12px; background: #334155; border-left: 4px solid ${statusColors[r.status]}; border-radius: 4px;">
            <div style="font-weight: bold; color: ${statusColors[r.status]};">
              ${statusEmojis[r.status]} ${r.step}
            </div>
            <div style="margin-top: 4px; font-size: 14px;">
              ${r.message}
            </div>
            ${r.data ? `
              <details style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
                <summary style="cursor: pointer;">Ver datos</summary>
                <pre style="margin-top: 8px; overflow-x: auto; background: #1e293b; padding: 8px; border-radius: 4px;">${JSON.stringify(r.data, null, 2)}</pre>
              </details>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  getResults() {
    return this.results;
  }
}

/**
 * Hook rápido para diagnóstico en consola
 */
export async function quickDiagnostic(roomId: string, role: 'caller' | 'callee') {
  const diag = new ReunionDiagnostics(roomId, role);
  await diag.runFullDiagnostic();
  return diag.getResults();
}
