// src/components/review/NavigationControls.jsx
export default function NavigationControls({
  isPlaying,
  playSpeed,
  currentPly,
  totalPlies,
  onPrevious,
  onNext,
  onStart,
  onEnd,
  onTogglePlay,
  onSpeedChange,
}) {
  const speeds = [0.5, 1, 2];

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 16,
    }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontSize: 13,
          color: '#6b7280',
        }}>
          <span>Move {Math.floor(currentPly / 2)} / {Math.floor(totalPlies / 2)}</span>
          <span>{currentPly} / {totalPlies} plies</span>
        </div>

        <input
          type="range"
          min={0}
          max={totalPlies}
          value={currentPly}
          onChange={(e) => {
            const ply = parseInt(e.target.value, 10);
            // This would need to be passed as onSeek prop
            // For now, we can use onNext/onPrevious multiple times
          }}
          style={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            appearance: 'none',
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentPly / totalPlies) * 100}%, #e5e7eb ${(currentPly / totalPlies) * 100}%, #e5e7eb 100%)`,
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Main Controls */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 12,
      }}>
        {/* Go to Start */}
        <NavButton
          onClick={onStart}
          disabled={currentPly === 0}
          title="Go to start"
        >
          ⏮️
        </NavButton>

        {/* Previous Move */}
        <NavButton
          onClick={onPrevious}
          disabled={currentPly === 0}
          title="Previous move (←)"
        >
          ⏪
        </NavButton>

        {/* Play/Pause */}
        <NavButton
          onClick={onTogglePlay}
          disabled={currentPly >= totalPlies}
          primary
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </NavButton>

        {/* Next Move */}
        <NavButton
          onClick={onNext}
          disabled={currentPly >= totalPlies}
          title="Next move (→)"
        >
          ⏩
        </NavButton>

        {/* Go to End */}
        <NavButton
          onClick={onEnd}
          disabled={currentPly >= totalPlies}
          title="Go to end"
        >
          ⏭️
        </NavButton>
      </div>

      {/* Speed Control */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 0',
        borderTop: '1px solid #e5e7eb',
      }}>
        <span style={{
          fontSize: 13,
          color: '#6b7280',
          fontWeight: 500,
        }}>
          Speed:
        </span>

        <div style={{
          display: 'flex',
          gap: 4,
          flex: 1,
        }}>
          {speeds.map(speed => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: playSpeed === speed ? '2px solid #3b82f6' : '1px solid #d1d5db',
                background: playSpeed === speed ? '#dbeafe' : 'white',
                color: playSpeed === speed ? '#1e40af' : '#374151',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: playSpeed === speed ? 600 : 400,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div style={{
        marginTop: 12,
        padding: 10,
        background: '#f9fafb',
        borderRadius: 6,
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
      }}>
        Use ← → arrow keys to navigate
      </div>
    </div>
  );
}

function NavButton({ onClick, disabled, children, title, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        flex: 1,
        padding: '12px',
        border: primary ? 'none' : '2px solid #e5e7eb',
        background: disabled
          ? '#f3f4f6'
          : primary
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'white',
        color: disabled ? '#9ca3af' : primary ? 'white' : '#374151',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 18,
        fontWeight: 600,
        transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !primary) {
          e.currentTarget.style.background = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !primary) {
          e.currentTarget.style.background = 'white';
        }
      }}
    >
      {children}
    </button>
  );
}
