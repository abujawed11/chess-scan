# Coordinate Flip Feature Fix - Documentation

## Problem Statement

When you flipped the board coordinates in the **Board Editor** by clicking the "↔️ Coords" button, this setting was **not retained** when switching to **Analysis Mode (GamePlay)**. The board would reset to the default coordinate orientation.

## Root Cause

The coordinatesFlipped state existed only in the BoardEditor component and was never passed through the data flow.

## Solution Overview

The fix implements a complete data pipeline to preserve the coordinate flip state across component boundaries.

## Key Changes

### 1. BoardEditor.jsx
- Modified onDone callbacks to include coordinatesFlipped state
- Data passed: { fen, pieces, side, castling, ep, action, coordinatesFlipped }

### 2. App.jsx  
- Added oardCoordinatesFlipped state to manage board display preferences
- Updated handleBoardDone() to capture the coordinatesFlipped value
- Pass oardCoordinatesFlipped prop to GamePlay component

### 3. GamePlay.jsx
- Updated function signature to accept oardCoordinatesFlipped prop
- Initialize oardFlipped state with the prop value instead of hardcoded false

## How It Works

The board flip state now flows through the component hierarchy:
\\\
BoardEditor.coordinatesFlipped 
  → onDone callback
  → App.boardCoordinatesFlipped state
  → GamePlay.boardCoordinatesFlipped prop  
  → GamePlay.boardFlipped state
  → ChessBoard component
  → Square components display flipped coordinates
\\\

## Testing

1. Open Board Editor
2. Click "↔️ Coords" button to flip coordinates
3. Click "▶️ Play" button
4. Verify coordinates remain flipped in Analysis Mode
5. Coordinates should persist correctly

## Files Modified

- scan-web/src/BoardEditor.jsx
- scan-web/src/App.jsx
- scan-web/src/components/pages/GamePlay.jsx

## Backward Compatibility

- Default value of boardCoordinatesFlipped is false
- No breaking changes to existing functionality
- Fully backward compatible



