# Cookie Import Testing Guide

## Quick Test Workflow

### 1. Test with Sample File

1. Open Session Replay tool
2. Click "Import Cookies JSON"
3. Select `test-cookies.json`
4. You should see: "✅ Cookies Imported - Loaded: 3 cookie(s)"
5. Click "View Cookies" to verify they're loaded
6. Click "Launch Incognito with Cookies"
7. Open browser console (F12) to see debug logs

### 2. Test with Real HAR File

1. Load a HAR file that contains cookies
2. Click "View Cookies" to see extracted cookies
3. Click "Export Cookies" to save as JSON
4. Review the JSON file structure
5. Reimport the JSON file to verify round-trip works
6. Launch incognito session

### 3. Debug Cookie Import Issues

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

### 4. Common Issues & Solutions

**Issue: All cookies fail to import**
- Check: Is "Allow in Incognito" enabled for the extension?
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

### 5. Manual Cookie Verification

After launching incognito session:

1. In the incognito window, press F12
2. Go to Application tab → Cookies
3. Select the domain (e.g., https://example.com)
4. Verify cookies are present
5. Check Name, Value, Domain, Path, Secure, HttpOnly, SameSite

### 6. Cookie Structure Reference

**Correct JSON format:**

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

### 7. Expected Console Output

**Successful import:**
```
=== Cookie Import Debug ===
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

### 8. Testing Checklist

- [ ] Import test-cookies.json successfully
- [ ] View cookies shows correct count and details
- [ ] Export cookies creates valid JSON
- [ ] Reimport exported cookies works
- [ ] Launch incognito opens window
- [ ] Console shows all cookies set successfully
- [ ] Console shows all cookies verified
- [ ] DevTools in incognito shows cookies present
- [ ] Navigate to domain shows cookies sent in requests

### 9. Troubleshooting Commands

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

### 10. Success Criteria

Cookie import is working correctly when:

1. ✅ Import shows: "Loaded: N cookie(s)"
2. ✅ View shows all cookies with correct domains
3. ✅ Console shows: "Success: N Failed: 0"
4. ✅ Console shows: "Verified: N / N cookies"
5. ✅ DevTools shows cookies in Application tab
6. ✅ Network tab shows cookies sent with requests
7. ✅ Application behavior matches logged-in state

If ANY of these fail, check the console logs for specific error messages.
