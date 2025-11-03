# Post-Game Analysis Implementation Plan

## 🎯 Goal
After a game ends, users can immediately analyze it using the same PGN Review system, seeing move quality, accuracy scores, and where mistakes were made.

---

## 📋 Feature Requirements (from FEATURE_ROADMAP)

### User Flow
1. Game ends (Checkmate, Draw, Resign)
2. Game Over Screen shows result + "Analyze Game" button
3. Click "Analyze Game" → Game converts to PGN
4. Review mode loads with game data
5. User navigates/analyzes game
6. Can save PGN with annotations

### Key Features to Implement

#### 1. Game-to-PGN Conversion
- [ ] Convert completed game to standard PGN format
- [ ] Add tags: Event, Site, Date, White, Black, Result, ECO
- [ ] Include metadata: Time control, game mode, difficulty
- [ ] Preserve move order and timestamps
- [ ] Handle all game modes (HvH, HvC, CvC)

#### 2. Game Over Modal Enhancement
- [ ] Show result (Checkmate! White wins)
- [ ] Show final position preview
- [ ] Add buttons: [Analyze Game] [Rematch] [New Game] [Home]
- [ ] "Analyze Game" triggers analysis

#### 3. Analysis Workflow
- [ ] Queue background analysis (all moves)
- [ ] Show progress: "Analyzing move 15/40..."
- [ ] Allow navigation while analyzing
- [ ] Display partial results as they complete
- [ ] Cache evaluations (FEN → eval)

#### 4. Review Integration
- [ ] Reuse existing GameReview component
- [ ] Show move quality badges (Book, !!, !, ?, ??)
- [ ] Show accuracy scores per player
- [ ] Navigate move-by-move
- [ ] Auto-play game
- [ ] Jump to blunders

#### 5. Storage & Library
- [ ] Save analyzed games to localStorage
- [ ] Store with metadata (timestamp, players, result)
- [ ] Create "My Games" library view
- [ ] Filter/search games
- [ ] Delete games option

#### 6. Advanced Features (Later)
- [ ] Highlight critical moments
- [ ] "Show me where I went wrong" button
- [ ] "Your move vs Best move" comparison
- [ ] Export PGN with annotations
- [ ] Share analysis link

---

## 🏗️ Architecture

### New Files to Create

1. **`src/utils/pgn/gameToPgn.js`**
   - Function: Convert game object → PGN string
   - Handle all game modes
   - Include metadata and tags

2. **`src/hooks/usePostGameAnalysis.js`**
   - Manage analysis queue
   - Track progress
   - Cache evaluations
   - Integration with useStockfish

3. **`src/components/pages/PostGameAnalysis.jsx`**
   - New page component
   - Reuses GameReview + analysis features
   - Shows progress during analysis

4. **`src/hooks/useGameLibrary.js`**
   - Manage saved games in localStorage
   - CRUD operations
   - Search/filter

5. **`src/components/GameLibrary.jsx`**
   - Display saved games
   - Play/delete actions
   - Search/sort

### Modified Files

1. **`src/components/pages/GamePlay.jsx`**
   - Add "Analyze Game" button to game over modal
   - Pass game data to analysis flow
   - Convert to PGN on demand

2. **`src/App.jsx`**
   - Add new "post-game-analysis" mode
   - Add "library" mode for saved games

3. **`src/utils/constants.js`**
   - Add new game modes if needed
   - Analysis configuration

---

## 📊 Data Flow

```
Game Ends
  ↓
Game Over Modal Shows
  ↓
User clicks "Analyze Game"
  ↓
GamePlay → GameToPgn (convert)
  ↓
PostGameAnalysis Component Loads
  ↓
usePostGameAnalysis Hook
  - Start analysis queue
  - Analyze each move sequentially
  - Request Stockfish evaluation
  - Store results in cache
  - Update progress UI
  ↓
Results Display in GameReview UI
  - Move quality badges
  - Accuracy scores
  - Navigation controls
  ↓
User Reviews Game
  ↓
Save Option
  - Store to localStorage
  - Add to "My Games"
```

---

## 🎬 Implementation Phases

### Phase 1: Game-to-PGN Conversion (4 hours)
- [ ] Create `gameToPgn.js` utility
- [ ] Handle all game modes
- [ ] Test PGN generation
- [ ] Validate with PGN readers

### Phase 2: Game Over Modal UI (3 hours)
- [ ] Add "Analyze Game" button
- [ ] Styling matches design
- [ ] Handle click flow
- [ ] Navigation to analysis

