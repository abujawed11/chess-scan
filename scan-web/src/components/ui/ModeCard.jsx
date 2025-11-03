import { useState } from 'react';

export default function ModeCard({
  icon,
  title,
  description,
  onClick,
  compact = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: compact ? 16 : 20,
        border: `2px solid ${isHovered ? '#8b5cf6' : '#e5e7eb'}`,
        borderRadius: 12,
        background: 'white',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 24px rgba(139, 92, 246, 0.2)' : 'none',
      }}
    >
      <div style={{ fontSize: compact ? 24 : 32, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: compact ? 14 : 16, fontWeight: 600, color: '#111' }}>{title}</div>
      <div style={{ fontSize: compact ? 12 : 13, color: '#6b7280' }}>{description}</div>
    </button>
  );
}
