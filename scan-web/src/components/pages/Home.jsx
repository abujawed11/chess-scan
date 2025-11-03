import { useState } from 'react';
import ModeCard from '../ui/ModeCard';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function Home({ onModeSelect }) {
  const [showFenInput, setShowFenInput] = useState(false);
  const [fenInput, setFenInput] = useState('');

  const handleLoadFromFen = () => {
    if (fenInput.trim()) {
      onModeSelect('play', { fen: fenInput.trim() });
    }
  };

  return (
    <div style={{
      padding: 20,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 48,
        maxWidth: 800,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            margin: 0,
            marginBottom: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ♟️ Chess Scan
          </h1>
          <p style={{
            fontSize: 18,
            color: '#6b7280',
            margin: 0
          }}>
            Play, Analyze, and Scan Chess Positions
          </p>
        </div>

        {/* Main Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          marginBottom: 24
        }}>
          <ModeCard
            icon="🎮"
            title="Play New Game"
            description="Start a fresh chess game with various modes"
            onClick={() => onModeSelect('play')}
          />

          <ModeCard
            icon="🔍"
            title="Analysis Board"
            description="Analyze positions with Stockfish engine"
            onClick={() => onModeSelect('analyze')}
          />

          <ModeCard
            icon="📸"
            title="Scan from Photo"
            description="Upload a photo and extract the board position"
            onClick={() => onModeSelect('scan')}
          />

          <ModeCard
            icon="📋"
            title="Load from FEN"
            description="Input a FEN string to analyze or play"
            onClick={() => setShowFenInput(!showFenInput)}
          />
        </div>

        {/* FEN Input Section */}
        {showFenInput && (
          <div style={{
            padding: 20,
            background: '#f9fafb',
            borderRadius: 12,
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: 16,
              color: '#374151',
              fontWeight: 600
            }}>
              Load Position from FEN
            </h3>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: 14,
              color: '#6b7280'
            }}>
              Enter a FEN (Forsyth-Edwards Notation) string to load a specific position
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Input
                placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleLoadFromFen}
                disabled={!fenInput.trim()}
                variant="primary"
              >
                Load Position
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: '2px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 14,
            color: '#9ca3af',
            margin: 0
          }}>
            Powered by Stockfish • Built with React
          </p>
        </div>
      </div>
    </div>
  );
}
