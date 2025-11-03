import Square from './Square';
import ArrowOverlay from './ArrowOverlay';
import { FILES, RANKS } from '../../utils/constants';
import { isLightSquare, getSquareNotation } from '../../utils/chessUtils';

export default function ChessBoard({
  position,
  selectedSquare,
  legalMoves,
  lastMove,
  bestMove,
  showBestMoveArrow,
  onSquareClick,
  gameMode,
}) {
  const board = [];

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = getSquareNotation(file, rank);
      const piece = position[rank][file];
      const isLight = isLightSquare(rank, file);
      const isSelected = selectedSquare === square;
      const isLegalMove = legalMoves.includes(square);
      const isLastMove = lastMove &&
        (lastMove.from === square || lastMove.to === square);

      const bestMoveFrom = bestMove ? bestMove.slice(0, 2) : null;
      const bestMoveTo = bestMove ? bestMove.slice(2, 4) : null;
      const isBestMoveSquare =
        gameMode === 'analyze' &&
        bestMove &&
        (square === bestMoveFrom || square === bestMoveTo);

      board.push({
        square,
        piece,
        isLight,
        isSelected,
        isLegalMove,
        isLastMove,
        isBestMoveSquare,
      });
    }
  }

  return (
    <div style={{
      border: '4px solid #8b5cf6',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
      background: '#312e81',
      padding: 12,
      width: 560,
      height: 560,
      margin: '0 auto',
      position: 'relative'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        width: '100%',
        height: '100%',
        gap: 0
      }}>
        {board.map((squareData) => (
          <Square
            key={squareData.square}
            {...squareData}
            onClick={() => onSquareClick(squareData.square)}
          />
        ))}
      </div>

      {/* Arrow overlay for best move */}
      <ArrowOverlay
        bestMove={bestMove}
        show={showBestMoveArrow}
      />
    </div>
  );
}
