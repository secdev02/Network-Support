# Network Support Extension - Chrome Extension

**Complete network traffic capture and analysis for technical support**

A comprehensive Chrome extension for capturing, analyzing, and debugging all network traffic. Perfect for technical support teams who need complete visibility into API calls, authentication flows, file uploads, and any network activity.

## Features

- 🎯 **Simple**: Clean Google-style interface, one-click start/stop
- 📊 **Live Logger**: Real-time network log with search (like Chrome DevTools)
- 🔍 **HAR Analyzer**: Built-in tool to analyze HAR files with deep search
- 🔄 **Session Replay**: Extract and replay tokens/sessions from HAR files for diagnostics
- 💾 **Complete Capture**: ALL data including binary, compressed, and multipart
- 🔒 **Secure**: All processing happens locally in your browser

## Installation

### Quick Install (3 Steps)

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

2. **Load Extension**
   - Click "Load unpacked"
   - Select the `network-support-extension` folder

3. **Done!**
   - You'll see the extension icon in your toolbar
   - Click it to open the control panel

## How to Use

### For Customers Submitting Debug Data

1. **Click the extension icon** in your Chrome toolbar
   - You'll see the Network Support Extension popup

2. **Click "Start recording"**
   - The status dot turns red
   - Badge shows "REC"
   - Status shows "Recording"

3. **Perform your OAuth flow**
   - Log in
   - Go through authentication
   - Complete the entire process
   - All network traffic is captured automatically

4. **Click "Stop recording"**
   - Recording stops
   - Request count shows total captured requests

5. **Click "Export HAR"**
   - HAR file downloads automatically
   - Filename: `network-capture-YYYY-MM-DD-HHmmss.har`

6. **Upload to support portal**
   - Attach the .har file to your support ticket
   - That's it!

### For Engineers - Live Network Logger

**View real-time network traffic:**

1. Click the extension icon
2. Click "View live log" button
3. A new window opens showing live network requests
4. See requests appear in real-time as they happen
5. View method, status, URL, type, size, and timing
6. Similar to Chrome DevTools Network tab

**Features:**
- Real-time updates (500ms polling)
- Color-coded HTTP methods (GET, POST, PUT, DELETE, etc.)
- Status codes with visual indicators
- Request timing and size information
- Total statistics at bottom
- Clear log button to reset view
- **Search bar**: Search through URLs, headers, request/response bodies
- Highlights matching requests in real-time

### For Engineers - HAR Analyzer

**Deep analysis of HAR files:**

1. Click the extension icon
2. Click "Analyze HAR" button
3. Drag and drop a HAR file or click to browse
4. Browse all requests in the left panel
5. Click any request to see full details
6. Search across all requests, headers, and bodies

**Features:**
- Load any HAR file (from this extension or Chrome DevTools)
- **Powerful search**: Search through URLs, headers, request bodies, response bodies
- Split view: Request list + detailed view
- Tabbed detail view:
  - General (URL, method, status, timing, size)
  - Request Headers
  - Response Headers
  - Request Body (formatted JSON if applicable)
  - Response Body (formatted JSON if applicable)
  - Cookies (request and response)
  - Timing (detailed breakdown)
- **Export filtered**: Export only the requests matching your search
- Real-time search highlighting
- Stats showing total/filtered counts, size, time

### For Engineers - Session Replay (NEW!)

**Diagnostic tool for replaying customer sessions:**

1. Click the extension icon
2. Click "Session Replay" button
3. Load a HAR file (from customer or test environment)
4. Extension automatically extracts:
   - **Bearer tokens** from Authorization headers
   - **API keys** from headers or query parameters
   - **Session cookies** (session IDs, auth cookies)
   - **OAuth tokens** from response bodies (access_token, refresh_token)
   - **Basic auth** credentials
   - **Custom auth headers** (X-Auth-Token, X-API-Key, etc.)
5. **Two modes:**

   **A) Manual API Testing:**
   - Select a session/token from the sidebar
   - Configure request (URL, method, body)
   - Click "Send Request" to replay with that session
   - View response in real-time

   **B) Launch Incognito Session (NEW!):**
   - Click "🕵️ Launch Incognito with Cookies"
   - Extension opens new incognito window
   - All cookies automatically imported
   - **Browse as the user** - you're now logged in as them
   - Reproduce issues in their exact session state
   - Safe and isolated (incognito mode)

