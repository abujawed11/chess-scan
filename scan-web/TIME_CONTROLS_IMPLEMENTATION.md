# Time Controls Implementation Plan

## 🎯 Goal
Add chess clock functionality allowing users to select time controls (Bullet, Blitz, Rapid, Classical) before starting a game. Show countdown clocks for both players during gameplay.

---

## 📋 Time Control Standards

### Bullet (⚡)
- 1+0 (1 minute, no increment)
- 1+1 (1 minute, 1 second increment per move)
- 2+1 (2 minutes, 1 second increment)

### Blitz (⚙️)
- 3+0 (3 minutes, no increment)
- 3+2 (3 minutes, 2 second increment)
- 5+0 (5 minutes, no increment)
- 5+3 (5 minutes, 3 second increment)

### Rapid (📈)
- 10+0 (10 minutes, no increment)
- 10+5 (10 minutes, 5 second increment)
- 15+10 (15 minutes, 10 second increment)

### Classical (♟️)
- 30+0 (30 minutes, no increment)
- 30+20 (30 minutes, 20 second increment)

### Unlimited (∞)
- No time limit (current behavior)

---

## 🏗️ Architecture

### New Files to Create

1. **`src/hooks/useChessTimer.js`**
   - Manage clock state for both players
   - Track remaining time
   - Handle increment logic
   - Detect time flag (time expired)
   - Pause/resume functionality

2. **`src/components/ChessTimer.jsx`**
   - Display player clocks (top and bottom)
   - Show MM:SS format
   - Color coding: Normal/Low Time/Flagged
   - Visual animations for low time

3. **`src/components/TimeControlSelector.jsx`**
   - Dropdown/radio buttons for time selections
   - Group by category: Bullet, Blitz, Rapid, Classical, Unlimited
   - Show recommended time controls
   - Custom time option (advanced)

### Modified Files

1. **`src/components/pages/GamePlay.jsx`**
   - Add TimeControlSelector before game starts
   - Integrate useChessTimer hook
   - Display ChessTimer component during game
   - Handle time flag scenarios
   - Auto-loss on time expiration

2. **`src/App.jsx`**
   - Track selected time control
   - Pass to GamePlay component
   - Store in game metadata

3. **`src/utils/constants.js`**
   - Add TIME_CONTROLS object
   - Predefined time control definitions
   - Default selections

---

## 🎬 User Flow

### Before Game

```
Home/Mode Selection
  ↓
Select Game Mode (vs Computer, vs Human, etc.)
  ↓
Time Control Selection Modal/Screen
  ├─ [⚡ Bullet]: 1+0 | 1+1 | 2+1
  ├─ [⚙️  Blitz]:  3+0 | 3+2 | 5+0 | 5+3
  ├─ [📈 Rapid]:  10+0 | 10+5 | 15+10
  ├─ [♟️  Classical]: 30+0 | 30+20
  └─ [∞ Unlimited]: No time limit
  ↓
User Selects Time Control (e.g., 5+3)
  ↓
Game Starts
```

### During Game

```
Game Start
  ├─ White Clock: 5:00
  ├─ Black Clock: 5:00
  ↓
White Moves
  ├─ White clock stops
  ├─ Add 3 second increment to White
  ├─ Black clock starts ticking
  ↓
Black Moves
  ├─ Black clock stops
  ├─ Add 3 second increment to Black
  ├─ White clock starts ticking
  ↓
[Repeat until game ends or time flag]
```

### After Time Expires

```
Player's Clock → 0:00
  ↓
Time Flag! (Player loses by time)
  ↓
Game Over
  ├─ Result: "White wins on time"
  ├─ Analysis available (optional)
  └─ Show game duration
```

---

## 📊 Implementation Phases

### Phase 1: Data Structure & Constants (1 hour)
- [ ] Define TIME_CONTROLS in constants.js
- [ ] Structure time control data (min, inc, category)
- [ ] Default selections

### Phase 2: useChessTimer Hook (2 hours)
- [ ] Create hook with clock state
- [ ] Timer logic (setInterval)
- [ ] Increment handling
- [ ] Time flag detection
- [ ] Pause/resume
- [ ] Cleanup on unmount

### Phase 3: ChessTimer Component (2 hours)
- [ ] Display both clocks (top/bottom)
- [ ] MM:SS format
- [ ] Color coding (green/yellow/red)
- [ ] Low time warning (< 10s)
- [ ] Animation for ticking

### Phase 4: TimeControlSelector Component (2 hours)
- [ ] Create selector UI
- [ ] Responsive layout
- [ ] Category grouping
- [ ] Selection state
- [ ] Custom time option (future)

### Phase 5: GamePlay Integration (2 hours)
- [ ] Add TimeControlSelector before game
- [ ] Integrate useChessTimer
- [ ] Display ChessTimer during game
- [ ] Handle time flag logic
- [ ] Auto-loss on timeout

### Phase 6: Computer Thinking Time (1 hour)
- [ ] Respect time controls in computer moves
- [ ] Use available time
- [ ] Don't exceed time limit
- [ ] Add increment after move

