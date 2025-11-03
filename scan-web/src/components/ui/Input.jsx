export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  style = {},
  ...props
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        padding: '12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: 10,
        fontSize: 14,
        outline: 'none',
        transition: 'all 0.2s ease',
        width: '100%',
        fontFamily: type === 'text' ? 'monospace' : 'inherit',
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#8b5cf6';
        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e5e7eb';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}