**Use cases:**
- **Reproduce customer issues**: Use their exact session to see what they're seeing
- **Test token validity**: Check if tokens are expired or invalid
- **Debug authorization**: Verify permissions and access levels
- **Test API endpoints**: Use production tokens in safe test environment
- **Validate OAuth flows**: Replay token exchanges and refresh flows
- **Browse as user**: See exact UI state, permissions, and data they see

**Incognito session benefits:**
- ✅ **Complete isolation**: Separate from your normal browsing
- ✅ **Auto-login**: All cookies set automatically
- ✅ **Safe testing**: No impact on your regular session
- ✅ **Multiple domains**: Handles cookies across all domains
- ✅ **Preserves flags**: HttpOnly, Secure, SameSite all maintained
- ✅ **Easy cleanup**: Close window to remove all session data

**Security warnings:**
- Only use in authorized test/staging environments
- Never replay production tokens without permission
- HAR files contain live credentials - handle securely
- Tokens may have side effects when replayed
- You ARE the user - actions taken are as them

## What Gets Captured

The extension captures **EVERYTHING** about network requests:

### Request Data
- ✅ Full URL with all query parameters
- ✅ HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
- ✅ **All request headers** (Authorization, Cookie, Content-Type, User-Agent, etc.)
- ✅ **POST/PUT/PATCH body data:**
  - ✅ Form-encoded data (application/x-www-form-urlencoded)
  - ✅ **Multipart form data (multipart/form-data) with boundaries**
  - ✅ **JSON payloads**
  - ✅ **Binary data (captured as base64)**
  - ✅ **XML, plain text, and other formats**
- ✅ Request cookies (complete with all cookie attributes)

### Response Data
- ✅ Status code and status text
- ✅ **All response headers** (Set-Cookie, Location, Content-Encoding, etc.)
- ✅ **Complete response body:**
  - ✅ Text content (HTML, JSON, XML, plain text)
  - ✅ **Binary content (images, PDFs, etc. - base64 encoded)**
  - ✅ **Compressed responses (gzip, deflate, brotli)**
  - ✅ Large responses (not truncated)
- ✅ Response cookies (HttpOnly, Secure, SameSite, expires, domain, path)
- ✅ Compression and encoding information

### Metadata
- ✅ Timestamps (start, response received, finished)
- ✅ Request timing breakdown (blocked, DNS, connect, SSL, send, wait, receive)
- ✅ Protocol version (HTTP/1.1, HTTP/2, HTTP/3)
- ✅ Request type/resource type (XHR, fetch, document, script, image, etc.)
- ✅ Server IP address
- ✅ Request priority
- ✅ Cache status
- ✅ Failed requests (error messages, cancellation)
- ✅ Redirect chains

## Visual Guide

```
┌──────────────────────────────┐
│ Network Support Extension    │
├──────────────────────────────┤
│ ⚫ Not recording              │
│                              │
│ Requests    Duration         │
│    0           0s            │
├──────────────────────────────┤
│ [   Start recording   ]      │
│ [   View live log     ]      │
│ [   Analyze HAR       ]      │
│ [   Session Replay    ]      │
│ [Export HAR]  [Clear]        │
├──────────────────────────────┤
│ ⚠️ HAR files contain         │
│ sensitive data...            │
└──────────────────────────────┘
```

**When recording:**
```
┌──────────────────────────────┐
│ Network Support Extension    │
├──────────────────────────────┤
│ 🔴 Recording                 │
│                              │
│ Requests    Duration         │
│   47         2m 15s          │
├──────────────────────────────┤
│ [   Stop recording    ]      │
│ [   View live log     ]      │
│ [   Analyze HAR       ]      │
│ [   Session Replay    ]      │
│ [Export HAR]  [Clear]        │
└──────────────────────────────┘
```

## Security & Privacy

### ⚠️ Important Security Information

HAR files contain sensitive data:
- **OAuth tokens** (access tokens, refresh tokens, authorization codes)
- **Session cookies** (including HttpOnly cookies)
- **API keys** in headers or query parameters
- **Passwords** if submitted via forms
- **Personal data** in requests and responses
- **Internal URLs** and API endpoints

