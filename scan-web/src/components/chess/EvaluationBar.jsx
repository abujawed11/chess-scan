export default function EvaluationBar({ evaluation, turn }) {
  // Clamp evaluation between -10 and +10 for display
  const clampedEval = Math.max(-10, Math.min(10, evaluation));
  const whitePercent = 50 + (clampedEval / 20) * 50;

  return (
    <div style={{
      height: 32,
      background: '#1f2937',
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
      border: '2px solid #374151'
    }}>
      <div style={{
        height: '100%',
        width: `${whitePercent}%`,
        background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
        transition: 'width 0.5s ease'
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: 12,
        fontWeight: 600
      }}>
        <span style={{ color: whitePercent > 50 ? '#111' : '#fff' }}>
          ♔ {evaluation > 0 ? `+${evaluation.toFixed(1)}` : ''}
        </span>
        <span style={{ color: whitePercent < 50 ? '#fff' : '#111' }}>
          ♚ {evaluation < 0 ? evaluation.toFixed(1) : ''}
        </span>
      </div>
    </div>
  );
}
