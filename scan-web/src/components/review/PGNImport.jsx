// src/components/review/PGNImport.jsx
import { useState, useEffect } from 'react';
import { isValidPGN } from '../../utils/pgn/pgnParser';

export default function PGNImport({ onImport, onCancel, externalError }) {
  const [pgnText, setPgnText] = useState('');
  const [error, setError] = useState(null);

  // Update local error when external error changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setPgnText(text);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!pgnText.trim()) {
      setError('Please enter or upload a PGN');
      return;
    }

    // Clear local error and let parent handle validation
    setError(null);
    onImport(pgnText);
  };

  const handleLoadSample = () => {
    // Sample Immortal Game
    const samplePGN = `[Event "London"]
[Site "London ENG"]
[Date "1851.06.21"]
[Round "?"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]
[ECO "C33"]
[Opening "King's Gambit Accepted, Bishop's Gambit"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6
7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6
13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2
18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6
23. Be7# 1-0`;

    setPgnText(samplePGN);
    setError(null);
  };

  return (
    <div style={{
      padding: 40,
      maxWidth: 800,
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          📋 Import PGN for Review
        </h2>

        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
          Upload a PGN file or paste PGN text to analyze your game
        </p>

        {/* File Upload */}
        <div style={{
          border: '2px dashed #d1d5db',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          marginBottom: 16,
          background: '#f9fafb',
        }}>
          <input
            id="pgn-file"
            type="file"
            accept=".pgn,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="pgn-file"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            📁 Choose PGN File
          </label>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
            or drag and drop a .pgn file
          </div>
        </div>

        {/* Text Area */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            color: '#374151',
          }}>
            Or Paste PGN Text:
          </label>
          <textarea
            value={pgnText}
            onChange={(e) => {
              setPgnText(e.target.value);
              setError(null);
            }}
            placeholder="[Event &quot;?&quot;]&#10;[Site &quot;?&quot;]&#10;[Date &quot;????.??.??&quot;]&#10;...&#10;&#10;1. e4 e5 2. Nf3 Nc6 ..."
            style={{
              width: '100%',
              minHeight: 200,
              padding: 12,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: 12,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#b91c1c',
            marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={handleLoadSample}
            style={{
              padding: '10px 16px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            📖 Load Sample Game
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleImport}
              disabled={!pgnText.trim()}
              style={{
                padding: '10px 24px',
                background: pgnText.trim() ?
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: pgnText.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              ✓ Import & Review
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#eff6ff',
          borderRadius: 8,
          fontSize: 13,
          color: '#1e40af',
        }}>
          <strong>💡 Tip:</strong> You can export PGN from chess.com, lichess.org, or any chess software.
          The game will be analyzed move-by-move with quality labels and accuracy scores.
        </div>
      </div>
    </div>
  );
}
