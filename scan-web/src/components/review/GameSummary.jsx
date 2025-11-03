// src/components/review/GameSummary.jsx
import { QUALITY_CONFIG, MOVE_QUALITY } from '../../utils/pgn/moveQuality';

export default function GameSummary({ gameData, stats }) {
  if (!gameData) return null;

  const { tags, openingInfo } = gameData;

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 20,
    }}>
      {/* Players */}
      <div style={{ marginBottom: 20 }}>
        <PlayerInfo
          name={tags.white}
          elo={tags.whiteElo}
          color="white"
          accuracy={stats?.white.accuracy}
          result={tags.result}
        />
        <div style={{
          height: 1,
          background: '#e5e7eb',
          margin: '12px 0',
        }} />
        <PlayerInfo
          name={tags.black}
          elo={tags.blackElo}
          color="black"
          accuracy={stats?.black.accuracy}
          result={tags.result}
        />
      </div>

      {/* Game Info */}
      <div style={{
        padding: 16,
        background: '#f9fafb',
        borderRadius: 8,
        fontSize: 13,
        marginBottom: 16,
      }}>
        {openingInfo?.opening && (
          <InfoRow
            label="Opening"
            value={`${openingInfo.opening.name}${openingInfo.opening.eco ? ` (${openingInfo.opening.eco})` : ''}`}
          />
        )}
        <InfoRow label="Event" value={tags.event} />
        <InfoRow label="Site" value={tags.site} />
        <InfoRow label="Date" value={tags.date} />
        {tags.round && tags.round !== '?' && (
          <InfoRow label="Round" value={tags.round} />
        )}
      </div>

      {/* Move Quality Breakdown */}
      {stats && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: 12,
          }}>
            Move Quality Breakdown
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <QualityBreakdown
              color="White"
              counts={stats.white.counts}
            />
            <QualityBreakdown
              color="Black"
              counts={stats.black.counts}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerInfo({ name, elo, color, accuracy, result }) {
  const isWinner = (color === 'white' && result === '1-0') ||
                   (color === 'black' && result === '0-1');
  const isDraw = result === '1/2-1/2';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Color Indicator */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: color === 'white' ? '#f3f4f6' : '#374151',
        border: color === 'white' ? '2px solid #d1d5db' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
      }}>
        {color === 'white' ? '♔' : '♚'}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            fontWeight: 600,
            fontSize: 15,
          }}>
            {name}
          </span>

          {elo && (
            <span style={{
              fontSize: 12,
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              {elo}
            </span>
          )}

          {isWinner && (
            <span style={{
              fontSize: 12,
              background: '#dcfce7',
              color: '#166534',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 600,
            }}>
              Won
            </span>
          )}

          {isDraw && (
            <span style={{
              fontSize: 12,
              background: '#e5e7eb',
              color: '#374151',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 600,
            }}>
              Draw
            </span>
          )}
        </div>

        {accuracy !== null && accuracy !== undefined && (
          <div style={{
            marginTop: 4,
            fontSize: 13,
            color: '#6b7280',
          }}>
            Accuracy: <span style={{
              fontWeight: 600,
              color: getAccuracyColor(accuracy),
            }}>
              {accuracy.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value || value === '?' || value === 'Unknown' || value === 'Unknown Event' || value === 'Unknown Site') {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6,
    }}>
      <span style={{ color: '#6b7280' }}>{label}:</span>
      <span style={{ fontWeight: 500, color: '#374151' }}>{value}</span>
    </div>
  );
}

function QualityBreakdown({ color, counts }) {
  const qualities = [
    MOVE_QUALITY.BOOK,
    MOVE_QUALITY.BEST,
    MOVE_QUALITY.EXCELLENT,
    MOVE_QUALITY.GOOD,
    MOVE_QUALITY.INACCURACY,
    MOVE_QUALITY.MISTAKE,
    MOVE_QUALITY.BLUNDER,
  ];

  const totalMoves = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        marginBottom: 6,
      }}>
        {color}
      </div>

      <div style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
      }}>
        {qualities.map(quality => {
          const count = counts[quality] || 0;
          if (count === 0) return null;

          const config = QUALITY_CONFIG[quality];
          const percentage = totalMoves > 0 ? (count / totalMoves) * 100 : 0;

          return (
            <div
              key={quality}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                background: config.bgColor,
                color: config.color,
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={`${config.label}: ${count} (${percentage.toFixed(0)}%)`}
            >
              <span>{config.symbol || config.label.charAt(0)}</span>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getAccuracyColor(accuracy) {
  if (accuracy >= 95) return '#10b981';
  if (accuracy >= 90) return '#3b82f6';
  if (accuracy >= 80) return '#f59e0b';
  if (accuracy >= 70) return '#ef4444';
  return '#b91c1c';
}
