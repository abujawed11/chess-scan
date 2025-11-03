# Priority 1 Features - Detailed Breakdown

## Overview
These are the **highest priority** features requested by the user to make the chess app functional and competitive. All features are in **Priority 1: Game Configuration** category.

---

## Feature #1: Computer Difficulty Levels ⭐⭐⭐

### Current State
- Always plays at maximum strength (Depth 18, ~2800+ ELO)
- No way to adjust difficulty
- Beginners get crushed, no fun

### What to Add
**6 Difficulty Levels:**

| Level | ELO | Depth | Think Time | Target Users |
|-------|-----|-------|------------|--------------|
| Beginner | 1000 | 5 | 0.1s | New players, kids |
| Easy | 1200 | 8 | 0.2s | Learning basics |
| Intermediate | 1600 | 12 | 0.5s | Club players |
| Advanced | 2000 | 15 | 1s | Strong amateurs |
| Expert | 2400 | 18 | 2s | Masters |
| Master | 2800 | 21 | 5s | GMs, perfection |

**Additional Options:**
- UCI Skill Level (0-20 from Stockfish) for fine-tuning
- Personality modes: Aggressive, Positional, Defensive
- Random move occasionally for lower levels (more human-like)

### Implementation
- Dropdown selector on game mode screen
- Store level in state: `computerLevel: 'intermediate'`
- Map level to depth in useStockfish hook
- Pass depth to `engine.goDepth(depth)`

### User Flow
1. Click "vs Computer"
2. See dropdown: "Computer Difficulty"
3. Select level (e.g., "Intermediate (1600)")
4. Start game
5. Computer plays at chosen strength

---

## Feature #2: Time Controls ⭐⭐⭐

### Current State
- No time limits at all
- Games can last forever
- No urgency, no time pressure training

### What to Add
**Standard Time Controls:**

| Category | Formats | Use Case |
|----------|---------|----------|
| **Bullet** | 1+0, 1+1, 2+1 | Ultra-fast, reflex training |
| **Blitz** | 3+0, 3+2, 5+0, 5+3 | Fast tactical games |
| **Rapid** | 10+0, 10+5, 15+10 | Balanced speed + thinking |
| **Classical** | 30+0, 30+20, 60+30 | Deep strategic games |
| **Custom** | User-defined | Any time + increment |
| **Unlimited** | No clock | Current behavior |

**UI Elements:**
- Two clocks: Top (opponent), Bottom (player)
- Large readable numbers (MM:SS format)
- Active clock highlighted (green border)
- Low time warning (red < 10 seconds)
- Time increment badge (+3)

**Features:**
- Auto-flag on timeout (lose on time)
- Pause/resume (analyze mode only)
- Sound when time running out
- Premove support (queue next move)

### Implementation
- State: `{ timeControl: '5+3', whiteTime: 300, blackTime: 300, increment: 3 }`
- useInterval hook for countdown
- Decrement active player's time
- Add increment after each move
- Check timeout on every tick

### User Flow
1. Select game mode
2. Choose time control: "Blitz 5+3"
3. See two clocks (5:00 each)
4. Play move
5. Clock switches to opponent
6. Time decrements
7. Lose if timeout

---

## Feature #3: On-Demand Analysis ⭐⭐⭐

### Current State
- Auto-analyzes every single move continuously
- Wastes CPU resources
- User can't control when analysis happens
- No way to analyze just ONE position

### What to Add
**3 Analysis Modes:**

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Manual** | User clicks "Analyze This Position" | Study specific critical positions |
| **Single** | Analyze once, then stop | Quick evaluation of one position |
| **Continuous** | Auto-analyze every move | Computer games, full game analysis |

**UI Elements:**
- Toggle buttons with 3 states:
  - ▶️ "Start Analysis" (continuous)
  - 🔍 "Analyze Position" (single shot)
  - ⏹️ "Stop Analysis" (current)
- Analysis progress indicator:
  - "Depth: 18/25"
  - "Nodes/sec: 2.5M"
  - "Time: 3.2s"

