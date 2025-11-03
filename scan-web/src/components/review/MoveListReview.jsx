// src/components/review/MoveListReview.jsx
import { QUALITY_CONFIG } from '../../utils/pgn/moveQuality';

export default function MoveListReview({ moves, currentPly, onMoveClick }) {
  if (!moves || moves.length === 0) {
    return (
      <div style={{
        padding: 24,
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        No moves to display
      </div>
    );
  }

  // Group moves by move number (pair white and black moves)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
    }}>
      {/* Legend/Helper Section */}
      <AnnotationLegend />

      {/* Move List */}
      <div style={{
        maxHeight: 500,
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 1fr 1fr',
          padding: '12px 16px',
          borderBottom: '2px solid #e5e7eb',
          background: '#f9fafb',
          fontWeight: 600,
          fontSize: 13,
          color: '#6b7280',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          <div>#</div>
          <div>White</div>
          <div>Black</div>
        </div>

        {/* Move List */}
        <div>
          {movePairs.map((pair) => (
            <div
              key={pair.moveNumber}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 1fr',
                padding: '8px 16px',
                borderBottom: '1px solid #f3f4f6',
                fontSize: 14,
              }}
            >
              {/* Move Number */}
              <div style={{
                color: '#9ca3af',
                fontWeight: 600,
              }}>
                {pair.moveNumber}.
              </div>

              {/* White Move */}
              {pair.white && (
                <MoveCell
                  move={pair.white}
                  isActive={currentPly === pair.white.ply}
                  onClick={() => onMoveClick(pair.white.ply)}
                />
              )}
              {!pair.white && <div />}

              {/* Black Move */}
              {pair.black && (
                <MoveCell
                  move={pair.black}
                  isActive={currentPly === pair.black.ply}
                  onClick={() => onMoveClick(pair.black.ply)}
                />
              )}
              {!pair.black && <div />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnotationLegend() {
  const legends = [
    { symbol: '📖', label: 'Book', description: 'Opening book move' },
    { symbol: '!!', label: 'Best', description: 'Best move (≤15cp)' },
    { symbol: '!', label: 'Excellent', description: 'Excellent move (≤50cp)' },
    { symbol: '', label: 'Good', description: 'Good move (≤120cp)' },
    { symbol: '?!', label: 'Inaccuracy', description: 'Inaccuracy (120-300cp)' },
    { symbol: '?', label: 'Mistake', description: 'Mistake (300-700cp)' },
    { symbol: '??', label: 'Blunder', description: 'Blunder (>700cp)' },
  ];

  return (
    <div style={{
      padding: 12,
      background: '#f0f9ff',
      borderBottom: '1px solid #e5e7eb',
      fontSize: 12,
    }}>
      <div style={{
        fontWeight: 600,
        color: '#1e40af',
        marginBottom: 8,
        fontSize: 11,
      }}>
        📚 Move Quality Legend
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 8,
      }}>
        {legends.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: 'white',
              borderRadius: 4,
              border: '1px solid #dbeafe',
            }}
            title={item.description}
          >
            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20 }}>
              {item.symbol || '—'}
            </span>
            <span style={{ color: '#1f2937', fontSize: 11 }}>
              <strong>{item.label}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoveCell({ move, isActive, onClick }) {
  const quality = move.quality;
  const config = quality ? QUALITY_CONFIG[quality] : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        background: isActive ? '#dbeafe' : 'transparent',
        border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {/* Move SAN */}
      <span style={{
        flex: 1,
        fontFamily: 'monospace',
        fontSize: 14,
      }}>
        {move.san}
      </span>

      {/* Quality Badge */}
      {config && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            background: config.bgColor,
            color: config.color,
          }}
          title={config.label}
        >
          {config.symbol || config.label}
        </span>
      )}

      {/* Comment Indicator */}
      {move.comment && (
        <span style={{ fontSize: 12, color: '#9ca3af' }} title={move.comment}>
          💬
        </span>
      )}
    </div>
  );
}
