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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && pagoId) {
      setLoading(true);
      setError(null);
      setPdfBase64(null);

      fetch(`/pdf/preview?id=${pagoId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.pdfBase64) {
            setPdfBase64(data.pdfBase64);
          } else {
            throw new Error('No se recibió el PDF');
          }
        })
        .catch(err => {
          console.error('Error cargando preview:', err);
          setError(err.message || 'Error cargando vista previa');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, pagoId]);

  if (!isOpen) return null;

  const handleDownload = () => {
    onDownload();
    onClose();
  };

  return (
    <div className="pdf-preview-overlay" onClick={onClose}>
      <div className="pdf-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="pdf-preview-header">
          <h3>Vista Previa del Recibo</h3>
          <div className="pdf-preview-actions">
            <button 
              className="btn-download"
              onClick={handleDownload}
              disabled={loading || !!error}
            >
              📥 Descargar PDF
            </button>
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
          
          {pdfBase64 && !loading && !error && (
            <div className="pdf-preview-viewer">
              <iframe
                src={pdfBase64}
                width="100%"
                height="100%"
                title="Vista previa del recibo"
                style={{ border: 'none' }}
              />
            </div>
          )}
        </div>
        
        <div className="pdf-preview-footer">
          <p className="pdf-preview-info">
            📄 Recibo #{pagoId} - VirtualAid
          </p>
        </div>
      </div>
    </div>
  );
}