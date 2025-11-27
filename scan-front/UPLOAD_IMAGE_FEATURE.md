# Upload Image Feature ✅

## 🎯 Feature Overview

Added the ability to **upload images from your phone's gallery** instead of only taking photos with the camera.

### New Options:

1. **📸 Home Screen**: "Upload Image" card - directly upload from gallery
2. **📸 Scan Screen**: "Upload from Gallery" button - alternative to camera capture

---

## 🆕 What's New

### Home Screen - New Card

```
┌─────────────────────────────────┐
│ 🖼️ Upload Image                 │
│ Select board photo from gallery │
└─────────────────────────────────┘
```

**Flow:**
1. Tap "Upload Image" from home
2. Select image from gallery
3. Auto-processes and detects board
4. Goes to board preview
5. Then to board editor/analysis

### Scan Screen - New Button

```
┌─────────────────────────────────┐
│   [📸 Capture Board]            │
│   [🖼️ Upload from Gallery]      │
└─────────────────────────────────┘
```

**Flow:**
1. Open scan screen
2. Tap "Upload from Gallery" instead of capture
3. Select image
4. Auto-processes and detects board
5. Goes to board preview

---

## 🔧 Technical Implementation

### Dependencies Added

```json
{
  "expo-image-picker": "~16.0.0"
}
```

### Files Modified

#### 1. `app/scan.tsx`
- Added `import * as ImagePicker from 'expo-image-picker'`
- Added `pickImageFromGallery()` function
- Added "Upload from Gallery" button to UI
- Requests media library permissions
- Processes selected image same as camera capture

```typescript
const pickImageFromGallery = async () => {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  // Open image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });
  
  // Process image
  if (!result.canceled) {
    await handlePhotoCapture(result.assets[0].uri);
  }
};
```

#### 2. `app/index.tsx`
- Added `import * as ImagePicker from 'expo-image-picker'`
- Added `handleUploadImage()` function
- Added "Upload Image" ModeCard
- Processes image and navigates to board preview

```typescript
const handleUploadImage = async () => {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync(...);
  
  // Resize
  const resizedImage = await manipulateAsync(...);
  
  // Detect board
  const boardResult = await recognizeChessBoard(resizedImage.uri);
  
  // Navigate to preview
  router.push('/board-preview', { fen: boardResult.fen, ... });
};
```

#### 3. `package.json`
- Added `"expo-image-picker": "~16.0.0"` to dependencies

---

## 📱 Permissions

### Android
Automatically requests `READ_MEDIA_IMAGES` permission when user taps upload button.

### iOS
Automatically requests Photo Library access when user taps upload button.

**Note:** On first use, user will see system permission dialog.

---

## 🎨 UI/UX

### Home Screen Upload
- **Icon:** 🖼️
- **Title:** "Upload Image"
- **Description:** "Select board photo from gallery"
- **Disabled state** when uploading (prevents double-tap)

### Scan Screen Upload
- **Button:** "🖼️ Upload from Gallery"
- **Style:** Secondary variant (subtle, not primary)
- **Position:** Below "Capture Board" button

---

## 🔄 Processing Flow

Both home and scan screen uploads follow the same flow:

```
User taps Upload
     ↓
Request Permission
     ↓
Open Gallery Picker
     ↓
User selects image
     ↓
Resize to 1600px width
     ↓
Compress to JPEG (0.8 quality)
     ↓
Send to backend /infer
     ↓
Receive FEN + board data
     ↓
Navigate to board-preview
     ↓
User confirms/edits
     ↓
Board editor or analyze
```

**Same as camera flow** - just different input source!

---

## 🧪 Testing

### Test 1: Home Screen Upload
1. Open app
2. Tap "Upload Image" card
3. Allow permissions (first time)
4. Select a chess board photo
5. Wait ~10 seconds (processing)
6. Should see board preview
7. Verify FEN is correct

