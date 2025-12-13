# Customer Guide: Network Support Extension

## What is this?

This is a simple Chrome extension that helps us debug network and API issues you're experiencing. It records all network activity while you reproduce the problem.

## Installation (One-Time Setup)

### Step 1: Install the Extension

1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. Turn ON "Developer mode" (toggle switch in the top-right corner)
4. Click the blue "Load unpacked" button
5. Select the `network-support-extension` folder you received
6. The extension is now installed!

### Step 2: Pin the Extension (Recommended)

1. Look for the puzzle piece icon 🧩 in your Chrome toolbar
2. Click it to see your extensions
3. Find "Network Support Extension"
4. Click the pin icon 📌 next to it
5. The extension icon will now appear in your toolbar

## How to Capture Debug Data

### Simple 5-Step Process

#### 1️⃣ Click the Extension Icon
- Look for the purple shield icon in your Chrome toolbar
- Click it to open the control panel

#### 2️⃣ Click "Start recording"
- The blue button
- The status dot will turn red
- Status changes to "Recording"

#### 3️⃣ Do Your OAuth Flow
- Log in to the application
- Go through the authentication process
- Complete any steps that are failing
- The extension is capturing everything automatically

#### 4️⃣ Click "Stop Recording"
- Click the extension icon again
- Click the red "Stop Recording" button
- Check that you see captured requests (not 0)

#### 5️⃣ Export and Upload
- Click the green "Export HAR" button
- A file will download: `network-capture-YYYY-MM-DD-HHmmss.har`
- Upload this file to your support ticket
- You're done! ✅

## Visual Guide

**Before recording:**
```
Click the extension icon → You see this:

┌──────────────────────────────┐
│ Network Support Extension    │
├──────────────────────────────┤
│ ⚫ Not recording              │
│ Requests: 0    Duration: 0s  │
├──────────────────────────────┤
│ [   Start recording   ] ← Click
└──────────────────────────────┘
```

**While recording:**
```
┌──────────────────────────────┐
│ Network Support Extension    │
├──────────────────────────────┤
│ 🔴 Recording                 │
│ Requests: 23   Duration: 45s │
├──────────────────────────────┤
│ [   Stop recording    ] ← Click
│                         when done
└──────────────────────────────┘
```

**After recording:**
```
┌──────────────────────────────┐
│ Network Support Extension    │
├──────────────────────────────┤
│ ⚫ Not recording              │
│ Requests: 47   Duration: 2m  │
├──────────────────────────────┤
│ [Export HAR] ← Click to download
└──────────────────────────────┘
```

## Important Notes

### ⚠️ Privacy Warning

**The HAR file contains sensitive information:**
- Your login tokens
- Session cookies
- Any passwords you entered
- Personal information

**Therefore:**
- ✅ Only upload to our secure support portal
- ✅ Delete the file after uploading
- ❌ Don't email the HAR file
- ❌ Don't share it publicly

### ℹ️ You'll See a Warning

When you start recording, Chrome will show:
```
"Chrome is being controlled by automated test software"
```

**This is normal!** It means the extension is working correctly. The warning will go away when you stop recording.

## Troubleshooting

### Problem: Can't find the extension icon
**Solution:** 
- Click the puzzle piece 🧩 in your toolbar
- Find "Network Support Extension"
- Click the pin 📌 next to it

### Problem: "Start Recording" doesn't work
**Solution:**
- Make sure you have a webpage open (not a blank tab)
- Try closing the popup and clicking the icon again
- If still failing, refresh the page and try again

### Problem: Request count shows 0
**Solution:**
- You must click "Start Recording" BEFORE logging in
- Stop recording, click "Clear Data", and try again
- Make sure to start recording first, then do your login

### Problem: Download not working
**Solution:**
- Check your Downloads folder (it may have downloaded)
- Check if Chrome is blocking downloads (look for icon in address bar)
- Try clicking "Export HAR" again

### Problem: Extension disappeared
**Solution:**
- Go to `chrome://extensions/`
- Make sure "Network Support Extension" is ON
- If not there, you may need to reinstall (follow installation steps)

## Tips for Best Results

1. **Start recording BEFORE you begin**
   - Don't wait until you hit the error
   - Capture the entire flow from the beginning

2. **Include the error**
   - If you get an error, leave recording on
   - Capture the error page
   - Then stop recording

3. **Don't record too much**
   - Only record what's needed
   - Too much data makes analysis harder
   - Stop as soon as you've completed the flow

4. **Check request count**
   - Before exporting, make sure you have requests captured
   - If it says 0, something went wrong

## Where to Get Help

If you're having trouble:
1. Review this guide
2. Check the Troubleshooting section
3. Contact your support representative
4. Include screenshots of any errors you see

## Quick Reference

| Action | How |
|--------|-----|
| Start recording | Click icon → "Start Recording" |
| Stop recording | Click icon → "Stop Recording" |
| Export file | Click icon → "Export HAR" |
| Clear data | Click icon → "Clear Data" |
| See if recording | Look for "REC" badge on icon |

---

**Thank you for helping us debug your issue!** 

The information you provide helps us fix problems faster and improve our service for everyone.
