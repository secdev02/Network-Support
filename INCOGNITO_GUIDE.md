# Incognito Session Feature - Complete Guide

## What is it?

The Incognito Session feature allows you to **browse as a user** by importing their cookies from a HAR file into a safe, isolated incognito browser window. This lets you see exactly what they see, reproduce their issues, and debug their specific session state.

## Why use it?

**Traditional debugging:**
- Customer: "I can't access my profile"
- Support: "What error do you see?"
- Customer: "It just doesn't work"
- Support: "Can you send a screenshot?"
- ❌ **Result**: Hours of back-and-forth, still not clear what's wrong

**With Incognito Session:**
- Customer sends HAR file
- Support loads HAR, clicks "Launch Incognito"
- Support is now logged in AS the customer
- Support navigates to profile → sees exact error
- ✅ **Result**: Issue diagnosed in 30 seconds

## How it works

### Step-by-step

1. **Get HAR file from customer**
   - They use the extension to capture their session
   - Export HAR file
   - Send to you securely

2. **Load HAR in Session Replay**
   - Open extension → Click "Session Replay"
   - Click "Load HAR File"
   - Select customer's HAR file

3. **Review cookies**
   - Click "View Cookies to Import"
   - See all cookies that will be set
   - Verify domains and cookie count

4. **Launch incognito session**
   - Click "🕵️ Launch Incognito with Cookies"
   - Confirm the security prompt
   - Incognito window opens

5. **Browse as the user**
   - You're now logged in as them
   - Navigate to the application
   - Reproduce their issue
   - See their permissions, data, UI

6. **Close when done**
   - Close incognito window
   - All cookies are removed
   - No trace left

### What gets imported

**All session cookies:**
- Authentication cookies (session_id, auth_token, etc.)
- Preference cookies (language, theme, etc.)
- Tracking cookies (analytics, etc.)
- Custom application cookies

**Cookie attributes preserved:**
- Domain and path
- Secure flag (HTTPS only)
- HttpOnly flag (not accessible to JavaScript)
- SameSite policy (Strict, Lax, None)
- Expiration date (if set)

**What determines the start URL:**
- Extension finds the most common domain in cookies
- Uses HTTPS if any cookies have Secure flag
- Opens: https://most-common-domain.com

## Use cases

### 1. Reproduce visual/UI issues

**Scenario:** Customer reports "Dashboard shows wrong data"

**Without incognito session:**
- Ask for screenshots
- Ask for browser version, screen size
- Try to guess what "wrong data" means
- Can't reproduce because you don't have their permissions

**With incognito session:**
- Launch as user
- Navigate to dashboard
- See exact data they see
- Realize they have different role permissions
- Issue identified immediately

### 2. Debug permission problems

**Scenario:** Customer says "I can't see the Admin panel"

**Process:**
- Launch incognito session
- Try to access Admin panel
- See actual error: "403 Forbidden - Requires Admin role"
- Check their user object in console
- See they have "User" role, not "Admin"
- Confirm with customer they should be Admin
- Issue: role assignment problem, not UI bug

### 3. Test multi-step workflows

**Scenario:** "Shopping cart empties when I go to checkout"

**Process:**
- Launch incognito session
- Add items to cart (see their exact cart state)
- Navigate to checkout
- Cart empties
- Check Network tab - see session cookie being dropped
- Check console - see CORS error
- Issue identified: CORS misconfiguration on checkout domain

### 4. Diagnose "it works for me" issues

**Scenario:** You can't reproduce the bug they report

**Problem:**
- Works fine with your test account
- Works fine with admin account
- Customer insists it's broken

**Solution:**
- Launch incognito session with their cookies
- Browse with their exact session
- See the issue (only happens with their specific account)
- Discover: their account has legacy flag that causes bug

### 5. Verify fixes in production

**Scenario:** Deployed a fix, need to verify it works for affected users

**Process:**
- Get HAR from user who reported the issue
- Launch incognito session
- Verify fix works with their session
- Confirm permissions, data, and workflow all work
- Close with confidence

## Technical details

### Security & Isolation

**Incognito mode provides:**
- ✅ Separate cookie store (no mixing with your cookies)
- ✅ Separate cache (no cached data interference)
- ✅ Separate local storage (no localStorage conflicts)
- ✅ No history saved
- ✅ No form data saved
- ✅ Easy cleanup (close window = all gone)

**The extension:**
- Only sets cookies for the domains in the HAR
- Does not modify your regular browsing session
- Does not persist cookies after window closes
- Does not send cookies anywhere

### Cookie import process

**For each cookie in HAR:**
1. Extract: name, value, domain, path, flags
2. Determine URL: `protocol://domain/path`
3. Call Chrome API: `chrome.cookies.set()`
4. Chrome validates and sets cookie
5. Cookie available in incognito session

**Validation:**
- Chrome enforces Secure flag (HTTPS only)
- Chrome enforces SameSite policy
- Chrome respects domain/path restrictions
- Invalid cookies are rejected (logged to console)

### Multi-domain support

**If HAR contains cookies for multiple domains:**
- Example: `app.example.com`, `api.example.com`, `cdn.example.com`
- Extension sets ALL cookies for ALL domains
- Start URL is the domain with most cookies
- You can navigate to any domain and cookies will work

**Example:**
```
HAR contains:
- 5 cookies for app.example.com
- 2 cookies for api.example.com
- 1 cookie for cdn.example.com

Extension will:
- Set all 8 cookies
- Open https://app.example.com (most cookies)
- API calls to api.example.com will include those cookies
- CDN requests will include cdn cookie
```

## Best practices

### Before launching

