export default function AnalysisPanel({ evaluation, moveCount, gameOver }) {
  return (
    <div style={{
      background: '#f9fafb',
      borderRadius: 12,
      padding: 16
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>
        📊 Analysis
      </h3>
      <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Evaluation:</span>
          <span style={{
            fontWeight: 600,
            color: evaluation > 0 ? '#10b981' : evaluation < 0 ? '#ef4444' : '#6b7280'
          }}>
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Moves played:</span>
          <span style={{ fontWeight: 600 }}>{moveCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Status:</span>
          <span style={{ fontWeight: 600 }}>
            {gameOver ? 'Finished' : 'In Progress'}
          </span>
        </div>
      </div>
    </div>
  );
}
