# Session Search & Detail View Guide

## Overview

The Session Replay tool now includes powerful search and detailed inspection capabilities for all sessions and tokens extracted from HAR files.

## 🔍 Search Functionality

### Search Box Location

Located at the top of the "Detected Sessions & Tokens" section in the left sidebar.

### What You Can Search

The search filters across multiple fields:

**Session/Token Data:**
- Token type (Bearer, API Key, Cookie, etc.)
- Token value
- Source (where it was found)
- Header name (Authorization, X-API-Key, etc.)
- Metadata (scope, expiration, etc.)

**Original Request Data:**
- URL (full URL including query parameters)
- HTTP method (GET, POST, PUT, etc.)
- Query parameter names and values
- Request header names and values
- Request body content

### How to Search

1. Type in the search box
2. Results filter in real-time
3. Clear button (×) appears when typing
4. Click × or clear text to reset

### Search Examples

**Find all Bearer tokens:**
```
bearer
```

**Find requests to a specific domain:**
```
api.example.com
```

**Find sessions with specific scope:**
```
read:users
```

**Find requests with query parameter:**
```
api_key=
```

**Find OAuth tokens:**
```
oauth
```

**Find expired sessions:**
```
expires
```

### Search Results Display

When filtering:
- Shows count: "Showing X of Y sessions"
- Displays only matching sessions
- "No sessions match" if no results
- All original sessions still available (not deleted)

## 👁️ Detailed View

### Accessing Detail View

Click on any session card to see full details in the right panel.

### What's Shown

**Session Summary:**
- Token type
- Full token value (not truncated)
- Header name (if applicable)

**📋 Request Details:**
- HTTP Method
- Full URL
- HTTP Version

**🔍 Query Parameters:**
- All query string parameters
- Parameter name → Parameter value
- Count shown in header

**📨 Request Headers:**
- All request headers
- Auth headers highlighted in yellow
- Includes: Authorization, Cookie, tokens, etc.

**🍪 Request Cookies:**
- All cookies sent with request
- Cookie name → Cookie value
- Count shown in header

**📦 Request Body:**
- Full request body (if present)
- Automatically formatted as JSON
- Syntax highlighting for readability

**📬 Response Details:**
- HTTP status code and text
- HTTP version
- Redirect URL (if applicable)

**📨 Response Headers:**
- All response headers
- Header name → Header value

**🍪 Response Cookies:**
- All cookies set by response
- Cookie name → Cookie value

**📦 Response Body:**
- Response content (if present)
- Automatically formatted as JSON
- Truncated if >10,000 characters
- Shows truncation notice

### Highlighted Information

**Auth Headers** are highlighted in yellow:
- Authorization
- Cookie
- X-Auth-Token
- Any header with "auth" or "token" in name

This makes it easy to spot authentication-related headers.

## 📊 Use Cases

### Use Case 1: Find Specific Token Type

**Goal:** Find all API keys in the HAR file

**Steps:**
1. Type "api key" in search box
2. View filtered results
3. Click on any result to see full details
4. See where API key was used
5. View request/response for that API call

### Use Case 2: Debug Failed Request

**Goal:** Find why a specific request failed

**Steps:**
1. Search for the URL or endpoint
2. Click on the session
3. View full request details:
   - Check all query parameters
   - Check all headers
   - Check request body
4. View response details:
   - Check status code
   - Check response headers
   - Read error message in response body

### Use Case 3: Find OAuth Scope Issues

**Goal:** Check what scopes a token has

**Steps:**
1. Search "scope"
2. Find OAuth tokens
3. Click to view details
4. See scope in metadata
5. Check if token has required permissions

### Use Case 4: Cookie Analysis

**Goal:** See all cookies for a domain

**Steps:**
1. Search for domain name
2. Click on sessions to that domain
3. View "Request Cookies" section
4. View "Response Cookies" section
5. See all cookie names and values

### Use Case 5: Parameter Inspection

**Goal:** Check what parameters were sent

**Steps:**
1. Search for endpoint
2. Click on session
3. View "Query Parameters" section
4. See all URL parameters
5. View "Request Body" for POST data

## 🎯 Tips & Tricks

### Tip 1: Use Partial Matches

Search is case-insensitive and matches anywhere in text:
- "auth" finds "Authorization", "OAuth", "auth_token"
- "user" finds "username", "user_id", "/api/users"

### Tip 2: Search by Method

Find all POST requests:
```
post
```

Find all GET requests:
```
get
```

### Tip 3: Search by Status

Find failed requests:
```
400
404
500
```

Find successful requests:
```
200
```

### Tip 4: Copy from Detail View

You can select and copy:
- Full URLs
- Token values
- Header values
- Request/response bodies

### Tip 5: Quick Clear

Click the × button to quickly clear search and see all sessions again.

## 📱 Workflow Integration

### Workflow 1: Customer Issue Reproduction

1. **Customer reports:** "I got an error on the checkout page"
2. **Load HAR:** Customer sends HAR file
3. **Search:** Type "checkout" or "error"
4. **View Details:** Click on failed request
5. **Analyze:** 
   - Check request parameters
   - Check auth headers
   - Read error response
6. **Reproduce:** Use session replay with found token

### Workflow 2: API Debugging

1. **Issue:** API call not working
2. **Search:** Type API endpoint name
3. **View Details:** See exact request sent
4. **Compare:** Check parameters vs. documentation
5. **Test:** Copy token, test in session replay
6. **Fix:** Identify missing or incorrect parameters

### Workflow 3: Security Audit

1. **Goal:** Check all auth methods used
2. **Search:** "auth"
3. **Review:** Click through each session
4. **Document:**
   - What auth headers used
   - Token formats
   - Cookie names
   - API keys
5. **Report:** Findings from detail views

## 🔧 Technical Details

### Search Performance

- Real-time filtering (no delay)
- Searches through all session data
- Searches through HAR entry data
- Efficient for large HAR files
- No backend calls needed

### Data Shown

**Always Shown:**
- Session type and value
- Request method and URL

**Shown if Available:**
- Query parameters
- Request headers and cookies
- Request body
- Response status
- Response headers and cookies
- Response body

**Special Handling:**
- JSON automatically formatted
- Large bodies truncated at 10KB
- Auth headers highlighted
- Counts shown for arrays

### Limitations

**Response Body:**
- Only shown if <50KB (to prevent browser slowdown)
- Truncated at 10KB for display
- Full body still available in original HAR

**Search:**
- Matches anywhere in text (not regex)
- Case-insensitive only
- No advanced operators

## 📋 Quick Reference

| Feature | Action | Result |
|---------|--------|--------|
| Search | Type in search box | Filter sessions |
| Clear | Click × | Reset to all sessions |
| View Details | Click session card | Show full request/response |
| Copy Data | Select text | Copy from detail view |
| Find Auth | Search "auth" | Find all auth-related |
| Find Errors | Search "400" | Find failed requests |
| Find Domain | Search domain | Find all requests to domain |

## 🎉 Benefits

✅ **Faster Debugging:** Find issues quickly with search
✅ **Complete Context:** See all request/response details
✅ **Better Understanding:** See exactly what was sent/received
✅ **Easy Copying:** Copy values directly from detail view
✅ **Visual Highlighting:** Auth headers stand out
✅ **Comprehensive:** All HAR data accessible

The search and detail view features make Session Replay a complete diagnostic tool for analyzing user sessions and debugging API issues!
