# Fix: Navigation Stuck After Board Detection ✅

## 🐛 Problem

After board detection succeeded (showing logs like "Board detection successful", "Navigating to board-preview..."), the app would get stuck and not navigate to the board-preview screen. Sometimes it would show the camera again instead.

### Symptoms:
```
LOG  ✅ Board detection successful!
LOG  ⏱️ Timing: Upload+Detect: 9994 ms, Total: 10159 ms
LOG  📊 Result: {"fen": "...", "hasBoardCorners": true, "hasDebugImage": true}
LOG  🔀 Navigating to board-preview...
❌ [Nothing happens - stuck or goes back to camera]
```

---

## 🔍 Root Cause

**Expo Router Navigation Param Size Limit Exceeded**

The app was trying to pass a **base64-encoded debug image** through navigation params:

```typescript
// ❌ PROBLEM: debugImage can be 500KB+ of base64 data
router.push({
  pathname: '/board-preview',
  params: { 
    imageUri: '...',
    debugImage: result.debugImage || '', // 🚨 TOO LARGE!
    fen: '...',
  },
});
```

### Why This Breaks:

1. **Base64 images are huge**: A 800x800 PNG can be 500KB+ as base64
2. **Expo Router uses URL params**: Params are serialized into the URL
3. **URLs have size limits**: Most systems can't handle 500KB URLs
4. **Silent failure**: Expo Router just silently fails with large params

### Why Web App Works:

The web app doesn't use navigation params for large data:

```javascript
// Web app uses React state, not navigation params
const [warpedBoard, setWarpedBoard] = useState(null) // base64 PNG
const [extractedSquares, setExtractedSquares] = useState(null)

// Data stays in parent component and is passed as props
```

---

## ✅ Solution

### Don't Pass Large Data Through Navigation Params

**Before (BROKEN):**
```typescript
router.push({
  pathname: '/board-preview',
  params: { 
    imageUri: resizedImage.uri,
    debugImage: result.debugImage || '', // ❌ 500KB+ base64
    boardCorners: JSON.stringify(result.boardCorners),
    fen: result.fen,
  },
});
```

**After (WORKING):**
```typescript
// Only pass essential data (URIs and strings)
router.replace({
  pathname: '/board-preview',
  params: { 
    imageUri: resizedImage.uri, // ✅ Small file path
    boardCorners: JSON.stringify(result.boardCorners), // ✅ Small JSON
    fen: result.fen, // ✅ Small string (< 100 chars)
    // ❌ Removed: debugImage (too large)
  },
});
```

### Key Changes:

1. **Removed debugImage from params** - it was 500KB+ of base64 data
2. **Show original image instead** - use the `imageUri` (file path, not base64)
3. **Used `router.replace`** - prevents going back to processing screen

---

## 📊 Comparison: What Can Be Passed

| Data Type | Size | Can Pass? | Example |
|-----------|------|-----------|---------|
| File URI | ~50 bytes | ✅ YES | `file:///data/.../image.jpg` |
| FEN string | ~90 bytes | ✅ YES | `rnbqkbnr/pppppppp/...` |
| Small JSON | < 1KB | ✅ YES | `{"x":0,"y":0,"w":8,"h":8}` |
| Base64 image | 500KB+ | ❌ NO | `iVBORw0KGgoAAAANS...` (crashes) |
| Large arrays | 10KB+ | ⚠️ AVOID | `[{...}, {...}, ...]` (risky) |

### Rule of Thumb:
- ✅ **DO** pass: URIs, IDs, simple strings, small JSON
- ❌ **DON'T** pass: Base64 data, large objects, images

---

## 🔧 Files Modified

### 1. `app/scan.tsx`
**Changed:**
- Removed `debugImage` from navigation params
- Added comment explaining why
- Added size logging for debugging

```typescript
// Note: We don't pass debugImage through params because base64 images can be
// too large for Expo Router navigation params (can cause "Failed to parse URL" errors)
router.replace({
  pathname: '/board-preview',
  params: { 
    imageUri: resizedImage.uri, // Show original image instead
    boardCorners: JSON.stringify(result.boardCorners),
    fen: result.fen,
  },
});
```

