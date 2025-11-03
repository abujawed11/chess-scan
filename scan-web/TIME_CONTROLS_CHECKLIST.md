# Time Controls - Implementation Checklist

## 📋 Overview
Add chess clock functionality with time controls (5+0, 5+3, 3+2, etc.) before game starts. **Total effort: 12 hours / 1.5-2 days**

---

## 🎬 PHASE 1: Data Structure & Constants (1 hour)

### Task 1.1: Update constants.js
- [ ] Add TIME_CONTROLS object
- [ ] Define all 13 time controls:
  - [ ] UNLIMITED (∞)
  - [ ] BULLET_1_0, BULLET_1_1, BULLET_2_1
  - [ ] BLITZ_3_0, BLITZ_3_2, BLITZ_5_0, BLITZ_5_3
  - [ ] RAPID_10_0, RAPID_10_5, RAPID_15_10
  - [ ] CLASSICAL_30_0, CLASSICAL_30_20
- [ ] Structure: { name, minutes, increment, category }
- [ ] Export for use in components

### Task 1.2: Default Configuration
- [ ] Set default time control (e.g., BLITZ_5_3)
- [ ] Create category grouping helper
- [ ] Add constants for colors/styles

---

## 🎬 PHASE 2: useChessTimer Hook (2 hours)

### Task 2.1: Create useChessTimer.js
- [ ] Create `src/hooks/useChessTimer.js`
- [ ] State management:
  - [ ] whiteTime (in seconds)
  - [ ] blackTime (in seconds)
  - [ ] isWhiteTurn (boolean)
  - [ ] gameActive (boolean)
  - [ ] whiteTimedOut (boolean)
  - [ ] blackTimedOut (boolean)

### Task 2.2: Timer Logic
- [ ] Implement useEffect with setInterval
- [ ] Update active player's clock every second
- [ ] Only decrement when gameActive = true
- [ ] Handle Infinity for unlimited time
- [ ] Cleanup interval on unmount