### Best Practices

1. **Only share HAR files through secure channels**
   - Use encrypted support portals
   - Never email HAR files
   - Never post HAR files publicly

2. **Delete HAR files after uploading**
   - Don't leave them in your Downloads folder
   - Secure delete if possible

3. **Use only when needed**
   - Don't leave recording on continuously
   - Stop recording as soon as you're done

4. **Review before sharing** (optional)
   - HAR files are JSON text files
   - You can open them in a text editor to review
   - Look for sensitive data if concerned

### Privacy Guarantee

This extension:
- ❌ Does NOT send data to external servers
- ❌ Does NOT store data permanently
- ❌ Does NOT track your browsing
- ❌ Does NOT share data with third parties
- ✅ Operates 100% locally in your browser
- ✅ Only saves data when you explicitly export

## Troubleshooting

### Extension icon not visible
- Check `chrome://extensions/` to ensure it's enabled
- Look for the purple shield icon in your toolbar
- Pin the extension if needed (click the puzzle piece icon)

### "Start Recording" fails
- Make sure you have a tab open
- Try refreshing the page and clicking again
- Check for any error messages in the console

### No requests captured
- Ensure you clicked "Start Recording" **before** performing the OAuth flow
- Check that the status shows "Recording..."
- Look for the red recording badge on the icon

### Export button does nothing
- Check your browser's download settings
- Make sure pop-ups aren't blocked
- Check the Downloads folder

### "Chrome is being controlled by automated test software"
- This warning appears when using the debugger API
- It's normal and safe - the extension needs this to capture traffic
- The warning disappears when you stop recording

## Technical Details

### Permissions Required

- **debugger**: To attach to tabs and capture network traffic via Chrome DevTools Protocol
- **tabs**: To access current tab information
- **storage**: To maintain recording state
- **host_permissions (<all_urls>)**: To capture traffic from any website

### How It Works

1. When you start recording, the extension attaches the Chrome debugger to your current tab
2. It enables the Network domain of the Chrome DevTools Protocol
3. All network events are captured in real-time
4. Events are stored in memory with complete request/response data
5. When you export, the extension converts captured data to HAR 1.2 format
6. The HAR file is downloaded to your default downloads folder

### Browser Compatibility

- ✅ Chrome 88+
- ✅ Microsoft Edge 88+
- ✅ Brave
- ✅ Other Chromium-based browsers
- ❌ Firefox (uses different extension APIs)
- ❌ Safari (uses different extension APIs)

### File Format

