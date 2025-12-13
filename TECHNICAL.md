# Comprehensive Data Capture - Technical Details

## Overview

This extension uses Chrome's Debugger Protocol API to capture **ALL** network traffic with complete fidelity. Unlike simple network monitoring, this extension captures:

- Binary request/response bodies
- Compressed content (gzip, deflate, brotli)
- Multipart form data with boundaries
- All HTTP headers from all sources
- Complete cookie information
- WebSocket handshakes
- Failed and canceled requests

## How It Works

### Chrome Debugger Protocol

The extension attaches to a tab using `chrome.debugger.attach()` and enables the Network domain. This gives us access to **all** network events at the browser level, before any processing or filtering.

### Network Events Captured

1. **Network.requestWillBeSent** - Initial request information
2. **Network.requestWillBeSentExtraInfo** - Additional request headers and cookies
3. **Network.responseReceived** - Response headers and metadata
4. **Network.responseReceivedExtraInfo** - Additional response headers and cookies
5. **Network.loadingFinished** - Request completion
6. **Network.loadingFailed** - Failed requests
7. **Network.dataReceived** - Data chunk information
8. **Network.requestServedFromCache** - Cache hits

### Retrieving Complete Data

After a request completes, we use:

- **Network.getResponseBody** - Gets the complete response body
  - Returns base64 for binary content
  - Returns decoded text for text content
  - Works even for compressed responses (Chrome auto-decodes)

- **Network.getRequestPostData** - Gets POST/PUT/PATCH data
  - Returns the actual bytes sent
  - Includes multipart boundaries
  - Works for binary uploads

## Data Types Handled

### 1. Text POST Data

**Form-encoded (application/x-www-form-urlencoded):**
```
username=john&password=secret123
```
- Captured as-is
- Parsed into name/value pairs
- Stored in both `text` and `params` fields

**JSON (application/json):**
```json
{"username": "john", "password": "secret123"}
```
- Captured as-is
- Stored as text
- Can be parsed and formatted in analyzer

### 2. Multipart Form Data

