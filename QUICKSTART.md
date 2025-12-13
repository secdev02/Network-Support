# Quick Start Guide

## 📥 Installation (First Time Only)

1. Open Chrome and go to: `chrome://extensions/`
2. Turn ON "Developer mode" (toggle in top-right)
3. Click "Load unpacked" button
4. Select the `network-support-extension` folder
5. Done! ✅

## 🎯 How to Use (Every Time)

### To Capture Debug Data:

1. **Click** the extension icon in your toolbar
2. **Click** "Start recording" button
3. **Do** your login/OAuth flow
4. **Click** "Stop recording" when done
5. **Click** "Export HAR" to download the file
6. **Upload** the `.har` file to your support ticket

### For Engineers - View Live Network Log:

1. Click the extension icon
2. Click "View live log" button
3. See requests in real-time as they happen
4. Use search bar to filter requests
5. Search through URLs, headers, bodies

### For Engineers - Analyze HAR Files:

1. Click the extension icon
2. Click "Analyze HAR" button
3. Drag and drop any HAR file
4. Search through all requests
5. View detailed headers, bodies, timing
6. Export filtered results

### For Engineers - Session Replay (Diagnostics):

1. Click the extension icon
2. Click "Session Replay" button
3. Load a HAR file
4. Select extracted token/session
5. Configure and send test request
6. View response in real-time
7. **Use case**: Replay customer's exact session to reproduce issues

That's it! 🎉

## 💡 Tips

- Start recording **BEFORE** you log in
- Don't stop recording until you've completed the entire flow
- If you see "0 requests", you need to start recording first
- The icon turns red with "REC" badge when recording

## ⚠️ Important

The HAR file contains:
- Your login tokens
- Session cookies  
- Passwords (if you entered them)

**Only upload through the secure support portal!**

## 📚 Need More Help?

- **INSTALL.md** - Detailed installation instructions
- **CUSTOMER_GUIDE.md** - Complete user guide with screenshots
- **README.md** - Full technical documentation

---

**Questions?** Contact your support representative.