### Test 2: Scan Screen Upload
1. Open app
2. Tap "Scan from Camera"
3. Tap "Upload from Gallery" button
4. Select a chess board photo
5. Wait ~10 seconds (processing)
6. Should see board preview
7. Verify FEN is correct

### Test 3: Permission Denied
1. Deny permission when asked
2. Should see alert: "Sorry, we need camera roll permissions..."
3. Return to previous screen
4. Can try again

### Test 4: Cancel Picker
1. Tap upload
2. Cancel image picker
3. Should return to previous screen
4. No error or crash

---

## ⚠️ Error Handling

### Permission Denied
```
Alert: "Sorry, we need camera roll permissions to upload images!"
```

### No Image Selected
```
(Silently returns - no error)
```

### Board Detection Failed
```
Alert: "Failed to process image: [error message]
Please try again with a clear board photo."
```

### Network Error
```
Alert: "Failed to process image: Network request failed
Please try again with a clear board photo."
```

---

## 💡 Tips for Users

### Best Images to Upload:
- ✅ Clear, well-lit board photos
- ✅ Entire board visible
- ✅ Minimal glare or shadows
- ✅ Perpendicular angle (not tilted)
- ✅ JPEG or PNG format

### Images to Avoid:
- ❌ Blurry or dark photos
- ❌ Board partially cut off
- ❌ Heavy shadows or glare
- ❌ Extreme angles
- ❌ Low resolution (< 500px)

---

## 🔍 Troubleshooting

### Issue 1: "Cannot find module 'expo-image-picker'"
**Solution:**
```bash
cd scan-front
npm install
# Or restart Metro/TypeScript server
npx expo start -c
```

### Issue 2: Permission always denied
**Solution:**
- Go to phone Settings
- Apps → Chess Scan
- Permissions → Photos/Media
- Allow access

### Issue 3: Upload button not working
**Solution:**
- Check backend is running
- Check network connection
- Try diagnostics screen
- Check console logs

### Issue 4: Slow processing
**Normal:** 
- Large images take 10-20 seconds
- Backend detection is CPU-intensive
- Same speed as camera capture

---

## 📊 Feature Comparison

| Feature | Camera Capture | Gallery Upload |
|---------|----------------|----------------|
| **Speed** | Fast (device camera) | Fast (instant select) |
| **Quality** | Live capture | Pre-existing photo |
| **Retake** | Easy (just retake) | Must re-select |
| **Use Case** | Active game | Past games |
| **Best For** | Real-time play | Analyzing saved positions |

---

## 🎯 Use Cases

### 1. Analyzing Old Games
- Take photos during games
- Upload later for analysis
- Keep a photo library of positions

### 2. Sharing Positions
- Friend sends you board photo
- Upload to get FEN
- Analyze in app

### 3. Book/Magazine Positions
- Take photo of book diagram
- Upload to app
- Analyze the position

### 4. Multiple Attempts
- Board detection failed on camera
- Save photo and retry
- Adjust lighting and retake

---

## 🚀 Next Steps

### Potential Enhancements:

1. **Batch Upload**: Select multiple images at once
2. **Photo Editor**: Crop/rotate before detection
3. **History**: Show recently uploaded images
4. **Share**: Share detected FEN directly
5. **Cloud Sync**: Sync uploaded positions across devices

---

## ✅ Installation

### Fresh Install:
```bash
cd scan-front
npm install
```

### Restart Metro:
```bash
npx expo start -c
```

### On Device:
- Scan QR code
- Or use `npx expo run:android`

---

## 📝 Summary

**Added:**
- ✅ Upload image from gallery on home screen
- ✅ Upload button on scan screen
- ✅ Permission handling
- ✅ Same processing flow as camera
- ✅ Error handling and user feedback

**Use It:**
1. Tap "Upload Image" from home or "Upload from Gallery" from scan
2. Select board photo
3. Wait for detection
4. Review and analyze!

**Your app now supports both live camera capture AND gallery uploads!** 📸🖼️✨

