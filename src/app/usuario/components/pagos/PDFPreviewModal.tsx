import React, { useState } from 'react';
import './PDFPreviewModal.css';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pagoId: string | number;
  onDownload: () => void;
}

export default function PDFPreviewModal({ isOpen, onClose, pagoId, onDownload }: PDFPreviewModalProps) {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  React.useEffect(() => {
    if (isOpen && pagoId && pagoId !== 0) {
      console.log('🔍 Modal abierto, iniciando carga:', { 
        isOpen, 
        pagoId, 
        pagoIdType: typeof pagoId,
        isValid: Boolean(pagoId && pagoId !== 0)
      });
      
      setLoading(true);
      setError(null);
      setPdfBase64(null);
      setFileName(null);

      const fetchPDF = async () => {
        try {
          const url = `/pdf/preview?id=${pagoId}`;
          console.log('📡 Haciendo fetch a:', url);
          
          const response = await fetch(url);
          
          console.log('📨 Response recibida:', { 
            status: response.status, 
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('📋 Datos parseados:', {
            hasBase64: !!data.pdfBase64,
            base64Length: data.pdfBase64?.length || 0,
            base64Start: data.pdfBase64?.substring(0, 50) || 'N/A',
            fileName: data.fileName,
            hasPayoInfo: !!data.pagoInfo
          });
          
          if (data.pdfBase64) {
            setPdfBase64(data.pdfBase64);
            setFileName(data.fileName || `recibo_${pagoId}`);
            setIframeLoaded(false);
            setShowFallback(false);
            console.log('✅ PDF configurado en estado con nombre:', data.fileName || `recibo_${pagoId}`);
          } else {
            throw new Error('No se recibió pdfBase64 en la respuesta');
          }
        } catch (err) {
          console.error('❌ Error completo:', err);
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido cargando vista previa';
          setError(errorMessage);
          console.error('Error message set:', errorMessage);
        } finally {
          console.log('🔄 Finalizando carga, setLoading(false)');
          setLoading(false);
        }
      };

      fetchPDF();
    } else {
      console.log('⏸️ Modal no iniciará fetch:', { isOpen, pagoId, pagoIdType: typeof pagoId });
    }
  }, [isOpen, pagoId]);

  // Timer para mostrar fallback si el iframe no carga
  React.useEffect(() => {
    if (pdfBase64 && !iframeLoaded && !showFallback) {
      const fallbackTimer = setTimeout(() => {
        console.log('⚠️ Iframe tardó más de 3 segundos, mostrando fallback');
        setShowFallback(true);
      }, 3000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [pdfBase64, iframeLoaded, showFallback]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      if (fileName) {
        // Usar el endpoint directo para descarga con nombre correcto
        const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
        const a = document.createElement('a');
        a.href = `/pdf/recibo?id=${pagoId}`;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('✅ Descarga iniciada con nombre:', finalFileName);
      } else {
        // Fallback al método original
        onDownload();
      }
    } catch (error) {
      console.error('Error en descarga:', error);
      onDownload();
    }
    onClose();
  };

  return (
    <div className="pdf-preview-overlay" onClick={onClose}>
      <div className="pdf-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="pdf-preview-header">
          <h3>Vista Previa del Recibo</h3>
          <div className="pdf-preview-actions">
            {fileName && (
              <button 
                className="btn-download" 
                onClick={handleDownload}
                title="Descargar PDF"
              >
                ⬇️ Descargar
              </button>
            )}
            <button className="btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        
        <div className="pdf-preview-content">
          {loading && (
            <div className="pdf-preview-loading">
              <div className="spinner"></div>
              <p>Generando vista previa...</p>
            </div>
          )}
          
          {error && (
            <div className="pdf-preview-error">
              <p>⚠️ {error}</p>
              <button onClick={() => window.location.reload()}>
                Reintentar
              </button>
            </div>
          )}
          
          {!loading && !error && pdfBase64 && (
            <div className="pdf-preview-viewer">
              <div className="pdf-preview-container" style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: '#f5f5f5'
              }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <iframe
                    src={`/pdf/recibo?id=${pagoId}&preview=true`}
                    width="100%"
                    height="100%"
                    title={fileName ? (fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`) : `recibo_${pagoId}.pdf`}
                    style={{ 
                      border: 'none',
                      backgroundColor: 'white'
                    }}
                    onLoad={() => {
                      console.log('📄 Iframe con endpoint de preview cargado correctamente');
                      setIframeLoaded(true);
                    }}
                    onError={(e) => {
                      console.error('❌ Error cargando iframe de preview:', e);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="pdf-preview-footer">
          <p className="pdf-preview-info">
            📄 {fileName ? (fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`) : `recibo_${pagoId}.pdf`} - VirtualAid
          </p>
        </div>
      </div>
    </div>
  );
}