### Task 2.3: Turn Switching
- [ ] switchTurn() function
- [ ] Add increment to previous player's time
- [ ] Cap at initial time (don't exceed)
- [ ] Switch active player
- [ ] Check for time flag immediately

### Task 2.4: Increment Logic
- [ ] Handle 0 increment (no addition)
- [ ] Add increment seconds to previous player
- [ ] Time cap: don't exceed initial allocation
- [ ] Example: 5:03 + 3s increment = capped at 5:00

### Task 2.5: Time Flag Detection
- [ ] Detect when time <= 0
- [ ] Set timedOut flag immediately
- [ ] Trigger game over callback
- [ ] Stop timer when flagged

### Task 2.6: Control Functions
- [ ] startTimer() - begin counting down
- [ ] pauseTimer() - pause both clocks
- [ ] resumeTimer() - resume counting
- [ ] resetTimer() - reset to initial times
- [ ] Return all state and functions

---

## 🎬 PHASE 3: ChessTimer Component (2 hours)

### Task 3.1: Create ChessTimer.jsx
- [ ] Create `src/components/ChessTimer.jsx`
- [ ] Props: whiteTime, blackTime, isWhiteTurn, whiteTimedOut, blackTimedOut

### Task 3.2: Time Formatting
- [ ] formatTime(seconds) function
- [ ] Convert to MM:SS format
- [ ] Pad seconds: 0:05 (not 0:5)
- [ ] Handle hours if needed (1:00:00)

### Task 3.3: Color Coding
- [ ] Normal time: Blue (#3b82f6)
- [ ] Low time (< 10s): Orange (#f59e0b)
- [ ] Time flag (0:00): Red (#ef4444)
- [ ] getTimeColor() helper

### Task 3.4: Clock Display
- [ ] Two clock sections (top/bottom)
- [ ] Black clock at top
- [ ] White clock at bottom
- [ ] Show piece icons (♚ ♔)
- [ ] Display time in large font (40px+)

### Task 3.5: Active Indicator
- [ ] Highlight active player's clock
- [ ] Visual highlight (border, background)
- [ ] Show "Your turn" for human player
- [ ] Animation for ticking (optional)

### Task 3.6: Low Time Warning
- [ ] Show ⚠️ icon when < 10 seconds
- [ ] Change color to orange
- [ ] Change color to red at <= 5 seconds
- [ ] Optional: sound effect (future)

### Task 3.7: Time Flagged State
- [ ] Show ⏱️ Time! when flagged
- [ ] Red color background
- [ ] Indicate who ran out (opponent wins)
- [ ] Game over message

### Task 3.8: Mobile Responsive
- [ ] Stack vertically on mobile
- [ ] Large touch targets (60px minimum)
- [ ] Readable font size on all devices
- [ ] Landscape mode optimization

---

## 🎬 PHASE 4: TimeControlSelector Component (2 hours)

### Task 4.1: Create TimeControlSelector.jsx
- [ ] Create `src/components/TimeControlSelector.jsx`
- [ ] Props: onSelect (callback)

### Task 4.2: Category Structure
- [ ] Group by category:
  - [ ] ⚡ Bullet (3 options)
  - [ ] ⚙️ Blitz (4 options)
  - [ ] 📈 Rapid (3 options)
  - [ ] ♟️ Classical (2 options)
  - [ ] ∞ Unlimited (1 option)

### Task 4.3: Selector UI
- [ ] Category headers with emojis
- [ ] Buttons for each time control
- [ ] Button format: "5+3" or "5 + 3 Blitz"
- [ ] Hover effect (color/shadow)
- [ ] Click selects and calls onSelect()

### Task 4.4: Styling
- [ ] Category background color
- [ ] Button styling (rounded, padding)
- [ ] Active selection highlight
- [ ] Responsive grid (2-4 columns)

### Task 4.5: Mobile Layout
- [ ] Single column on mobile
- [ ] Full-width buttons
- [ ] Large touch targets (50px height min)
- [ ] Landscape: 2 columns

### Task 4.6: Recommended Times
- [ ] Highlight recommended time (5+3)
- [ ] Show popular times
- [ ] Tooltips with descriptions:
  - [ ] "Fast-paced, quick decisions"
  - [ ] "Balanced, some thinking time"
  - [ ] "Longer games, careful play"

### Task 4.7: Advanced Options (Future)
- [ ] Custom time option (button)
- [ ] Input fields for minutes/increment
- [ ] Validation (min 0.5 min, max 90 min)
- [ ] Save custom as favorite

---

## 🎬 PHASE 5: GamePlay Integration (2 hours)

### Task 5.1: Add TimeControlSelector
- [ ] Show before game mode selection
- [ ] Or after mode selection (before game start)
- [ ] Modal or full-screen option
- [ ] Cancel button to go back

### Task 5.2: State Management
- [ ] Add selectedTimeControl state in GamePlay
- [ ] Pass to useChessTimer hook
- [ ] Initialize with selected time control
- [ ] Store in game data (for post-game analysis)

### Task 5.3: Display ChessTimer
- [ ] Import ChessTimer component
- [ ] Show during game (top of board area)
- [ ] Update on every move
- [ ] Hide during game over

### Task 5.4: Move Logic Integration
- [ ] Call switchTurn() after move
- [ ] Pass new turn info
- [ ] Update both player times
- [ ] Check for time flag

### Task 5.5: Computer Move Time
- [ ] Computer respects time limits
- [ ] Don't exceed available time
- [ ] Get increment after move
- [ ] Calculate thinking time budget

### Task 5.6: Game Over Handling
- [ ] If time flag: "Player wins on time"
- [ ] Stop timer immediately
- [ ] Show game duration
- [ ] Allow analysis with time metadata

### Task 5.7: Mode Compatibility
- [ ] Human vs Human: both clocks
- [ ] Human vs Computer: both clocks
- [ ] Computer vs Computer: both clocks
- [ ] Analyze Position: no clocks (unlimited)

---

## 🎬 PHASE 6: Computer Thinking Time (1 hour)

### Task 6.1: Respect Time Limits
- [ ] Get available time for computer
- [ ] Don't think longer than available
- [ ] Safety margin (100ms buffer)
- [ ] Use movetime in Stockfish command

### Task 6.2: Analysis Depth
- [ ] Bullet (1+1): shallow depth (8-10)
- [ ] Blitz (5+3): medium depth (12-15)
- [ ] Rapid (10+5): deep depth (18-20)
- [ ] Classical (30+20): very deep (20+)

### Task 6.3: Move Timing
- [ ] Start timer after making move
- [ ] Add increment when move completes
- [ ] Switch turn to human
- [ ] Handle long-thinking edge cases

---

## 🎬 PHASE 7: Testing & Polish (2 hours)

### Task 7.1: Functional Testing
- [ ] Select each time control
  - [ ] 1+0 Bullet
  - [ ] 5+3 Blitz
  - [ ] 10+5 Rapid
  - [ ] 30+20 Classical
  - [ ] Unlimited
- [ ] Clocks start correctly
- [ ] Increment adds correctly
- [ ] Time flag triggers

### Task 7.2: Edge Cases
- [ ] Very fast (1+0): clocks count fast
- [ ] Very slow (30+20): clocks slow
- [ ] Time flag at exactly 0:00
- [ ] Increment > remaining time (capped)
- [ ] Move takes longer than increment

### Task 7.3: UI Polish
- [ ] Clock colors change smoothly
- [ ] Animations smooth (no jank)
- [ ] Fonts clear and readable
- [ ] Buttons responsive

### Task 7.4: Performance
- [ ] No lag during ticking
- [ ] Smooth 60fps animations
- [ ] Efficient re-renders
- [ ] No memory leaks (cleanup)

### Task 7.5: Mobile Testing
- [ ] Portrait mode layout
- [ ] Landscape mode layout
- [ ] Clock readable on all sizes
- [ ] Buttons 44px+ minimum
- [ ] Test on real devices

### Task 7.6: Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Task 7.7: Accessibility
- [ ] ARIA labels on clocks
- [ ] Color contrast sufficient
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

---

## 📊 Effort Timeline

| Phase | Task | Hours | Status |
|-------|------|-------|--------|
| 1 | Constants & Setup | 1 | ⏳ |
| 2 | useChessTimer Hook | 2 | ⏳ |
| 3 | ChessTimer Component | 2 | ⏳ |
| 4 | TimeControlSelector | 2 | ⏳ |
| 5 | GamePlay Integration | 2 | ⏳ |
| 6 | Computer Time Logic | 1 | ⏳ |
| 7 | Testing & Polish | 2 | ⏳ |
| | **TOTAL** | **12** | ⏳ |

---

## 📝 Implementation Sequence

1. **Start with Phase 1** - Add constants (10 min)
2. **Phase 2** - Build useChessTimer hook (2 hours)
3. **Phase 3** - Create ChessTimer UI (2 hours)
4. **Phase 4** - TimeControlSelector (2 hours)
5. **Phase 5** - Integration (2 hours)
6. **Phase 6** - Computer time (1 hour)
7. **Phase 7** - Test & Polish (2 hours)

**Can parallelize Phases 3 & 4 if working with partner**

---

## ✅ Deliverable Checklist

- [ ] Time control selector shows all 13 options
- [ ] Clocks display MM:SS format correctly
- [ ] Active clock ticks down smoothly
- [ ] Increment adds after move
- [ ] Low time warning shows (< 10s)
- [ ] Time flag ends game automatically
- [ ] Result shows "Player wins on time"
- [ ] Works in all game modes
- [ ] Computer respects time limits
- [ ] Mobile responsive design
- [ ] No visual bugs or lag
- [ ] All tests pass

---

## 🎊 Result

A professional chess clock system that:
✅ Supports 13 time controls (Bullet → Classical)
✅ Smooth countdown animations
✅ Auto-flags players on timeout
✅ Increment system working correctly
✅ Computer AI respects time
✅ Mobile friendly
✅ Professional UX matching Lichess/Chess.com

**This sets up perfect foundation for Post-Game Analysis!** 🏁
