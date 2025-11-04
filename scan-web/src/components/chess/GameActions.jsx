import { useState } from 'react';
import Button from '../ui/Button';

export default function GameActions({
  gameOver,
  moveCount,
  gameMode,
  playerColor,
  onResign,
  onDrawOffer,
  onAbort,
  onRematch,
  onNewGameSameSettings,
  onFlipBoard,
  boardFlipped = false,
}) {
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const [drawOfferSent, setDrawOfferSent] = useState(false);

  const canAbortGame = moveCount < 2;

  const handleResign = () => {
    onResign?.();
    setShowResignConfirm(false);
  };

  const handleAbort = () => {
    onAbort?.();
    setShowAbortConfirm(false);
  };

  const handleDrawOffer = () => {
    onDrawOffer?.();
    setDrawOfferSent(true);
    // Reset after a few seconds for demo
    setTimeout(() => setDrawOfferSent(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Game Action Buttons - Only show during active game */}
      {!gameOver && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}>
          {/* Draw Offer Button */}
          <Button
            onClick={handleDrawOffer}
            variant={drawOfferSent ? 'success' : 'secondary'}
            style={{ fontSize: 12 }}
          >
            {drawOfferSent ? '✓ Draw Offered' : '🤝 Draw'}
          </Button>

          {/* Resign Button */}
          <Button
            onClick={() => setShowResignConfirm(true)}
            variant="danger"
            style={{ fontSize: 12 }}
          >
            🏳️ Resign
          </Button>

          {/* Abort Game Button - Only show if < 2 moves */}
          {canAbortGame && (
            <Button
              onClick={() => setShowAbortConfirm(true)}
              variant="warning"
              style={{ fontSize: 12 }}
            >
              ⏸️ Abort
            </Button>
          )}

          {/* Flip Board Button */}
          <Button
            onClick={onFlipBoard}
            variant="secondary"
            style={{ fontSize: 12 }}
          >
            {boardFlipped ? '🔄 Flip Back' : '🔄 Flip'}
          </Button>
        </div>
      )}

      {/* Post-Game Buttons - Only show when game is over */}
      {gameOver && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}>
          {/* Request Rematch Button */}
          <Button
            onClick={onRematch}
            variant="success"
            style={{ fontSize: 12 }}
          >
            🎮 Rematch
          </Button>

          {/* New Game with Same Settings Button */}
          <Button
            onClick={onNewGameSameSettings}
            variant="success"
            style={{ fontSize: 12 }}
          >
            ⚙️ Same Settings
          </Button>
        </div>
      )}

      {/* Resign Confirmation Dialog */}
      {showResignConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>
              🏳️ Resign Game?
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#6b7280', lineHeight: 1.5 }}>
              Are you sure you want to resign? This will end the game immediately and count as a loss.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={() => setShowResignConfirm(false)}
                variant="secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResign}
                variant="danger"
                style={{ flex: 1 }}
              >
                Confirm Resign
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Abort Game Confirmation Dialog */}
      {showAbortConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>
              ⏸️ Abort Game?
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#6b7280', lineHeight: 1.5 }}>
              Abort this game? Since fewer than 2 moves have been played, the game will not be rated.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={() => setShowAbortConfirm(false)}
                variant="secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAbort}
                variant="warning"
                style={{ flex: 1 }}
              >
                Confirm Abort
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
