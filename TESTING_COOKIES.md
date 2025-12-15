# Cookie Import Testing Guide

## Quick Test Workflow

### 1. Test with Sample File

1. Open Session Replay tool
2. Click "Import Cookies JSON"
3. Select `test-cookies.json`
4. You should see: "✅ Cookies Imported - Loaded: 3 cookie(s)"
5. Click "View Cookies" to verify they're loaded
6. **Choose window mode:**
   - Keep "Launch in Incognito/Private Mode" checked (recommended)
   - OR uncheck to use regular window (will affect your main browser)
7. Click "Launch Session with Cookies"
8. Open browser console (F12) to see debug logs

### 2. Test with Real HAR File

1. Load a HAR file that contains cookies
2. Click "View Cookies" to see extracted cookies
3. **Select cookies:**
   - Click domain checkbox to select all cookies for that domain
   - Click individual checkboxes for fine control
   - Use "Select All" / "Deselect All" for bulk actions
4. Click "Export ▼" to see export options:
   - "Export as JSON (Our Format)" - Our metadata-rich format
   - "Export for Cookie-Editor" - Compatible with Cookie-Editor extension
5. Export in both formats to test
6. Reimport each format to verify round-trip works
7. Launch session with selected cookies

### 3. Test Cookie-Editor & EditThisCookie Compatibility

1. Import `test-cookies-cookie-editor.json`
2. Should see: "Format detected: Cookie-Editor"
3. All 3 cookies loaded and selected
4. Import `test-cookies-editthiscookie.json`
5. Should see: "Format detected: EditThisCookie"
6. All 3 cookies loaded and selected
7. Select some cookies, export in each format
8. Reimport each export
9. Verify all cookies preserved correctly
10. Test in actual Cookie-Editor/EditThisCookie extensions (optional)

### 4. Debug Cookie Import Issues

**Check the console logs:**

```
=== Cookie Import Debug ===
Total cookies to import: 3
Incognito store ID: 1

Setting cookie: session_id for domain: example.com
Cookie details: {url: "https://example.com/", name: "session_id", ...}
✓ Cookie set successfully: session_id

Setting cookie: auth_token for domain: .example.com
Cookie details: {url: "https://example.com/", name: "auth_token", ...}
✓ Cookie set successfully: auth_token

=== Cookie Import Complete ===
Success: 3 Failed: 0

=== Verifying Cookies ===
✓ Verified cookie: session_id
✓ Verified cookie: auth_token
Verified: 3 / 3 cookies
```

**If cookies fail:**

Look for error messages like:
- "Cookie set returned null" - Cookie was rejected by Chrome
- "Skipping expired cookie" - Cookie expiration date has passed
- Specific Chrome error messages about domain/secure mismatches

### 4. Window Mode Selection

**Incognito/Private Mode (Default - Recommended):**
- ✅ Isolated from your normal browsing
- ✅ Clean slate, no existing cookies
- ✅ Easy cleanup (close window)
- ✅ Safe for testing production cookies
- ✅ No impact on your regular sessions
- ❌ Requires "Allow in Incognito" permission

**Regular Mode:**
- ✅ Works without incognito permission
- ✅ Useful for testing in specific browser profiles
- ❌ Cookies persist in your main browser
- ❌ Can interfere with your regular browsing
- ❌ Harder to clean up
- ⚠️ Only use in isolated test browsers

**When to use each:**
- Incognito: Almost always - safest option
- Regular: Only when testing specific browser profiles or when incognito isn't available

### 5. Common Issues & Solutions

**Issue: All cookies fail to import**
- Check: Is "Allow in Incognito" enabled for the extension? (if using incognito mode)
- Fix: chrome://extensions/ → Extension Details → Enable "Allow in Incognito"

**Issue: Secure cookies fail on HTTP domains**
- Check: Cookie has `secure: true` but domain is HTTP
- Fix: Cookies with secure flag require HTTPS domains

**Issue: Domain mismatch errors**
- Check: Cookie domain format (with/without leading dot)
- Fix: Leading dot (`.example.com`) = domain cookie, no dot (`example.com`) = host-only

**Issue: Cookies set but not visible in incognito window**
- Check: Verify count shows cookies were verified
- Check: Open DevTools in incognito window → Application → Cookies
- Check: Navigate to the actual domain (cookies only visible on their domain)

**Issue: SameSite errors**
- Check: Cookie sameSite value
- Fix: Valid values are: 'strict', 'lax', 'no_restriction' (not 'none')

### 6. Manual Cookie Verification

After launching incognito session:

