import { getPieceImageUrl } from '../../utils/chessUtils';

export default function Square({
  square,
  piece,
  isLight,
  isSelected,
  isLegalMove,
  isLastMove,
  isBestMoveSquare,
  onClick,
  showCoordinates = true,
  flipped = false,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: isSelected
          ? '#f59e0b'
          : isBestMoveSquare
            ? 'rgba(16,185,129,0.35)'
            : isLastMove
              ? '#93c5fd'
              : isLight
                ? '#f0d9b5'
                : '#b58863',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
      }}
    >
      {/* Coordinates */}
      {showCoordinates && square[0] === 'a' && (
        <div style={{
          position: 'absolute',
          left: 4,
          top: 4,
          fontSize: 10,
          fontWeight: 700,
          color: isLight ? '#b58863' : '#f0d9b5',
          opacity: 0.7,
          userSelect: 'none',
          transform: flipped ? 'rotate(180deg)' : 'none'
        }}>
          {square[1]}
        </div>
      )}
      {showCoordinates && square[1] === '1' && (
        <div style={{
          position: 'absolute',
          right: 4,
          bottom: 4,
          fontSize: 10,
          fontWeight: 700,
          color: isLight ? '#b58863' : '#f0d9b5',
          opacity: 0.7,
          userSelect: 'none',
          transform: flipped ? 'rotate(180deg)' : 'none'
        }}>
          {square[0]}
        </div>
      )}

      {/* Piece */}
      {piece && (
        <img
          src={getPieceImageUrl(piece.color === 'w' ?
            piece.type.toUpperCase() : piece.type.toLowerCase())}
          alt={piece.type}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '8%',
            userSelect: 'none',
            pointerEvents: 'none',
            transform: flipped ? 'rotate(180deg)' : 'none'
          }}
        />
      )}

      {/* Legal move indicator */}
      {isLegalMove && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            width: piece ? '100%' : '30%',
            height: piece ? '100%' : '30%',
            borderRadius: '50%',
            background: piece ?
              'radial-gradient(circle, transparent 65%, rgba(34, 197, 94, 0.5) 65%)' :
              'rgba(34, 197, 94, 0.4)',
            border: piece ? 'none' : '3px solid rgba(34, 197, 94, 0.6)'
          }} />
        </div>
      )}
    </div>
  );
}
