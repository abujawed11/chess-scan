import { useState } from 'react';

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  style = {},
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    default: {
      base: {
        background: disabled ? '#e5e7eb' : '#f3f4f6',
        color: '#111',
      },
      hover: {
        background: '#e5e7eb',
      }
    },
    primary: {
      base: {
        background: disabled ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: '#fff',
      },
      hover: {
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      }
    },
    success: {
      base: {
        background: disabled ? '#86efac' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
      },
      hover: {
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      }
    },
    danger: {
      base: {
        background: disabled ? '#fca5a5' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#fff',
      },
      hover: {
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      }
    },
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 16px',
        border: 'none',
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        fontSize: 14,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        transform: isHovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        ...selectedVariant.base,
        ...(isHovered && !disabled ? selectedVariant.hover : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