### Phase 3: Analysis Integration (1 day)
- [ ] Create `usePostGameAnalysis` hook
- [ ] Analysis queue logic
- [ ] Progress tracking
- [ ] Cache evaluations
- [ ] Reuse GameReview component

### Phase 4: Storage & Library (1 day)
- [ ] Create `useGameLibrary` hook
- [ ] LocalStorage persistence
- [ ] Create GameLibrary component
- [ ] Search/filter functionality

### Phase 5: Testing & Polish (4 hours)
- [ ] Test all game modes
- [ ] Edge cases (resign, timeout, etc.)
- [ ] Performance optimization
- [ ] Mobile responsive

---

## 🧪 Test Cases

### Test 1: Human vs Computer Game Analysis
- [ ] Play game vs computer
- [ ] Win/lose/draw
- [ ] Click "Analyze Game"
- [ ] PGN converts correctly
- [ ] Analysis shows move quality
- [ ] Accuracy calculated correctly

### Test 2: Computer vs Computer Analysis
- [ ] Both computers play
- [ ] Game completes
- [ ] Analysis works
- [ ] Shows quality for both sides

### Test 3: Human vs Human Analysis
- [ ] Two players play
- [ ] Game ends
- [ ] Analysis works correctly
- [ ] Accuracy for both players

### Test 4: Save & Library
- [ ] Analyze game
- [ ] Click "Save Game"
- [ ] Game appears in library
- [ ] Can view later
- [ ] Can delete

### Test 5: Progress During Analysis
- [ ] Start analysis
- [ ] Progress bar shows updates
- [ ] Can navigate while analyzing
- [ ] Can cancel analysis

---

## 📝 Code Structure

### gameToPgn.js
```javascript
export function gameTosPgn(gameData) {
  // gameData: { moves: [], result, players, date, mode, ... }
  // Returns: PGN string
  
  const tags = {
    Event: "Chess Scan Game",
    Site: "Chess Scan App",
    Date: formatDate(new Date()),
    White: gameData.whitePlayer || "White",
    Black: gameData.blackPlayer || "Black",
    Result: gameData.result,
    // ... more tags
  };
  
  const movesString = formatMoves(gameData.moves);
  return formatPgn(tags, movesString);
}
```

### usePostGameAnalysis.js
```javascript
export function usePostGameAnalysis(pgn) {
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState({});
  const { requestAnalysis, stopAnalysis } = useStockfish();
  
  const startAnalysis = useCallback(async (moves) => {
    // Queue analysis
    // Update progress
    // Cache evaluations
    // Return analyzed moves
  }, []);
  
  return { startAnalysis, progress, results, analyzing };
}
```

---

## 🎯 Success Criteria

✅ User can click "Analyze Game" after any game  
✅ Game converts to PGN with all tags  
✅ Analysis runs and shows progress  
✅ Move quality displays (Book, !!, !, ?, ??)  
✅ Accuracy scores shown per player  
✅ Can navigate through analysis  
✅ Can save analyzed games  
✅ Library shows saved games  
✅ Works for all game modes (HvH, HvC, CvC)  
✅ Performance is good (progress shows, responsive)

---

## 📚 Reusable Components

From existing PGN Review feature:
- `GameReview` component (main analysis UI)
- `MoveListReview` (move navigation)
- `GameSummary` (accuracy/stats)
- `NavigationControls` (playback)
- `EvaluationBar` (position eval)
- `useGameReview` hook (state management)

**No need to rebuild the analysis UI - just reuse it!**

---

## 🚀 Effort Estimate

- **Total Time: 2-3 days** (as per FEATURE_ROADMAP)
  - Game-to-PGN: 4 hours
  - Game Over Modal: 3 hours
  - Analysis Integration: 1 day (8 hours)
  - Storage & Library: 1 day (8 hours)
  - Testing & Polish: 4 hours

---

## 📌 Next Steps

1. ✅ Review this plan
2. Start Phase 1: Create `gameToPgn.js`
3. Phase 2: Enhance game over modal
4. Phase 3: Create analysis hook
5. Phase 4: Add game library
6. Phase 5: Test everything
7. Polish and ship!

---

## 🎊 Result

Users will have a complete post-game analysis system:
- **Immediate feedback** on game quality
- **Learn from mistakes** with detailed analysis
- **Build game library** for progress tracking
- **Professional experience** matching Chess.com

This is a major feature that significantly improves the app's value!
