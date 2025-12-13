# Installation Guide

## Quick Install (3 Minutes)

### For Customers

#### Step 1: Open Chrome Extensions Page
1. Open Google Chrome
2. In the address bar, type: `chrome://extensions/`
3. Press Enter

#### Step 2: Enable Developer Mode
1. Look at the top-right corner
2. Find the "Developer mode" toggle
3. Turn it ON (it should be blue)

#### Step 3: Load the Extension
1. Click the "Load unpacked" button (top-left area)
2. A file browser will open
3. Navigate to and select the **`network-support-extension`** folder
4. Click "Select Folder" or "Open"
5. The extension is now installed!

#### Step 4: Verify Installation
You should see:
- ✅ "Network Support Extension" in your extensions list
- ✅ Version 1.0.0
- ✅ A purple shield icon
- ✅ No error messages

#### Step 5: Pin the Extension (Optional but Recommended)
1. Click the puzzle piece icon 🧩 in Chrome's toolbar
2. Find "Network Support Extension"
3. Click the pin icon 📌
4. The extension icon will now stay visible in your toolbar

### You're Ready!

Click the extension icon to start using it. See CUSTOMER_GUIDE.md for usage instructions.

---

## For Support Teams

### Distribution Options

#### Option 1: Share Unpacked Folder (Easiest)
1. Zip the entire `network-support-extension` folder
2. Send to customers via secure channel
3. Provide this INSTALL.md file
4. Customer follows steps above

**Pros:**
- Easy to update
- Easy to debug
- No Chrome Web Store needed

**Cons:**
- Requires "Developer mode"
- Shows "Developer extension" warning

#### Option 2: Create CRX Package
1. Go to `chrome://extensions/`
2. Click "Pack extension"
3. Extension root directory: select `network-support-extension` folder
4. Private key file: leave blank (first time)
5. Click "Pack Extension"
6. Two files are created:
   - `network-support-extension.crx` (the extension)
   - `network-support-extension.pem` (keep this private! needed for updates)

**Installing CRX:**
1. Drag `network-support-extension.crx` onto `chrome://extensions/`
2. Click "Add extension"

**Note:** Chrome may block direct CRX installation from outside Chrome Web Store.

#### Option 3: Chrome Web Store (Production)
For large-scale deployment:
1. Create Chrome Web Store developer account ($5 one-time fee)
2. Package extension as ZIP
3. Upload to Chrome Web Store dashboard
4. Submit for review
5. Once approved, share Web Store link

**Benefits:**
- No "Developer mode" needed
- Auto-updates
- No warnings
- Professional appearance

---

## Troubleshooting Installation

### "Load unpacked" button is grayed out
- **Solution:** Enable "Developer mode" first (toggle in top-right)

### "Failed to load extension"
- **Solution:** Make sure you selected the `network-support-extension` FOLDER, not a single file
- The folder must contain `manifest.json`

### "Manifest file is missing or unreadable"
- **Solution:** Re-download/re-extract the extension
- Make sure all files are present
- Check folder permissions

### Extension loads but icon doesn't appear
- **Solution:** Click the puzzle piece 🧩 in toolbar
- Pin the extension
- Or open the Extensions menu to access it

### "This extension may be corrupted"
- **Solution:** 
  1. Remove the extension
  2. Re-download the folder
  3. Try installing again
  4. Make sure you're not extracting from a corrupted ZIP

### Chrome keeps asking about "test automation"
- **Info:** This is normal when the debugger API is active
- Happens when recording is started
- Goes away when recording stops
- Extension is working correctly

---

## Verifying Installation

After installation, verify the extension works:

1. **Check Extensions Page**
   - Go to `chrome://extensions/`
   - Find "Network Support Extension"
   - Status should be "ON"
   - No errors shown

2. **Test Basic Functionality**
   - Open any webpage
   - Click the extension icon
   - You should see the popup interface
   - Try clicking "Start Recording"
   - If it works, you'll see status change to "Recording..."
   - Click "Stop Recording"

3. **Check Permissions**
   - On `chrome://extensions/`, click "Details" on the extension
   - Verify these permissions are granted:
     - Read and change all your data on all websites
     - Communicate with cooperating native applications

---

## Updating the Extension

### If Distributed as Folder

1. Delete old folder (or rename it)
2. Extract new version
3. Go to `chrome://extensions/`
4. Click "Reload" button on the extension
5. Or remove and re-add following installation steps

### If Distributed as CRX

1. Package new version with same `.pem` file
2. Distribute new `.crx`
3. Users drag new CRX to extensions page
4. Chrome will update automatically

---

## Removing the Extension

If you need to uninstall:

1. Go to `chrome://extensions/`
2. Find "Network Support Extension"
3. Click "Remove"
4. Confirm removal
5. Delete the downloaded folder (optional)

---

## Security Notes

### Why Does It Need "Developer Mode"?

Developer mode is required to install extensions that aren't from the Chrome Web Store. This is a Chrome security feature.

### Is It Safe?

Yes, when installed from a trusted source (your support team):
- All code runs locally in your browser
- No data is sent to external servers
- You can review the source code (it's JavaScript)
- Only captures data when you explicitly start recording

### What Permissions Does It Use?

- **debugger**: To capture network traffic
- **tabs**: To know which tab to record
- **storage**: To remember recording state
- **<all_urls>**: To capture traffic from any website

These permissions are necessary for the extension to function.

---

## Getting Help

If you encounter issues:
1. Review troubleshooting section above
2. Check CUSTOMER_GUIDE.md for usage help
3. Check README.md for technical details
4. Contact your support team with:
   - Screenshot of the error
   - Chrome version (chrome://version/)
   - Steps you took
   - What happened vs what you expected

---

**Installation complete! See CUSTOMER_GUIDE.md for usage instructions.**