Exports standard **HAR 1.2** format, compatible with:
- Chrome DevTools (Network tab → right-click → "Import HAR")
- Firefox Developer Tools
- Charles Proxy
- Fiddler
- Postman
- Online HAR viewers (e.g., http://www.softwareishard.com/har/viewer/)

## Distribution

### For Support Teams

**Option 1: Share folder (recommended for internal use)**
1. Zip the entire `network-support-extension` folder
2. Send to customers with installation instructions
3. They follow the Quick Install steps above

**Option 2: Create CRX package (for external distribution)**
1. Go to `chrome://extensions/`
2. Click "Pack extension"
3. Select the `network-support-extension` folder
4. Click "Pack Extension"
5. Distribute the generated `.crx` file

**Note**: Chrome may block direct installation of CRX files from outside the Chrome Web Store. Users may need to drag the CRX file into `chrome://extensions/`.

## Advanced Usage

### Using Search in Live Logger

The live logger includes a powerful search bar that searches through:
- Request URLs
- Request and response headers
- POST data / request bodies
- Response bodies (excluding base64 encoded content)
- HTTP methods
- Status codes

**Examples:**
- Search for `access_token` to find OAuth token exchanges
- Search for `authorization` to find auth headers
- Search for `client_id` to find OAuth parameters
- Search for `401` to find unauthorized requests
- Search for domain names to filter by API endpoint

**Tips:**
- Search is case-insensitive
- Results highlight in yellow
- Non-matching requests are hidden
- Clear search with the X button to show all

### Using Session Replay

The session replay tool is perfect for:
- **Debugging customer issues**: Load their HAR file and replay their exact requests
- **Testing token expiration**: See if tokens are still valid
- **Verifying permissions**: Test what a user can/cannot access
- **API troubleshooting**: Replay failed requests to diagnose issues
- **Browser as user**: Launch incognito session to see their exact experience

**Common workflows:**

1. **Diagnose a customer's 401 error:**
   - Get HAR file from customer
   - Load in Session Replay
   - Select their Bearer token
   - Replay the failing request
   - See the actual error response

2. **Test token refresh:**
   - Extract refresh_token from HAR
   - Configure POST request to /token endpoint
   - Add refresh_token to body
   - Send request to get new access_token

3. **Verify API access:**
   - Extract session cookie
   - Test various API endpoints
   - Confirm what user can access

4. **Browse as the user (NEW!):**
   - Load customer's HAR file
   - Click "View Cookies to Import" to see what will be set
   - Click "🕵️ Launch Incognito with Cookies"
   - Incognito window opens with all cookies set
   - Navigate to the application - you're logged in as them
   - Reproduce the exact issue they reported
   - See their permissions, data, and UI state
   - Close window when done (all cookies removed)

5. **Debug complex multi-step flows:**
   - Launch incognito session with user's cookies
   - Walk through their workflow step by step
   - See where it breaks or behaves differently
   - Check console for errors they might not report

**Supported auth types:**
- Bearer tokens (OAuth 2.0)
- API keys (header or query parameter)
- Basic authentication
- Session cookies
- Custom auth headers (X-Auth-Token, etc.)
- OAuth refresh tokens
- OpenID Connect ID tokens

**Cookie Selection & Export:**
- Select individual cookies or all cookies per domain
- Export in our format or Cookie-Editor format
- Fully compatible with Cookie-Editor browser extension
- Import from Cookie-Editor exports
- See [COOKIE_EDITOR_GUIDE.md](COOKIE_EDITOR_GUIDE.md) for details

**Safety tips:**
- Only use test/staging environments when possible
- Get authorization before replaying production tokens
- Be aware tokens may trigger actions (emails, notifications, etc.)
- Check token expiration before replaying
- Use incognito mode to isolate from your normal session
- Remember: in incognito session, you ARE that user - any actions are as them

**📖 For complete guide on Incognito Session feature, see [INCOGNITO_GUIDE.md](INCOGNITO_GUIDE.md)**

### Using HAR Analyzer

The HAR analyzer is perfect for:
- **Post-mortem debugging**: Load exported HAR files
- **Finding specific requests**: Search through thousands of requests instantly
- **Deep inspection**: View full headers, bodies, cookies, timing
- **Sharing filtered data**: Export only relevant requests

**Common workflows:**

1. **Find failed OAuth requests:**
   - Load HAR file
   - Search for `token` or `oauth`
   - Look for 4xx/5xx status codes
   - Inspect headers and bodies

2. **Find all requests to specific API:**
   - Search for the domain name
   - Click "Export Filtered" to save subset

3. **Debug CORS issues:**
   - Search for `origin` or `cors`
   - Check response headers for Access-Control headers

4. **Find large responses:**
   - Sort by size (visual inspection)
   - Inspect response bodies

### Capturing Multiple Sessions

1. Start recording
2. Complete first OAuth flow
3. Don't stop recording
4. Complete second OAuth flow
5. Stop recording
6. Export HAR (contains both sessions)

### Reviewing Captured Data Before Export

1. Stop recording
2. Open browser console: `Ctrl+Shift+J` (Windows) or `Cmd+Option+J` (Mac)
3. The extension logs captured requests to the console
4. Review before exporting

### Filtering Large HAR Files

If you captured a lot of traffic and want to filter it:
1. Export the full HAR file
2. Open it in Chrome DevTools (Network → Import HAR)
3. Use DevTools filters to find specific requests
4. Right-click → "Copy all as HAR" to get filtered version

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the CUSTOMER_GUIDE.md for step-by-step instructions
- Contact your support team

## Version History

### v1.0.0 (Current)
- Initial release
- Automatic background capture
- Simple toolbar interface
- Complete HAR export
- No DevTools required

## License

This extension is provided for debugging and support purposes.

---

**Made with ❤️ to make OAuth debugging simple**
