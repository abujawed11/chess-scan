# Network Error Fix Guide

## Problem: "Network Error" - Cannot reach backend

The mobile app can't connect to `http://192.168.1.7:8000`

---

## Solution 1: Using Android Emulator

If you're using **Android Emulator**, the IP `192.168.1.7` won't work!

### Fix:
Edit `scan-front\.env`:
```env
EXPO_PUBLIC_VISION_API_URL=http://10.0.2.2:8000
EXPO_PUBLIC_CHESS_ENGINE_URL=http://10.0.2.2:8000
```

Then restart app.

> `10.0.2.2` is special address for localhost in Android Emulator

---

## Solution 2: Using Real Phone

### Step 1: Verify Backend is Accessible

From your computer:
```bash
curl http://192.168.1.7:8000/health
```

✅ **If this works:** Backend is running correctly

❌ **If this fails:** Backend might not be binding to all interfaces

### Step 2: Check Your Current IP

```bash
ipconfig
```

Look for **IPv4 Address** under your WiFi adapter. Is it `192.168.1.7`?

If different, update `scan-front\.env` with correct IP.

### Step 3: Allow Firewall (Windows)

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Python Backend" dir=in action=allow protocol=TCP localport=8000
```

Or manually:
1. Windows Security → Firewall & Network Protection
2. Advanced Settings → Inbound Rules → New Rule
3. Port → TCP → 8000 → Allow

### Step 4: Verify Phone Can Reach Computer

From your phone's browser, visit:
```
http://192.168.1.7:8000/health
```

✅ Should show: `{"ok":true}`

---

## Solution 3: Test with Localhost (If Testing on Computer)

If running app on same computer as backend:

Edit `scan-front\.env`:
```env
EXPO_PUBLIC_VISION_API_URL=http://localhost:8000
EXPO_PUBLIC_CHESS_ENGINE_URL=http://localhost:8000
```

---

## Solution 4: Backend Not Binding to All Interfaces

Make sure backend is running with:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**NOT:**
```bash
uvicorn app:app --port 8000  # ❌ Only binds to localhost
```

---

## Quick Diagnostic

Run this from your computer:

```bash
# 1. Check backend is running
curl http://localhost:8000/health

# 2. Check backend is accessible on network
curl http://192.168.1.7:8000/health

# 3. If #2 fails, backend isn't accessible on network
# Check firewall or restart with --host 0.0.0.0
```

---

## Still Not Working?

1. **Both on same WiFi?**
   - Phone WiFi settings
   - Computer WiFi settings
   - Must be same network!

2. **VPN Running?**
   - Disable VPN on phone/computer
   - VPN can block local network access

3. **Company/School WiFi?**
   - May block device-to-device communication
   - Try phone hotspot instead

4. **Antivirus/Firewall?**
   - Temporarily disable to test
   - Then add exception for port 8000

---

## After Fixing:

1. Restart backend
2. Restart mobile app (important!)
3. Test again

Expected logs:
```
🚀 Sending inference request to: http://192.168.1.7:8000/infer
✅ Inference response received!
♟️ FEN: ...
```