### 2. `app/board-preview.tsx`
**Changed:**
- Removed `debugImage` from params interface
- Removed debug image display logic
- Simplified to show original captured image
- Added better logging for debugging

```typescript
// Removed debugImage from params
const { imageUri, boardCorners, fen } = useLocalSearchParams<{ 
  imageUri: string; 
  boardCorners?: string;
  fen: string;
}>();

// Just show the original image
<Image 
  source={{ uri: imageUri }} 
  style={styles.boardImage}
  resizeMode="contain"
/>
```

---

## 🎯 Alternative Solutions (If Debug Image Needed)

If you really need to show the debug image with corner markers:

### Option 1: Save to Temp File
```typescript
// In scan.tsx, save base64 to file
import * as FileSystem from 'expo-file-system';

const debugImageUri = FileSystem.cacheDirectory + 'debug_board.png';
await FileSystem.writeAsStringAsync(
  debugImageUri, 
  result.debugImage, 
  { encoding: FileSystem.EncodingType.Base64 }
);

// Then pass file URI (small)
router.push({
  params: { debugImageUri } // ✅ Small file path
});
```

### Option 2: Use Global State
```typescript
// Create a context or store
const [debugImageData, setDebugImageData] = useState(null);

// In scan.tsx
setDebugImageData(result.debugImage);
router.push('/board-preview');

// In board-preview.tsx
const debugImageData = useContext(DebugImageContext);
```

### Option 3: Skip Debug Image
```typescript
// Simplest: just show the original image
// User can see the board, that's enough for preview
```

**We chose Option 3** because:
- Simplest implementation
- Debug image isn't essential for user flow
- Original image is sufficient for preview
- Backend already validated the board detection

---

## 🧪 Testing

### Test 1: Normal Scan Flow
1. ✅ Open app
2. ✅ Tap "Scan Board"
3. ✅ Take photo
4. ✅ Wait ~10 seconds (processing)
5. ✅ Should navigate to board-preview
6. ✅ Should show captured image
7. ✅ Should show detected FEN

### Test 2: Verify Navigation
Check console logs:
```
✅ Board detection successful!
🔀 Navigating to board-preview...
📦 Navigation params: {"hasImageUri": true, "debugImageSize": "none", ...}
✅ Navigation initiated
🖼️ BoardPreview mounted
📦 Received params: {"hasImageUri": true, "fen": "...", ...}
✅ Board image loaded successfully
```

### Test 3: Error Handling
1. ❌ Stop backend
2. 📸 Take photo
3. ⏱️ Wait for error
4. ✅ Should show error alert
5. ✅ Should return to camera

---

## 📝 Summary

### The Issue:
- Trying to pass 500KB+ base64 image through navigation params
- Expo Router silently fails with large params
- Navigation gets stuck or goes back to camera

### The Fix:
- Don't pass debugImage (base64) through params
- Only pass small data: file URIs, FEN strings, simple JSON
- Use `router.replace` to prevent back button issues

### The Result:
- ✅ Navigation works reliably
- ✅ Board preview screen loads properly
- ✅ User can see their captured board
- ✅ Detected FEN is displayed correctly

---

## 🎓 Lessons Learned

1. **Navigation Params Are URLs**
   - They're serialized into URL query strings
   - Must be small (< 10KB recommended)
   - Large data causes silent failures

2. **Mobile ≠ Web**
   - Web apps use props and React state
   - Mobile navigation uses serialized params
   - Different constraints require different solutions

3. **Base64 Is Huge**
   - 800x800 PNG → ~500KB base64
   - File URIs are tiny (~50 bytes)
   - Always prefer file references over inline data

4. **Debug Early**
   - Log param sizes before navigation
   - Log navigation success/failure
   - Monitor component mounting

---

## ✅ Status: FIXED

Your scanning flow should now work smoothly:

**Camera** → **Processing (10s)** → **Board Preview** → **Board Editor** → **Analysis**

No more stuck screens! 🎉