**Example multipart/form-data:**
```
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

<binary PDF data>
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

Important document
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

- **Complete boundary preservation**
- **All headers for each part**
- **Binary file content included**
- Stored exactly as transmitted

### 3. Binary Request Bodies

**Examples:**
- File uploads (images, PDFs, videos)
- Protobuf messages
- MessagePack data
- Raw binary protocols

**Handling:**
- Captured via `Network.getRequestPostData`
- Stored as-is in HAR file
- May be base64 encoded depending on content

### 4. Compressed Responses

**Compression types supported:**
- gzip (Content-Encoding: gzip)
- deflate (Content-Encoding: deflate)
- brotli (Content-Encoding: br)

**Handling:**
- Chrome automatically decompresses via `Network.getResponseBody`
- We capture the **decoded** content
- Original compression is noted in headers
- Size reported is the encoded size (from Content-Length)

### 5. Binary Response Bodies

**Types:**
- Images (PNG, JPEG, GIF, WebP, etc.)
- Documents (PDF, Word, Excel, etc.)
- Media (videos, audio)
- Archives (ZIP, TAR, etc.)
- Executables and libraries

**Handling:**
- Retrieved via `Network.getResponseBody`
- Returned as base64 encoded string
- Marked with `encoding: "base64"` in HAR
- Full binary fidelity maintained

## HAR File Structure

### Request with Binary POST Data

```json
{
  "request": {
    "method": "POST",
    "url": "https://api.example.com/upload",
    "headers": [
      {"name": "Content-Type", "value": "multipart/form-data; boundary=----WebKitFormBoundary"}
    ],
    "postData": {
      "mimeType": "multipart/form-data; boundary=----WebKitFormBoundary",
      "text": "------WebKitFormBoundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"image.png\"\r\nContent-Type: image/png\r\n\r\n<raw binary PNG data>\r\n------WebKitFormBoundary--",
      "params": []
    }
  }
}
```

### Response with Binary Content

```json
{
  "response": {
    "status": 200,
    "headers": [
      {"name": "Content-Type", "value": "image/png"},
      {"name": "Content-Length", "value": "45678"}
    ],
    "content": {
      "size": 45678,
      "mimeType": "image/png",
      "text": "iVBORw0KGgoAAAANSUhEUgAAA...", 
      "encoding": "base64"
    }
  }
}
```

### Response with Compression

```json
{
  "response": {
    "headers": [
      {"name": "Content-Encoding", "value": "gzip"},
      {"name": "Content-Type", "value": "application/json"}
    ],
    "content": {
      "size": 1234,
      "mimeType": "application/json",
      "text": "{\"result\": \"success\", \"data\": [...]}",
      "compression": "gzip"
    }
  }
}
```

## OAuth-Specific Captures

### 1. Authorization Code Flow

**Authorization Request:**
- Query parameters: `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`
- Headers: All headers including custom ones
- Cookies: Session cookies

**Token Exchange:**
- POST body: `grant_type`, `code`, `redirect_uri`, `client_id`, `client_secret`, `code_verifier`
- Headers: `Content-Type`, `Authorization` (if using Basic auth)
- Response: Access token, refresh token, expires_in, etc.

### 2. Implicit Flow

- Fragment parameters captured from redirect
- All token data in URL or response

### 3. Client Credentials

- POST body: `grant_type=client_credentials`, `client_id`, `client_secret`, `scope`
- Authorization header: `Basic base64(client_id:client_secret)`

### 4. Refresh Token

- POST body: `grant_type=refresh_token`, `refresh_token`, `client_id`
- Response: New access token

## Cookie Handling

### Request Cookies

Captured from two sources:
1. **Cookie header** - Parsed into name/value pairs
2. **Network.requestWillBeSentExtraInfo** - Complete cookie objects

**Information captured:**
- Name and value
- Domain and path
- HttpOnly and Secure flags
- SameSite attribute
- Expiration

### Response Cookies

Captured from:
1. **Set-Cookie headers** - Parsed
2. **Network.responseReceivedExtraInfo** - Complete objects

**Blocked cookies also captured:**
- Cookies blocked by browser security
- Reason for blocking (SameSite, Secure, etc.)
- Stored with blocked flag

## Headers

### Request Headers

Merged from:
- **request.headers** from Network.requestWillBeSent
- **headers** from Network.requestWillBeSentExtraInfo

**Common OAuth headers captured:**
- Authorization: Bearer xxx
- Cookie: session_id=xxx
- Content-Type: application/json
- User-Agent, Origin, Referer, etc.

### Response Headers

Merged from:
- **response.headers** from Network.responseReceived  
- **headers** from Network.responseReceivedExtraInfo

**Important headers:**
- Set-Cookie (all cookies)
- Location (for redirects)
- Content-Type
- Content-Encoding
- Access-Control-* (CORS headers)

## Limitations

### What Cannot Be Captured

1. **Encrypted payloads** - We capture the encrypted data, but cannot decrypt
2. **WebSocket message content** - Only handshake is captured
3. **Service Worker requests** - Some may be missed
4. **Browser extension requests** - Not visible to debugger

### Known Issues

1. **Very large files (>100MB)** - May timeout or cause memory issues
2. **Streaming responses** - Captured only when complete
3. **HTTP/2 Server Push** - Not fully supported

## Security Considerations

### What Gets Exposed

HAR files contain **EVERYTHING**:
- Passwords in POST bodies
- OAuth tokens in headers/cookies/bodies
- Session IDs
- API keys
- Personal data
- Internal URLs and endpoints

### Best Practices

1. **Never share HAR files publicly**
2. **Use secure channels only** (encrypted support portals)
3. **Delete HAR files after use**
4. **Review before sharing** if concerned
5. **Sanitize if needed** (remove sensitive entries)

## Performance Impact

### Memory Usage

- Each request: ~5-50 KB (text content)
- Binary responses: Size of actual file
- Typical OAuth flow: 50-200 requests = 1-5 MB

### CPU Impact

- Minimal during capture
- ~100ms per request for processing
- Export: ~1 second per 1000 requests

## Comparison with Chrome DevTools

| Feature | This Extension | Chrome DevTools |
|---------|---------------|-----------------|
| Binary POST data | ✅ Full | ❌ Limited |
| Multipart boundaries | ✅ Preserved | ⚠️ Partial |
| Compressed responses | ✅ Full | ✅ Full |
| Background capture | ✅ Yes | ❌ No |
| All cookies | ✅ Complete | ⚠️ Partial |
| Blocked cookies | ✅ Captured | ❌ Not shown |
| Failed requests | ✅ Full details | ✅ Yes |
| Export ease | ✅ One-click | ⚠️ Manual |

## Technical Reference

### Chrome Debugger Protocol

- [Network Domain Documentation](https://chromedevtools.github.io/devtools-protocol/tot/Network/)
- [Network.getResponseBody](https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-getResponseBody)
- [Network.getRequestPostData](https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-getRequestPostData)

### HAR Specification

- [HAR 1.2 Spec](http://www.softwareishard.com/blog/har-12-spec/)
- Official format used by all major browsers and tools

## Troubleshooting

### POST Data Missing

**Possible causes:**
- Request completed before debugger attached
- Very early request (page load)
- Some frameworks clear POST data

**Solution:**
- Start recording BEFORE navigating
- Refresh page after starting recording

### Binary Content Corrupted

**Check:**
- Is encoding marked as base64?
- Decode using standard base64 decoder
- Check if compression was applied

### Large Responses Missing

**Causes:**
- Response too large (>100MB)
- Timeout during capture

**Solution:**
- Requests should complete normally
- Check console for errors

## Summary

This extension provides **complete fidelity** network capture:
- ✅ All POST data (text and binary)
- ✅ All response bodies (text and binary)
- ✅ All headers and cookies
- ✅ Compression handling
- ✅ Multipart form data
- ✅ OAuth token flows
- ✅ Failed requests

The HAR files generated are **complete** and can be used for:
- Debugging OAuth flows
- API troubleshooting
- Security analysis
- Performance optimization
- Compliance auditing