1. In the incognito window, press F12
2. Go to Application tab → Cookies
3. Select the domain (e.g., https://example.com)
4. Verify cookies are present
5. Check Name, Value, Domain, Path, Secure, HttpOnly, SameSite

### 7. Cookie Structure Reference

**Our Format:**

```json
{
  "version": "1.0",
  "exported": "2025-12-13T18:30:00.000Z",
  "totalCookies": 3,
  "totalAvailable": 5,
  "cookies": [
    {
      "name": "cookie_name",
      "value": "cookie_value",
      "domain": "example.com",
      "path": "/",
      "secure": true,
      "httpOnly": false,
      "sameSite": "lax",
      "url": "https://example.com/",
      "expirationDate": 1735689600
    }
  ]
}
```

**Cookie-Editor Format (Compatible):**

```json
[
  {
    "domain": ".example.com",
    "expirationDate": 1735689600,
    "hostOnly": false,
    "httpOnly": true,
    "name": "session_id",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "abc123"
  }
]
```

**EditThisCookie Format (Compatible):**

```json
[
  {
    "domain": ".example.com",
    "expirationDate": 1735689600,
    "hostOnly": false,
    "httpOnly": true,
    "name": "session_id",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "abc123",
    "id": 1
  }
]
```

**Format Detection:**
- Array with `sameSite: "unspecified"` or `id` field = EditThisCookie (automatic)
- Array without those = Cookie-Editor format (automatic)
- Object with "cookies" = Our format (automatic)
- All three formats fully supported for import/export

**Correct JSON format (Our Format):**

```json
{
  "name": "cookie_name",
  "value": "cookie_value",
  "domain": "example.com",
  "path": "/",
  "secure": true,
  "httpOnly": false,
  "sameSite": "lax",
  "url": "https://example.com/",
  "expirationDate": 1735689600
}
```

**Required fields:**
- `name` - Cookie name
- `value` - Cookie value
- `domain` - Domain (with or without leading dot)
- `url` - Must match domain and secure flag

**Optional fields:**
- `path` - Default: "/"
- `secure` - Default: false
- `httpOnly` - Default: false
- `sameSite` - Default: "no_restriction"
- `expirationDate` - Unix timestamp (seconds), omit for session cookie

**Domain format rules:**
- `.example.com` - Domain cookie (works on all subdomains)
- `example.com` - Host-only cookie (only on exact domain)
- `www.example.com` - Host-only for www subdomain

### 8. Expected Console Output

**Successful import:**
```
=== Cookie Import Debug ===
Window mode: incognito
Total cookies to import: 15
Incognito store ID: 1
Setting cookie: session_id for domain: app.example.com
✓ Cookie set successfully: session_id
[... repeated for each cookie ...]
=== Cookie Import Complete ===
Success: 15 Failed: 0
=== Verifying Cookies ===
✓ Verified cookie: session_id [details]
[... repeated for each cookie ...]
Verified: 15 / 15 cookies
```

**Partial failure:**
```
=== Cookie Import Complete ===
Success: 12 Failed: 3
Errors: [
  {cookie: "old_session", domain: "example.com", error: "expired"},
  {cookie: "ssl_only", domain: "example.com", error: "secure cookie on http"},
  {cookie: "bad_format", domain: "invalid", error: "invalid domain"}
]
```

### 9. Testing Checklist

- [ ] Import test-cookies.json successfully (our format)
- [ ] Import test-cookies-cookie-editor.json successfully (Cookie-Editor format)
- [ ] Import test-cookies-editthiscookie.json successfully (EditThisCookie format)
- [ ] View cookies shows correct count and details
- [ ] Select individual cookies works
- [ ] Select domain (all cookies in domain) works
- [ ] Select All button selects everything
- [ ] Deselect All button deselects everything
- [ ] Export as JSON (Our Format) creates valid JSON
- [ ] Export for Cookie-Editor creates valid array format
- [ ] Export for EditThisCookie creates valid array format with id field
- [ ] Reimport exported cookies works (all three formats)
- [ ] Format auto-detection works correctly
- [ ] Checkbox toggles between Incognito/Regular
- [ ] Warning appears when regular mode selected
- [ ] Launch session opens window (incognito mode)
- [ ] Launch session opens window (regular mode)
- [ ] Only selected cookies are imported (not all)
- [ ] Console shows all selected cookies set successfully
- [ ] Console shows all selected cookies verified
- [ ] DevTools in window shows cookies present
- [ ] Navigate to domain shows cookies sent in requests
- [ ] Cookie-Editor exported file works in Cookie-Editor extension (optional)
- [ ] EditThisCookie exported file works in EditThisCookie extension (optional)

### 10. Troubleshooting Commands

**Check incognito store:**
```javascript
// In extension console
chrome.cookies.getAllCookieStores().then(stores => console.log(stores));
```

**List all cookies in incognito:**
```javascript
// After creating incognito window with tab ID
chrome.cookies.getAll({storeId: 'incognito_store_id'}).then(cookies => console.log(cookies));
```

**Check specific cookie:**
```javascript
chrome.cookies.get({
  url: 'https://example.com/',
  name: 'session_id',
  storeId: 'incognito_store_id'
}).then(cookie => console.log(cookie));
```

### 11. Success Criteria

Cookie import is working correctly when:

1. ✅ Import shows: "Loaded: N cookie(s)"
2. ✅ View shows all cookies with correct domains
3. ✅ Console shows: "Success: N Failed: 0"
4. ✅ Console shows: "Verified: N / N cookies"
5. ✅ DevTools shows cookies in Application tab
6. ✅ Network tab shows cookies sent with requests
7. ✅ Application behavior matches logged-in state

If ANY of these fail, check the console logs for specific error messages.