### Phase 7: Testing & Polish (2 hours)
- [ ] Test all time controls
- [ ] Edge cases (very fast, very slow)
- [ ] Mobile responsiveness
- [ ] Visual polish

---

## 💻 Code Structure

### constants.js
```javascript
export const TIME_CONTROLS = {
  UNLIMITED: { name: 'Unlimited', minutes: Infinity, increment: 0, category: '∞' },
  
  // Bullet
  BULLET_1_0: { name: '1+0 Bullet', minutes: 1, increment: 0, category: '⚡' },
  BULLET_1_1: { name: '1+1 Bullet', minutes: 1, increment: 1, category: '⚡' },
  BULLET_2_1: { name: '2+1 Bullet', minutes: 2, increment: 1, category: '⚡' },
  
  // Blitz
  BLITZ_3_0: { name: '3+0 Blitz', minutes: 3, increment: 0, category: '⚙️' },
  BLITZ_3_2: { name: '3+2 Blitz', minutes: 3, increment: 2, category: '⚙️' },
  BLITZ_5_0: { name: '5+0 Blitz', minutes: 5, increment: 0, category: '⚙️' },
  BLITZ_5_3: { name: '5+3 Blitz', minutes: 5, increment: 3, category: '⚙️' },
  
  // Rapid
  RAPID_10_0: { name: '10+0 Rapid', minutes: 10, increment: 0, category: '📈' },
  RAPID_10_5: { name: '10+5 Rapid', minutes: 10, increment: 5, category: '📈' },
  RAPID_15_10: { name: '15+10 Rapid', minutes: 15, increment: 10, category: '📈' },
  
  // Classical
  CLASSICAL_30_0: { name: '30+0 Classical', minutes: 30, increment: 0, category: '♟️' },
  CLASSICAL_30_20: { name: '30+20 Classical', minutes: 30, increment: 20, category: '♟️' },
};
```

### useChessTimer.js
```javascript
export function useChessTimer(timeControl) {
  const [whiteTime, setWhiteTime] = useState(timeControl.minutes * 60);
  const [blackTime, setBlackTime] = useState(timeControl.minutes * 60);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [whiteTimedOut, setWhiteTimedOut] = useState(false);
  const [blackTimedOut, setBlackTimedOut] = useState(false);
  
  // Timer interval logic
  // Increment on move
  // Time flag detection
  // Pause/resume
  
  return {
    whiteTime,
    blackTime,
    isWhiteTurn,
    whiteTimedOut,
    blackTimedOut,
    switchTurn,
    startTimer,
    pauseTimer,
    resetTimer,
  };
}
```

### ChessTimer.jsx
```javascript
export default function ChessTimer({ whiteTime, blackTime, isWhiteTurn, whiteTimedOut, blackTimedOut }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getTimeColor = (seconds) => {
    if (seconds <= 0) return '#ef4444'; // Red
    if (seconds <= 10) return '#f59e0b'; // Orange (low time warning)
    return '#3b82f6'; // Blue (normal)
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      {/* Black Clock (Top) */}
      <div style={clockStyle(isWhiteTurn, getTimeColor(blackTime))}>
        ♚ {formatTime(blackTime)}
        {blackTimedOut && <span> ⏱️ Time!</span>}
      </div>
      
      {/* White Clock (Bottom) */}
      <div style={clockStyle(!isWhiteTurn, getTimeColor(whiteTime))}>
        ♔ {formatTime(whiteTime)}
        {whiteTimedOut && <span> ⏱️ Time!</span>}
      </div>
    </div>
  );
}
```

