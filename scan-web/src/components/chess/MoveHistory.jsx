export default function MoveHistory({ moves }) {
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {moves.reduce((acc, move, i) => {
            if (i % 2 === 0) {
              acc.push([move]);
            } else {
              acc[acc.length - 1].push(move);
            }
            return acc;
          }, []).map((pair, i) => (
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
              <div style={{ fontWeight: 600 }}>{pair[0].san}</div>
              <div style={{ fontWeight: 600 }}>{pair[1]?.san || ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