**Additional Controls:**
- Depth selector: 10, 15, 18, 20, 25
- Time limit: "Analyze for 5 seconds"
- Cache analyzed positions (don't re-compute)

### Implementation
- State: `{ analysisMode: 'off' | 'single' | 'continuous' }`
- Modify useStockfish hook:
  - `continuous`: Current behavior
  - `single`: Call requestAnalysis once, set flag to prevent auto-trigger
  - `off`: Don't call requestAnalysis at all
- Add depth/time controls to UI

### User Flow
1. User makes move
2. Position changes
3. If mode = 'continuous': Auto-analyze
4. If mode = 'single': Wait
5. User clicks "Analyze Position"
6. Engine runs once, shows result
7. User makes another move
8. Analysis does NOT run (mode = 'single')

---

## Feature #4: Computer vs Computer with Different Levels ⭐⭐⭐ (NEW!)

### Current State
- CvC mode exists
- Both computers use SAME strength (Depth 18)
- No variety, predictable outcomes
- Can't see skill difference demonstrations

### What to Add
**Asymmetric Engine Strengths:**

Set different difficulty levels for White and Black:
- **White**: Choose from 6 levels (Beginner to Master)
- **Black**: Choose from 6 levels (Beginner to Master)

**Example Matches:**
- Beginner (1000) vs Master (2800) → Educational: See how a master crushes
- Advanced (2000) vs Expert (2400) → Close competitive match
- Intermediate (1600) vs Intermediate (1600) → Mirror match
- Easy (1200) vs Easy (1200) → Beginner-level game

**Configuration UI:**
```
┌─────────────────────────────────┐
│ Computer vs Computer            │
├─────────────────────────────────┤
│ White Player:  [Advanced ▼]     │  (Dropdown)
│ Expected ELO: ~2000              │
│                                  │
│ Black Player:  [Expert ▼]       │  (Dropdown)
│ Expected ELO: ~2400              │
│                                  │
│         [Start Game]             │
└─────────────────────────────────┘
```

**During Game Display:**
```
┌─────────────────────────────────┐
│ White (Advanced) vs Black (Expert) │
│ Move 12 • Black's turn           │
│                                  │
│ White thinking... (depth 15)     │  ← Different depths per side
│ Black thinking... (depth 18)     │
└─────────────────────────────────┘
```

**Use Cases:**
1. **Educational**: Watch how stronger play looks
2. **Testing**: Evaluate if position is winning/drawn
3. **Entertainment**: "Battle of the bots"
4. **Comparison**: See difference between levels
5. **Training**: Study games at your target level

**Advanced Options (Future):**
- Different engines: Stockfish vs Leela Chess Zero (LC0)
- Handicap matches: Queen odds, time odds
- Opening book enabled/disabled per side
- Personality per computer: Aggressive White vs Defensive Black

### Implementation

**Technical Approach:**
1. **Dual Engine Instances**:
   - Create two separate Stockfish workers
   - `engineWhite` and `engineBlack`
   - Each with independent depth configuration

2. **State Structure:**
```javascript
{
  whiteLevel: 'advanced',      // ELO 2000, Depth 15
  blackLevel: 'expert',        // ELO 2400, Depth 18
  currentTurn: 'white',
  whiteBestMove: 'e2e4',
  blackBestMove: null,
  whiteThinking: true,
  blackThinking: false
}
```

3. **Move Logic:**
```javascript
if (currentTurn === 'white') {
  engineWhite.goDepth(15)  // Advanced level
} else {
  engineBlack.goDepth(18)  // Expert level
}
```

4. **Display Logic:**
- Show both levels in header
- Color-code thinking indicators
- Display different analysis depths per side

### User Flow
1. Click "Computer vs Computer" mode
2. See two dropdowns:
   - "White Level: [Intermediate ▼]"
   - "Black Level: [Master ▼]"
3. Select levels
4. Click "Start Game"
5. Watch game with different strengths
6. See header: "White (Intermediate) vs Black (Master)"
7. Observe different move quality
8. Black (Master) likely wins!

---

## Summary: Week 1 Priority Tasks

### Estimated Timeline

| Task | Effort | Priority |
|------|--------|----------|
| Fix HvH bug | 4 hours | CRITICAL |
| Computer difficulty selector | 1-2 days | HIGH |
| Time controls | 2-3 days | HIGH |
| On-demand analysis | 1 day | HIGH |
| CvC different levels | 1-2 days | HIGH |

**Total: ~1 week** to implement all Priority 1 features

### Implementation Order
1. **Day 1 (4h)**: Fix HvH bug → Critical for correctness
2. **Day 2-3 (1-2d)**: Computer difficulty → Core gameplay improvement
3. **Day 4-5 (1-2d)**: CvC different levels → Builds on difficulty system
4. **Day 6-7 (2-3d)**: Time controls → Complex, needs testing
5. **Day 8 (1d)**: On-demand analysis → Quick, UI-focused

### After Week 1: MVP Complete!
Your app will have:
- ✅ Correct chess rules (HvH bug fixed)
- ✅ Adjustable computer strength (6 levels)
- ✅ Asymmetric CvC matches
- ✅ Professional time controls
- ✅ Flexible analysis modes
- ✅ Draw/Resign buttons (bonus)

**Result:** A competitive chess app ready for casual players! 🎯