### TimeControlSelector.jsx
```javascript
export default function TimeControlSelector({ onSelect }) {
  const categories = {
    '⚡ Bullet': [BULLET_1_0, BULLET_1_1, BULLET_2_1],
    '⚙️ Blitz': [BLITZ_3_0, BLITZ_3_2, BLITZ_5_0, BLITZ_5_3],
    '📈 Rapid': [RAPID_10_0, RAPID_10_5, RAPID_15_10],
    '♟️ Classical': [CLASSICAL_30_0, CLASSICAL_30_20],
    '∞ Unlimited': [UNLIMITED],
  };
  
  return (
    <div style={selectorStyle}>
      <h2>Select Time Control</h2>
      {Object.entries(categories).map(([category, controls]) => (
        <div key={category}>
          <h3>{category}</h3>
          {controls.map(control => (
            <button key={control.name} onClick={() => onSelect(control)}>
              {control.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Test Cases

### Test 1: Basic Time Control
- [ ] Select 5+3 Blitz
- [ ] Clocks start at 5:00
- [ ] Move made → opponent's clock ticks
- [ ] Move made → increment added (+3s)
- [ ] Continue until game ends

### Test 2: Low Time Warning
- [ ] Select short time (1+0)
- [ ] Play until < 10 seconds
- [ ] Clock color changes (orange/red)
- [ ] Visual warning shows

### Test 3: Time Flag
- [ ] Select very short time
- [ ] Let time expire
- [ ] Game auto-loses by time
- [ ] "Player wins on time" message

### Test 4: Increment Calculation
- [ ] 5+3: Move at 4:57 → adds 3s → becomes 5:00
- [ ] 10+5: Multiple moves each add 5s
- [ ] Time doesn't exceed initial allocation

### Test 5: All Categories
- [ ] Bullet: 1+0, 1+1, 2+1
- [ ] Blitz: 3+0, 3+2, 5+0, 5+3
- [ ] Rapid: 10+0, 10+5, 15+10
- [ ] Classical: 30+0, 30+20
- [ ] Unlimited: No timer

### Test 6: Computer Respect Time
- [ ] Computer gets time control
- [ ] Computer doesn't exceed time
- [ ] Computer receives increment
- [ ] Works with all game modes

### Test 7: Mobile Display
- [ ] Clocks display properly on mobile
- [ ] Readable font sizes
- [ ] Touch-friendly buttons
- [ ] Responsive layout

---

## 🎯 UI Design

### Time Control Selector Modal
```
┌─────────────────────────────────────┐
│   SELECT TIME CONTROL              │
├─────────────────────────────────────┤
│ ⚡ BULLET                          │
│  [1+0]  [1+1]  [2+1]              │
│                                   │
│ ⚙️  BLITZ                          │
│  [3+0]  [3+2]  [5+0]  [5+3]       │
│                                   │
│ 📈 RAPID                           │
│  [10+0]  [10+5]  [15+10]          │
│                                   │
│ ♟️  CLASSICAL                      │
│  [30+0]  [30+20]                  │
│                                   │
│ ∞ UNLIMITED (No Timer)            │
│  [∞]                               │
│                                   │
│ [Start Game]   [Cancel]            │
└─────────────────────────────────────┘
```

### Chess Clocks During Game
```
┌─────────────────┐    ┌─────────────────┐
│  ♚ Black       │    │  ♔ White       │
│   4:52         │    │   5:03         │
└─────────────────┘    └─────────────────┘

Active clock (White's turn):
┌─────────────────┐
│  ♔ White (your turn)
│   5:03  (TICKING)  ← Color: Blue (normal)
└─────────────────┘

Low time warning (< 10 seconds):
┌─────────────────┐
│  ♔ White       │
│   0:07  ⚠️      │  ← Color: Orange/Red
└─────────────────┘

Time flagged:
┌─────────────────┐
│  ♔ White       │
│   0:00  ⏱️      │  ← Color: Red
│  Time!         │
└─────────────────┘
```

---

## 📚 Integration with GamePlay

```javascript
// In GamePlay.jsx

const [selectedTimeControl, setSelectedTimeControl] = useState(null);
const { whiteTime, blackTime, isWhiteTurn, switchTurn } = useChessTimer(selectedTimeControl);

// Before game starts
if (!gameMode) {
  return <TimeControlSelector onSelect={(tc) => {
    setSelectedTimeControl(tc);
    // Continue to mode selection or start game
  }} />;
}

// During game
return (
  <div>
    <ChessTimer 
      whiteTime={whiteTime}
      blackTime={blackTime}
      isWhiteTurn={isWhiteTurn}
    />
    
    {/* Existing game board */}
    
    {/* On move */}
    onMove={(move) => {
      makeMove(move);
      switchTurn(); // Switch clocks
      
      // Check for time flag
      if (whiteTime <= 0 || blackTime <= 0) {
        handleTimeFlag();
      }
    }}
  </div>
);
```

---

## 📊 Effort Estimate

| Phase | Task | Hours | Status |
|-------|------|-------|--------|
| 1 | Constants & Setup | 1 | ⏳ Pending |
| 2 | useChessTimer Hook | 2 | ⏳ Pending |
| 3 | ChessTimer Component | 2 | ⏳ Pending |
| 4 | TimeControlSelector | 2 | ⏳ Pending |
| 5 | GamePlay Integration | 2 | ⏳ Pending |
| 6 | Computer Time Logic | 1 | ⏳ Pending |
| 7 | Testing & Polish | 2 | ⏳ Pending |
| | **TOTAL** | **12** | ⏳ Pending |

**Estimated completion: 1.5-2 days of focused work**

---

## ✅ Success Criteria

✅ User can select time control before game  
✅ Clocks display MM:SS format  
✅ Active player's clock ticks down  
✅ Increment adds correctly  
✅ Low time warning (< 10s) shows  
✅ Time flag ends game automatically  
✅ Works with all game modes  
✅ Computer respects time limits  
✅ Mobile responsive  
✅ Smooth animations  

---

## 🚀 Implementation Order

### Recommended Sequence:
1. **Phase 1**: Add constants (quick win)
2. **Phase 2**: Build useChessTimer hook (core logic)
3. **Phase 3**: Create ChessTimer component (UI display)
4. **Phase 4**: TimeControlSelector (user interface)
5. **Phase 5**: Integrate with GamePlay
6. **Phase 6**: Computer AI respects time
7. **Phase 7**: Test and polish

---

## 🎊 Result

A complete chess clock system that:
- Matches professional chess apps (Lichess, Chess.com)
- Supports all standard time controls
- Adds excitement with low-time warnings
- Auto-enforces time rules
- Integrates seamlessly with existing gameplay

**This is essential for realistic chess games and Post-Game Analysis!** 🏁
