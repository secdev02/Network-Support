# Cookie-Editor Integration Guide

## Overview

The Session Replay tool is fully compatible with the popular **Cookie-Editor** browser extension. You can:
- Export cookies in Cookie-Editor format
- Import cookies from Cookie-Editor
- Use both tools together seamlessly

## What is Cookie-Editor?

Cookie-Editor is a popular browser extension that lets you view, edit, add, delete, search, protect and block cookies. It's available for Chrome, Firefox, and Edge.

🔗 https://cookie-editor.com/

## Why This Integration Matters

**Common workflow:**
1. Customer uses Cookie-Editor to export their cookies
2. Customer sends you the JSON file
3. You import into Session Replay
4. You launch session with their cookies
5. You reproduce and debug their issue

**Or reverse:**
1. You capture HAR file with Network Support Extension
2. Export cookies for Cookie-Editor format
3. Share with customer or team
4. They import into Cookie-Editor
5. They can manually set cookies for testing

## Export Formats

### Our Format (Metadata-Rich)

**When to use:**
- Internal team use
- Need export metadata (date, counts)
- Round-trip within Session Replay
- Want version tracking

**Structure:**
```json
{
  "version": "1.0",
  "exported": "2025-12-13T18:30:00.000Z",
  "totalCookies": 5,
  "totalAvailable": 10,
  "cookies": [...]
}
```

**Contains:**
- Version number for compatibility
- Export timestamp
- Total cookies exported
- Total cookies available (for context)
- Cookie array

### Cookie-Editor Format (Standard)

**When to use:**
- Sharing with customers
- Import into Cookie-Editor extension
- Cross-tool compatibility
- Standard cookie interchange

**Structure:**
```json
[
  {
    "domain": ".example.com",
    "expirationDate": 1735689600,
    "hostOnly": false,
    "httpOnly": true,
    "name": "session_id",
    "path": "/",
    "sameSite": "lax",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "abc123"
  }
]
```

**Contains:**
- Direct array of cookies
- Standard cookie fields
- Cookie-Editor specific fields (hostOnly, session, storeId)

## How to Export

### From Session Replay

1. Load HAR file or import cookies
2. Select which cookies to export (see selection guide)
3. Click "Export ▼" dropdown
4. Choose format:
   - **"Export as JSON (Our Format)"** → metadata-rich format
   - **"Export for Cookie-Editor"** → Cookie-Editor compatible

### From Cookie-Editor Extension

1. Open Cookie-Editor in your browser
2. Click "Export" button
3. Choose "Export as JSON"
4. Save file
5. Import into Session Replay

## How to Import

### Into Session Replay

**The tool auto-detects the format!**

1. Click "Import Cookies JSON"
2. Select file (either format)
3. Tool detects:
   - Array → Cookie-Editor format
   - Object with "cookies" → Our format
4. Shows: "Format detected: Cookie-Editor" or "Format detected: Our Format"
5. All cookies loaded and selected by default

### Into Cookie-Editor Extension

1. Open Cookie-Editor in your browser
2. Click "Import" button
3. Paste JSON or select file
4. Choose "Import as JSON"
5. Cookies appear in extension

**Note:** Only works with Cookie-Editor format exports

## Field Mapping

### Our Format → Cookie-Editor Format

| Our Field | Cookie-Editor Field | Notes |
|-----------|---------------------|-------|
| name | name | Direct |
| value | value | Direct |
| domain | domain | Direct |
| path | path | Default "/" |
| secure | secure | Default false |
| httpOnly | httpOnly | Default false |
| sameSite | sameSite | Converted |
| expirationDate | expirationDate | Unix timestamp |
| - | hostOnly | Calculated from domain |
| - | session | Calculated from expiration |
| - | storeId | Default "0" |

### Cookie-Editor Format → Our Format

| Cookie-Editor Field | Our Field | Notes |
|---------------------|-----------|-------|
| name | name | Direct |
| value | value | Direct |
| domain | domain | Direct |
| path | path | Direct |
| secure | secure | Direct |
| httpOnly | httpOnly | Direct |
| sameSite | sameSite | Direct |
| expirationDate | expirationDate | If present |
| hostOnly | - | Preserved in domain format |
| session | - | Determines if expirationDate set |
| storeId | - | Not used in our tool |

## Workflows

### Workflow 1: Customer Debug Session

**Customer side:**
1. Customer installs Cookie-Editor extension
2. Navigates to the problem page while logged in
3. Opens Cookie-Editor
4. Clicks "Export" → "Export as JSON"
5. Sends JSON file to support

**Support side:**
1. Opens Session Replay
2. Clicks "Import Cookies JSON"
3. Selects customer's file
4. Reviews cookies, selects relevant ones
5. Launches incognito session
6. Reproduces issue in customer's session

### Workflow 2: Share Cookies with Team

**Your side:**
1. Capture HAR file with Network Support Extension
2. Open Session Replay, load HAR
3. Select authentication cookies only (deselect tracking)
4. Export as Cookie-Editor format
5. Share JSON file with team

