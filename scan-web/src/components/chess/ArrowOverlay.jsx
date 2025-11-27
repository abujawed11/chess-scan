import { squareToUnitXY } from '../../utils/chessUtils';

export default function ArrowOverlay({ bestMove, show }) {
  if (!show || !bestMove) return null;

  const from = bestMove.slice(0, 2);
  const to = bestMove.slice(2, 4);

  const p1 = squareToUnitXY(from);
  const p2 = squareToUnitXY(to);
  if (!p1 || !p2) return null;

  return (
    <svg
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Arrowhead */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="3"
          markerHeight="3"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <polygon points="0 0, 5 2.5, 0 5" fill="rgba(16,185,129,0.7)" />
        </marker>
      </defs>

      {/* Main arrow line */}
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="rgba(16,185,129,0.6)"
        strokeWidth="0.12"
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
        style={{ filter: 'drop-shadow(0 0 0.15px rgba(0,0,0,0.5))' }}
      />
    </svg>
  );
}