✅ **DO:**
- Verify you have authorization to access this user's session
- Check you're in a test/staging environment if available
- Review cookies to understand what's being set
- Read security warnings carefully

❌ **DON'T:**
- Use production user sessions without authorization
- Launch sessions from untrusted HAR files
- Share screenshots that include user's personal data
- Leave incognito window open unattended

### During session

✅ **DO:**
- Take notes on what you observe
- Screenshot errors (redact personal data)
- Check console for errors
- Test the specific reported issue
- Document your findings

❌ **DON'T:**
- Modify user data (unless authorized)
- Perform actions that send emails/notifications
- Access unrelated parts of the application
- Share session data publicly
- Delete or modify user's content

### After session

✅ **DO:**
- Close incognito window immediately
- Document your findings
- Clear findings with customer if needed
- Delete HAR file securely after use

❌ **DON'T:**
- Leave window open
- Save cookies elsewhere
- Reuse session for different testing
- Keep HAR file unnecessarily

## Troubleshooting

### "No cookies found in HAR file"

**Cause:** HAR file doesn't contain cookie information

**Solution:**
- Make sure customer captured traffic while logged in
- Some sites use localStorage instead of cookies (won't work)
- Check HAR file has `cookies` arrays in requests/responses

### "Failed to launch incognito session"

**Cause:** Extension doesn't have incognito permission

**Solution:**
1. Go to `chrome://extensions/`
2. Find "Network Support Extension"
3. Click "Details"
4. Enable "Allow in Incognito"

### "Cookies imported but not logged in"

**Causes:**
1. Cookies expired
2. IP address restriction
3. Additional security checks (device fingerprint, etc.)
4. Session invalidated on server

**Solutions:**
- Get fresh HAR file from customer
- Check if site requires specific IP range
- Some sites can't be replayed (intentional security)

### "Some cookies failed to import"

**Cause:** Cookie validation failed

**Check console for:**
- Domain mismatches
- Secure flag violations (HTTP vs HTTPS)
- SameSite policy conflicts

**Usually not critical:**
- Analytics cookies often fail (not needed for functionality)
- Cross-domain tracking cookies may fail (expected)
- Focus on authentication cookies

## Security warnings

### ⚠️ Critical warnings

**YOU ARE THE USER**
- Every action you take is as them
- Emails sent will be from them
- Data modified will be under their account
- Audit logs will show their user ID

**CREDENTIALS ARE LIVE**
- Cookies are real, active sessions
- Tokens may not be expired
- Can access real user data
- Can perform real actions

**HANDLE HAR FILES SECURELY**
- Treat like passwords
- Use encrypted channels to share
- Delete after use
- Don't commit to Git
- Don't email unencrypted

### 🔒 Safe practices

**When to use:**
- Authorized customer support
- Debugging in test environments
- With explicit user permission
- When you need to see exact user experience

**When NOT to use:**
- Without authorization
- In production without approval
- With HAR files from unknown sources
- To access unrelated user accounts
- For unauthorized testing

## Example workflow

### Complete real-world example

**Ticket:** "Can't upload files to project, gets error"

1. **Request HAR:**
   - "Please capture HAR while trying to upload"
   - Customer sends `customer-upload-issue.har`

2. **Load & review:**
   - Open Session Replay
   - Load HAR file
   - Click "View Cookies to Import"
   - See: 15 cookies for `app.example.com`

3. **Launch session:**
   - Click "Launch Incognito"
   - Confirm prompt
   - Window opens to https://app.example.com

4. **Reproduce issue:**
   - Navigate to Projects → Customer's project
   - Click "Upload File"
   - Select test file
   - Click Upload
   - **See error:** "403 Forbidden - Insufficient permissions"

5. **Investigate:**
   - Check Network tab: `/api/files/upload` returns 403
   - Check Console: "User does not have upload permission"
   - Check user profile: Role = "Viewer"
   - **Root cause:** User has wrong role

6. **Verify:**
   - Check customer's account in admin panel
   - Confirm they should be "Editor" role
   - Issue: role assignment bug, not upload bug

7. **Cleanup:**
   - Close incognito window
   - Delete HAR file
   - Document findings in ticket

8. **Resolution:**
   - Update user to "Editor" role
   - Verify they can now upload
   - Issue resolved

**Time saved:** What would have taken hours of back-and-forth took 5 minutes.

## FAQ

**Q: Is this safe?**
A: Yes, when used properly. Incognito mode isolates the session from your normal browsing. Always get authorization first.

**Q: Can I modify user data?**
A: Technically yes, but you shouldn't without authorization. You're acting as the user.

**Q: Will this work with SSO/SAML?**
A: Usually yes, if the session cookies are captured. May not work if token refresh is required.

**Q: Can I use this with mobile app HAR files?**
A: Yes, if the mobile app uses web views with cookies.

**Q: What if cookies are encrypted?**
A: Cookies are just strings to the browser. Encryption happens at application level.

**Q: How long do cookies last?**
A: Until they expire (check expiration in HAR) or you close the window.

**Q: Can I export cookies from incognito session?**
A: No need - they're already in the HAR file. Don't export separately.

**Q: Does this work with localStorage/sessionStorage?**
A: No, only HTTP cookies. LocalStorage isn't in HAR files.

## Summary

The Incognito Session feature is a powerful diagnostic tool that lets you:

✅ See exactly what users see
✅ Reproduce issues in their session
✅ Debug permission problems
✅ Test multi-step workflows
✅ Verify fixes with real user sessions

**Use responsibly:**
- Get authorization
- Handle HAR files securely
- Only in approved environments
- Document your findings
- Clean up after use

**Result:**
Faster debugging, better customer support, issues resolved in minutes instead of hours.
