import React from 'react';

export default function ChessTimer({
  whiteTime,
  blackTime,
  isWhiteTurn,
  whiteTimedOut,
  blackTimedOut,
  formatTime,
  getTimeColor,
  timeControl,
}) {
  const clockStyle = (isActive, timeColor) => ({
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    backgroundColor: isActive ? '#f0fdf4' : '#f9fafb',
    border: `3px solid ${isActive ? '#10b981' : '#e5e7eb'}`,
    transition: 'all 0.3s ease',
  });

  const timeDisplayStyle = {
    fontSize: '48px',
    fontWeight: '700',
    fontFamily: 'monospace',
    margin: '8px 0',
    transition: 'color 0.3s ease',
  };

  const playerLabelStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
  };

  const warningIconStyle = {
    marginLeft: '8px',
    fontSize: '20px',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
      }}
    >
      {/* Black Clock (Top/Left) */}
      <div style={clockStyle(!isWhiteTurn, getTimeColor(blackTime))}>
        <div style={playerLabelStyle}>
          ♚ Black {!isWhiteTurn && '(Thinking)'}
        </div>
        <div style={{ ...timeDisplayStyle, color: getTimeColor(blackTime) }}>
          {formatTime(blackTime)}
          {blackTimedOut && <span style={warningIconStyle}>⏱️</span>}
          {blackTime <= 10 && blackTime > 0 && !blackTimedOut && (
            <span style={warningIconStyle}>⚠️</span>
          )}
        </div>
        {blackTimedOut && (
          <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px' }}>
            Time!
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          {timeControl?.name || ''}
        </div>
      </div>

      {/* White Clock (Top/Right) */}
      <div style={clockStyle(isWhiteTurn, getTimeColor(whiteTime))}>
        <div style={playerLabelStyle}>
          ♔ White {isWhiteTurn && '(Thinking)'}
        </div>
        <div style={{ ...timeDisplayStyle, color: getTimeColor(whiteTime) }}>
          {formatTime(whiteTime)}
          {whiteTimedOut && <span style={warningIconStyle}>⏱️</span>}
          {whiteTime <= 10 && whiteTime > 0 && !whiteTimedOut && (
            <span style={warningIconStyle}>⚠️</span>
          )}
        </div>
        {whiteTimedOut && (
          <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px' }}>
            Time!
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          {timeControl?.name || ''}
        </div>
      </div>
    </div>
  );
}
