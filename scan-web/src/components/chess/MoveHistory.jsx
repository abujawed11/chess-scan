import { QUALITY_CONFIG } from '../../utils/pgn/moveQuality';

export default function MoveHistory({ moves, moveQualities = [] }) {
  return (
    <div style={{
      background: '#f9fafb',
      borderRadius: 12,
      padding: 16,
      maxHeight: 400,
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>
        📜 Move History
      </h3>
      {moves.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 14 }}>No moves yet</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          {moves.reduce((acc, move, i) => {
            if (i % 2 === 0) {
              acc.push([move]);
            } else {
              acc[acc.length - 1].push(move);
            }
            return acc;
          }, []).map((pair, i) => {
            // Find move qualities for this move pair
            const whiteQuality = moveQualities.find(q => 
              q.moveNumber === i + 1 && q.color === 'w'
            );
            const blackQuality = moveQualities.find(q => 
              q.moveNumber === i + 1 && q.color === 'b'
            );

            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '30px 1fr 1fr',
                gap: 8,
                padding: '6px 8px',
                background: 'white',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: 'monospace'
              }}>
                <div style={{ color: '#6b7280', fontWeight: 600 }}>{i + 1}.</div>
                
                {/* White move */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4,
                  fontWeight: 600 
                }}>
                  <span>{pair[0].san}</span>
                  {whiteQuality && (
                    <span 
                      style={{
                        fontSize: 10,
                        padding: '2px 4px',
                        borderRadius: 4,
                        background: QUALITY_CONFIG[whiteQuality.quality]?.bgColor || '#f3f4f6',
                        color: QUALITY_CONFIG[whiteQuality.quality]?.color || '#6b7280',
                        fontWeight: 700
                      }}
                      title={`${QUALITY_CONFIG[whiteQuality.quality]?.label || 'Unknown'} (${whiteQuality.evalDelta?.toFixed(1) || 'N/A'}cp)`}
                    >
                      {QUALITY_CONFIG[whiteQuality.quality]?.symbol || ''}
                    </span>
                  )}
                </div>
                
                {/* Black move */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4,
                  fontWeight: 600 
                }}>
                  <span>{pair[1]?.san || ''}</span>
                  {blackQuality && pair[1] && (
                    <span 
                      style={{
                        fontSize: 10,
                        padding: '2px 4px',
                        borderRadius: 4,
                        background: QUALITY_CONFIG[blackQuality.quality]?.bgColor || '#f3f4f6',
                        color: QUALITY_CONFIG[blackQuality.quality]?.color || '#6b7280',
                        fontWeight: 700
                      }}
                      title={`${QUALITY_CONFIG[blackQuality.quality]?.label || 'Unknown'} (${blackQuality.evalDelta?.toFixed(1) || 'N/A'}cp)`}
                    >
                      {QUALITY_CONFIG[blackQuality.quality]?.symbol || ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
