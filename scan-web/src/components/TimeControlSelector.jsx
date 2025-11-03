import React, { useState } from 'react';
import { TIME_CONTROLS, DEFAULT_TIME_CONTROL } from '../utils/constants';

export default function TimeControlSelector({ onSelect, onCancel }) {
  const [selectedControl, setSelectedControl] = useState(DEFAULT_TIME_CONTROL);

  // Group time controls by category
  const categories = {
    '⚡ Bullet': [
      TIME_CONTROLS.BULLET_1_0,
      TIME_CONTROLS.BULLET_1_1,
      TIME_CONTROLS.BULLET_2_1,
    ],
    '⚙️ Blitz': [
      TIME_CONTROLS.BLITZ_3_0,
      TIME_CONTROLS.BLITZ_3_2,
      TIME_CONTROLS.BLITZ_5_0,
      TIME_CONTROLS.BLITZ_5_3,
    ],
    '📈 Rapid': [
      TIME_CONTROLS.RAPID_10_0,
      TIME_CONTROLS.RAPID_10_5,
      TIME_CONTROLS.RAPID_15_10,
    ],
    '♟️ Classical': [
      TIME_CONTROLS.CLASSICAL_30_0,
      TIME_CONTROLS.CLASSICAL_30_20,
    ],
    '∞ Unlimited': [TIME_CONTROLS.UNLIMITED],
  };

  const handleSelect = (timeControl) => {
    setSelectedControl(timeControl);
  };

  const handleStart = () => {
    onSelect(selectedControl);
  };

  const buttonStyle = (isSelected) => ({
    padding: '10px 16px',
    borderRadius: '8px',
    border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
    background: isSelected ? '#dbeafe' : '#ffffff',
    cursor: 'pointer',
    fontWeight: isSelected ? '600' : '500',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    color: isSelected ? '#1e40af' : '#374151',
    minWidth: '80px',
  });

  const categoryHeaderStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: '#6b7280',
    marginTop: '16px',
    marginBottom: '8px',
  };

  const categoryGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
  };

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '700px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}
    >
      <h1
        style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}
      >
        ⏱️ Select Time Control
      </h1>

      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>
        Choose how much time each player gets per game
      </p>

      {/* Time Control Categories */}
      <div style={{ marginBottom: '32px' }}>
        {Object.entries(categories).map(([category, controls]) => (
          <div key={category}>
            <div style={categoryHeaderStyle}>{category}</div>
            <div style={categoryGroupStyle}>
              {controls.map((control) => (
                <button
                  key={control.name}
                  style={buttonStyle(selectedControl.name === control.name)}
                  onClick={() => handleSelect(control)}
                  title={control.description}
                >
                  {control.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Control Info */}
      {selectedControl && (
        <div
          style={{
            padding: '16px',
            background: '#f0f9ff',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
            Selected Time Control
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
            {selectedControl.name}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {selectedControl.description}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        <button
          onClick={handleStart}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
        >
          ▶️ Start Game
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#e5e7eb')}
          onMouseLeave={(e) => (e.target.style.background = '#f3f4f6')}
        >
          ← Back
        </button>
      </div>

      {/* Helpful Tips */}
      <div style={{ marginTop: '24px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
        <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.6' }}>
          <strong>💡 Tip:</strong> Choose based on your playing style:
          <br />• Bullet: Lightning fast, no thinking time
          <br />• Blitz: Quick games, good for casual play
          <br />• Rapid: Balanced, time to think
          <br />• Classical: Long games, plenty of time
        </div>
      </div>
    </div>
  );
}