**Team side:**
1. Import into Cookie-Editor extension
2. Cookies applied to browser
3. Navigate to application (already logged in)
4. Test features with shared session

### Workflow 3: Round-Trip Testing

**Test format compatibility:**
1. Load HAR file
2. Export as Cookie-Editor format
3. Reimport that file
4. Verify all cookies preserved
5. Export as Our format
6. Reimport that file
7. Verify metadata preserved

## Selection Before Export

**Important:** Cookie selection applies to export!

**To export specific domains:**
1. Deselect All
2. Check only desired domain(s)
3. Export → Only selected cookies exported

**To export only auth cookies:**
1. Deselect All
2. Manually check: session_id, auth_token, access_token
3. Export → Only auth cookies exported

**This works for both formats!**

## Field Notes

### sameSite Values

Both formats use same values:
- `"no_restriction"` - No restriction (works cross-site)
- `"lax"` - Lax (sent with top-level navigation)
- `"strict"` - Strict (same-site only)

Note: Cookie-Editor may show "none" but we convert to "no_restriction"

### Domain Format

**Domain cookie (works on all subdomains):**
- `".example.com"` - Leading dot
- `hostOnly: false`

**Host-only cookie (exact domain only):**
- `"www.example.com"` - No leading dot
- `hostOnly: true`

Our tool preserves domain format exactly as exported.

### Session Cookies

**Session cookie (expires when browser closes):**
- `session: true`
- No `expirationDate` field

**Persistent cookie:**
- `session: false`
- `expirationDate: 1735689600` (Unix timestamp in seconds)

### storeId

- Cookie-Editor uses storeId to track cookie containers
- Default is `"0"` for normal browsing
- `"1"`, `"2"`, etc. for containers/profiles
- Our tool doesn't use storeId internally but preserves it

## Testing

### Test Files Provided

**test-cookies.json** - Our format
- Contains metadata
- 3 test cookies
- For internal testing

**test-cookies-cookie-editor.json** - Cookie-Editor format
- Direct array
- 3 test cookies
- For compatibility testing

### Test Both Formats

1. Import test-cookies.json
   - Should detect "Our Format"
   - Load 3 cookies
2. Import test-cookies-cookie-editor.json
   - Should detect "Cookie-Editor"
   - Load 3 cookies
3. Export each in opposite format
4. Reimport to verify conversion

## Common Issues

### Issue: Cookie-Editor won't import file

**Cause:** Exported in our format, not Cookie-Editor format

**Solution:**
1. Re-export using "Export for Cookie-Editor"
2. Verify file is array `[...]` not object `{...}`
3. Try importing into Cookie-Editor again

### Issue: Cookies missing after import

**Cause:** Selection was active, only selected cookies exported

**Solution:**
1. Check export message: "Cookies exported: N (selected)"
2. Before exporting, click "Select All" to export everything
3. Re-export with all cookies selected

### Issue: Domain cookies not working

**Cause:** Domain format not preserved

**Solution:**
1. Check domain has leading dot: `.example.com`
2. Verify `hostOnly: false` in Cookie-Editor format
3. Our tool preserves exact domain format from import

### Issue: Cookies expire immediately

**Cause:** Session cookies or very short expiration

**Solution:**
1. Check if `session: true` (expires on browser close)
2. Check `expirationDate` timestamp is in future
3. Unix timestamp is in seconds, not milliseconds

## Best Practices

### For Sharing

1. ✅ Export as Cookie-Editor format for maximum compatibility
2. ✅ Select only necessary cookies (deselect tracking/analytics)
3. ✅ Include domain context in filename: `cookies-app.example.com.json`
4. ✅ Share via secure channel only
5. ✅ Delete file after recipient confirms receipt

### For Internal Use

1. ✅ Export in our format to preserve metadata
2. ✅ Include timestamp helps track which capture
3. ✅ Export full set (Select All) for complete context
4. ✅ Can reimport and re-select subset later

### For Customers

1. ✅ Ask them to use Cookie-Editor extension
2. ✅ Provide clear export instructions
3. ✅ Accept files in either format (we auto-detect)
4. ✅ Verify cookie count after import
5. ✅ Test with selection to only use relevant cookies

## Security Notes

⚠️ **Cookie files contain active session credentials!**

- Treat like passwords
- Use encrypted channels (email with encryption, secure file share)
- Delete after import/use
- Don't commit to Git
- Warn customers about sensitivity
- Set expiration reminders

## Cookie-Editor Extension Links

- **Chrome:** https://chrome.google.com/webstore/detail/cookie-editor/
- **Firefox:** https://addons.mozilla.org/firefox/addon/cookie-editor/
- **Edge:** https://microsoftedge.microsoft.com/addons/detail/cookie-editor/

## Summary

✅ **Fully compatible** with Cookie-Editor extension
✅ **Auto-detection** - no manual format selection needed
✅ **Two export formats** - choose based on use case
✅ **Round-trip tested** - export and reimport preserves everything
✅ **Selection applies** - only selected cookies exported
✅ **Standard compliance** - follows Cookie-Editor JSON schema

This makes Session Replay a powerful complement to Cookie-Editor for debugging user sessions!
