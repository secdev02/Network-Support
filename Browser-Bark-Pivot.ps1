Function Test-EntraCookieImport {
    <#
    .SYNOPSIS
        Diagnostic function to test cookie import with detailed output.

    .DESCRIPTION
        Runs the cookie import with maximum verbosity and debugging information
        to help troubleshoot issues.

    .PARAMETER CookieValue
        The ESTSAUTH or ESTSAUTHPERSISTENT cookie value.

    .PARAMETER TenantID
        The Entra ID tenant ID.

    .EXAMPLE
        Test-EntraCookieImport -CookieValue "0.AS8A..." -TenantID "contoso.onmicrosoft.com"
    #>
    [cmdletbinding()]
    param(
        [Parameter(Mandatory = $True)]
        [string]
        $CookieValue,

        [Parameter(Mandatory = $True)]
        [string]
        $TenantID
    )

    Write-Host "`n=== Cookie Import Diagnostic ===" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 1: Cookie format
    Write-Host "[Test 1] Validating cookie format..." -ForegroundColor Cyan
    $IsValid = Test-CookieValue -CookieValue $CookieValue
    
    if (-not $IsValid) {
        Write-Host "[FAIL] Cookie format validation failed" -ForegroundColor Red
        return
    }
    Write-Host "[PASS] Cookie format is valid" -ForegroundColor Green
    Write-Host ""
    
    # Test 2: Tenant ID format
    Write-Host "[Test 2] Validating tenant ID..." -ForegroundColor Cyan
    Write-Host ("  Tenant ID: {0}" -f $TenantID)
    
    # Check if it's a GUID or domain name
    if ($TenantID -match "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$") {
        Write-Host "  Format: GUID" -ForegroundColor Green
    }
    elseif ($TenantID -match "\.onmicrosoft\.com$|\.com$") {
        Write-Host "  Format: Domain name" -ForegroundColor Green
    }
    else {
        Write-Host "  Format: Unknown (may still work)" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Test 3: Attempt import with verbose output
    Write-Host "[Test 3] Attempting cookie import with verbose output..." -ForegroundColor Cyan
    Write-Host ""
    
    $Token = Import-EntraCookie -CookieValue $CookieValue -TenantID $TenantID -Verbose
    
    if ($Token) {
        Write-Host ""
        Write-Host "[SUCCESS] Cookie import successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Token details:" -ForegroundColor Cyan
        Write-Host ("  Token Type: {0}" -f $Token.token_type)
        Write-Host ("  Expires In: {0} seconds" -f $Token.expires_in)
        Write-Host ("  Has Access Token: {0}" -f ($null -ne $Token.access_token))
        Write-Host ("  Has Refresh Token: {0}" -f ($null -ne $Token.refresh_token))
        
        if ($Token.access_token) {
            Write-Host ("  Access Token Length: {0}" -f $Token.access_token.Length)
        }
    }
    else {
        Write-Host ""
        Write-Host "[FAIL] Cookie import failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Get a fresh cookie (logout and login again)" -ForegroundColor Yellow
        Write-Host "  2. Verify you're using the correct tenant ID" -ForegroundColor Yellow
        Write-Host "  3. Try using ESTSAUTHPERSISTENT if you used ESTSAUTH" -ForegroundColor Yellow
        Write-Host "  4. Check if there are any Conditional Access policies blocking this" -ForegroundColor Yellow
    }
}

Function Test-CookieValue {
    <#
    .SYNOPSIS
        Validates a cookie value before attempting to import it.

    .DESCRIPTION
        Checks if a cookie value appears to be in the correct format for ESTSAUTH cookies.

    .PARAMETER CookieValue
        The cookie value to test.

    .EXAMPLE
        Test-CookieValue -CookieValue "0.AS8A..."
    #>
    [cmdletbinding()]
    param(
        [Parameter(Mandatory = $True)]
        $CookieValue
    )

    Write-Host "[*] Testing cookie value..." -ForegroundColor Cyan
    
    # Check type
    Write-Host ("  - Type: {0}" -f $CookieValue.GetType().FullName)
    
    # Try to convert to string
    try {
        $StringValue = [string]$CookieValue
        Write-Host ("  - Length: {0}" -f $StringValue.Length)
        Write-Host ("  - First 20 chars: {0}..." -f $StringValue.Substring(0, [Math]::Min(20, $StringValue.Length)))
        
        # Check if it looks like an ESTSAUTH cookie
        if ($StringValue.StartsWith("0.")) {
            Write-Host "  - Format: Appears to be valid ESTSAUTH format" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "  - Format: Does not appear to be ESTSAUTH format (should start with '0.')" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host ("  - Error converting to string: {0}" -f $_.Exception.Message) -ForegroundColor Red
        return $false
    }
}

Function Import-EntraCookie {
    <#
    .SYNOPSIS
        Imports browser cookies to obtain Entra ID tokens for use with BARK.

        Author: Custom addition for BARK
        License: GPLv3
        Required Dependencies: None

    .DESCRIPTION
        This function imports browser cookies (particularly ESTSAUTH or ESTSAUTHPERSISTENT cookies)
        and uses them to obtain access tokens that can be used with BARK functions.

    .PARAMETER CookieValue
        The value of the ESTSAUTH or ESTSAUTHPERSISTENT cookie from your browser.

    .PARAMETER TenantID
        The Entra ID tenant ID.

    .PARAMETER Resource
        The resource to request a token for. Defaults to MS Graph.
        Common values:
        - "https://graph.microsoft.com" (MS Graph)
        - "https://management.azure.com" (Azure Resource Manager)

    .PARAMETER ClientID
        The client ID to use. Defaults to Azure PowerShell client ID.

    .EXAMPLE
        $Token = Import-EntraCookie -CookieValue "0.AS..." -TenantID "contoso.onmicrosoft.com"

        Description
        -----------
        Import a cookie and obtain an MS Graph token

    .EXAMPLE
        $Token = Import-EntraCookie -CookieValue "0.AS..." -TenantID "197394d9-7065-43d2-8dc8-c63c1349abb0" -Resource "https://management.azure.com"

        Description
        -----------
        Import a cookie and obtain an Azure Resource Manager token
    #>
    [cmdletbinding()]
    param(
        [Parameter(Mandatory = $True)]
        [string]
        $CookieValue,

        [Parameter(Mandatory = $True)]
        [string]
        $TenantID,

        [Parameter(Mandatory = $False)]
        [string]
        $Resource = "https://graph.microsoft.com",

        [Parameter(Mandatory = $False)]
        [string]
        $ClientID = "1950a258-227b-4e31-a9cf-717495945fc2"
    )

    try {
        # Load System.Web for URL decoding
        Add-Type -AssemblyName System.Web -ErrorAction SilentlyContinue
        
        # Ensure cookie value is a string
        $CookieValue = [string]$CookieValue
        $TenantID = [string]$TenantID
        $Resource = [string]$Resource
        $ClientID = [string]$ClientID

        Write-Verbose ("Cookie value length: {0}" -f $CookieValue.Length)
        Write-Verbose ("Tenant ID: {0}" -f $TenantID)

        # Construct the session
        $Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        
        # Create cookie container
        $Cookie = New-Object System.Net.Cookie
        $Cookie.Name = [string]"ESTSAUTH"
        $Cookie.Value = [string]$CookieValue.Trim()
        $Cookie.Domain = [string]".login.microsoftonline.com"
        $Cookie.Path = [string]"/"
        
        $Session.Cookies.Add($Cookie)

        # Build the authorization URL
        $AuthUrl = "https://login.microsoftonline.com/{0}/oauth2/authorize?resource={1}&client_id={2}&response_type=code&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient&prompt=none" -f $TenantID, $Resource, $ClientID

        Write-Verbose ("Authorization URL: {0}" -f $AuthUrl)

        # Make the request
        try {
            $Response = Invoke-WebRequest -Uri $AuthUrl -WebSession $Session -MaximumRedirection 0 -ErrorAction SilentlyContinue
        }
        catch {
            # We expect a redirect, so capture it
            if ($_.Exception.Response) {
                $Response = $_.Exception.Response
            }
            else {
                Write-Error ("Web request failed: {0}" -f $_.Exception.Message)
                return $null
            }
        }

        # Extract the authorization code from the redirect
        $Location = $null
        
        # Handle different response types
        if ($Response.Headers -and $Response.Headers.Location) {
            $Location = [string]$Response.Headers.Location
        }
        elseif ($Response.Headers -and $Response.Headers["Location"]) {
            $Location = [string]$Response.Headers["Location"]
        }

        if ($Location) {
            Write-Verbose ("Redirect location: {0}" -f $Location)
            Write-Host ("[*] Redirect URL: {0}" -f $Location) -ForegroundColor Cyan
            
            # Check for OAuth errors in the redirect
            if ($Location -match "error=([^&]+)") {
                $ErrorCode = [string]$Matches[1]
                $ErrorDescription = ""
                
                if ($Location -match "error_description=([^&]+)") {
                    $ErrorDescription = [System.Web.HttpUtility]::UrlDecode([string]$Matches[1])
                }
                
                Write-Host ("[!] OAuth Error in redirect:" -f $ErrorCode) -ForegroundColor Red
                Write-Host ("    Error Code: {0}" -f $ErrorCode) -ForegroundColor Red
                if ($ErrorDescription) {
                    Write-Host ("    Description: {0}" -f $ErrorDescription) -ForegroundColor Red
                }
                
                Write-Host ""
                Write-Host "Common causes:" -ForegroundColor Yellow
                Write-Host "  - Cookie is expired or invalid" -ForegroundColor Yellow
                Write-Host "  - User needs to consent/login interactively" -ForegroundColor Yellow
                Write-Host "  - Conditional Access policy blocking silent auth" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "Solutions:" -ForegroundColor Green
                Write-Host "  1. Get a fresh cookie (logout and login again)" -ForegroundColor Green
                Write-Host "  2. Make sure the tenant ID is correct" -ForegroundColor Green
                Write-Host ("  3. Try using ESTSAUTHPERSISTENT instead of ESTSAUTH") -ForegroundColor Green
                
                return $null
            }
            
            if ($Location -match "code=([^&]+)") {
                $AuthCode = [string]$Matches[1]
                
                Write-Verbose ("Authorization code extracted: {0}..." -f $AuthCode.Substring(0, [Math]::Min(10, $AuthCode.Length)))
                Write-Host "[+] Authorization code extracted successfully" -ForegroundColor Green
                
                # Exchange the code for a token
                $TokenBody = @{
                    grant_type    = [string]"authorization_code"
                    client_id     = [string]$ClientID
                    code          = [string]$AuthCode
                    redirect_uri  = [string]"https://login.microsoftonline.com/common/oauth2/nativeclient"
                    resource      = [string]$Resource
                }

                $TokenUrl = "https://login.microsoftonline.com/{0}/oauth2/token" -f $TenantID
                Write-Verbose ("Token URL: {0}" -f $TokenUrl)
                Write-Host "[*] Exchanging authorization code for token..." -ForegroundColor Cyan

                try {
                    $TokenResponse = Invoke-RestMethod -Uri $TokenUrl -Method POST -Body $TokenBody
                    Write-Host "[+] Token obtained successfully!" -ForegroundColor Green
                    return $TokenResponse
                }
                catch {
                    Write-Error ("Token exchange failed: {0}" -f $_.Exception.Message)
                    if ($_.ErrorDetails.Message) {
                        $ErrorObj = $_.ErrorDetails.Message | ConvertFrom-Json
                        Write-Error ("Error: {0}" -f $ErrorObj.error)
                        Write-Error ("Description: {0}" -f $ErrorObj.error_description)
                    }
                    return $null
                }
            }
            else {
                Write-Error "Failed to extract authorization code from redirect"
                Write-Host ""
                Write-Host "[!] Redirect URL does not contain authorization code" -ForegroundColor Red
                Write-Host ("Full redirect URL: {0}" -f $Location) -ForegroundColor Yellow
                Write-Host ""
                Write-Host "This usually means:" -ForegroundColor Yellow
                Write-Host "  - The cookie is expired or invalid" -ForegroundColor Yellow
                Write-Host "  - The redirect contains an error (check above)" -ForegroundColor Yellow
                Write-Host "  - Silent authentication failed" -ForegroundColor Yellow
                return $null
            }
        }
        else {
            Write-Error "No redirect received. Cookie may be invalid or expired."
            Write-Host ""
            Write-Host "[!] No redirect location found in response" -ForegroundColor Red
            
            # Try to get more info from the response
            if ($Response.StatusCode) {
                Write-Host ("Response Status Code: {0}" -f $Response.StatusCode) -ForegroundColor Yellow
            }
            
            if ($Response.Content) {
                Write-Host "Response Content (first 500 chars):" -ForegroundColor Yellow
                $ContentPreview = $Response.Content.ToString().Substring(0, [Math]::Min(500, $Response.Content.ToString().Length))
                Write-Host $ContentPreview -ForegroundColor Gray
            }
            
            Write-Host ""
            Write-Host "Troubleshooting steps:" -ForegroundColor Green
            Write-Host "  1. Verify the cookie is from login.microsoftonline.com" -ForegroundColor Green
            Write-Host "  2. Get a fresh cookie (logout and login again)" -ForegroundColor Green
            Write-Host "  3. Make sure tenant ID is correct" -ForegroundColor Green
            Write-Host "  4. Try ESTSAUTHPERSISTENT instead of ESTSAUTH" -ForegroundColor Green
            Write-Host "  5. Run with -Verbose to see more details" -ForegroundColor Green
            
            return $null
        }
    }
    catch {
        Write-Error ("Error importing cookie: {0}" -f $_.Exception.Message)
        Write-Error ("Error type: {0}" -f $_.Exception.GetType().FullName)
        if ($_.Exception.InnerException) {
            Write-Error ("Inner exception: {0}" -f $_.Exception.InnerException.Message)
        }
        return $null
    }
}

Function Import-EntraCookieFromJSON {
    <#
    .SYNOPSIS
        Imports ESTSAUTH cookie from a JSON export file and obtains tokens.

        Author: Custom addition for BARK
        License: GPLv3
        Required Dependencies: None

    .DESCRIPTION
        This function reads a JSON file containing exported cookies (such as from browser extensions
        like EditThisCookie or Cookie-Editor) and extracts the ESTSAUTH or ESTSAUTHPERSISTENT cookie
        to obtain access tokens.

    .PARAMETER JSONPath
        Path to the JSON file containing exported cookies.

    .PARAMETER TenantID
        The Entra ID tenant ID.

    .PARAMETER Resource
        The resource to request a token for. Defaults to MS Graph.

    .PARAMETER CookieName
        The name of the cookie to extract. Defaults to "ESTSAUTH" but can be "ESTSAUTHPERSISTENT".

    .EXAMPLE
        $Token = Import-EntraCookieFromJSON -JSONPath ".\cookies.json" -TenantID "contoso.onmicrosoft.com"

        Description
        -----------
        Import cookies from a JSON file and obtain an MS Graph token

    .EXAMPLE
        $Token = Import-EntraCookieFromJSON -JSONPath ".\cookies.json" -TenantID "contoso.onmicrosoft.com" -CookieName "ESTSAUTHPERSISTENT"

        Description
        -----------
        Import the persistent cookie variant from a JSON file
    #>
    [cmdletbinding()]
    param(
        [Parameter(Mandatory = $True)]
        [string]
        $JSONPath,

        [Parameter(Mandatory = $True)]
        [string]
        $TenantID,

        [Parameter(Mandatory = $False)]
        [string]
        $Resource = "https://graph.microsoft.com",

        [Parameter(Mandatory = $False)]
        [string]
        $CookieName = "ESTSAUTH"
    )

    try {
        # Check if file exists
        if (-not (Test-Path $JSONPath)) {
            Write-Error ("Cookie JSON file not found: {0}" -f $JSONPath)
            return $null
        }

        # Read and parse JSON
        Write-Host ("[*] Reading cookie file: {0}" -f $JSONPath) -ForegroundColor Cyan
        $JSONContent = Get-Content -Path $JSONPath -Raw
        $Cookies = $JSONContent | ConvertFrom-Json

        # Handle different JSON formats
        $CookieValue = $null
        
        # Format 1: Array of cookie objects
        if ($Cookies -is [Array]) {
            Write-Host "[*] Detected array format (EditThisCookie/Cookie-Editor style)" -ForegroundColor Cyan
            $TargetCookie = $Cookies | Where-Object { $_.name -eq $CookieName -or $_.Name -eq $CookieName }
            
            if ($TargetCookie) {
                $CookieValue = if ($TargetCookie.value) { $TargetCookie.value } else { $TargetCookie.Value }
            }
        }
        # Format 2: Object with cookies property
        elseif ($Cookies.cookies) {
            Write-Host "[*] Detected object format with 'cookies' property" -ForegroundColor Cyan
            $TargetCookie = $Cookies.cookies | Where-Object { $_.name -eq $CookieName -or $_.Name -eq $CookieName }
            
            if ($TargetCookie) {
                $CookieValue = if ($TargetCookie.value) { $TargetCookie.value } else { $TargetCookie.Value }
            }
        }
        # Format 3: Direct object properties
        else {
            Write-Host "[*] Detected direct object format" -ForegroundColor Cyan
            $CookieValue = $Cookies.$CookieName
        }

        if ($CookieValue) {
            Write-Host ("[+] Found {0} cookie" -f $CookieName) -ForegroundColor Green
            
            # Ensure it's a string
            $CookieValueString = [string]$CookieValue
            
            Write-Host ("[*] Cookie value starts with: {0}..." -f $CookieValueString.Substring(0, [Math]::Min(20, $CookieValueString.Length))) -ForegroundColor Cyan
            Write-Host ("[*] Cookie value length: {0}" -f $CookieValueString.Length) -ForegroundColor Cyan
            
            # Test the cookie first
            $IsValid = Test-CookieValue -CookieValue $CookieValueString
            
            if (-not $IsValid) {
                Write-Host "[!] Cookie format may not be valid, but attempting import anyway..." -ForegroundColor Yellow
            }
            
            Write-Host "[*] Attempting to import cookie..." -ForegroundColor Cyan
            
            # Import the cookie
            $Token = Import-EntraCookie -CookieValue $CookieValueString -TenantID $TenantID -Resource $Resource
            
            if ($Token) {
                Write-Host "[+] Successfully obtained token!" -ForegroundColor Green
                return $Token
            }
            else {
                Write-Error "Failed to obtain token from cookie"
                return $null
            }
        }
        else {
            Write-Error ("{0} cookie not found in JSON file" -f $CookieName)
            Write-Host "[*] Available cookies in file:" -ForegroundColor Yellow
            
            if ($Cookies -is [Array]) {
                $Cookies | ForEach-Object { 
                    $name = if ($_.name) { $_.name } else { $_.Name }
                    if ($name) { Write-Host ("  - {0}" -f $name) }
                }
            }
            elseif ($Cookies.cookies) {
                $Cookies.cookies | ForEach-Object { 
                    $name = if ($_.name) { $_.name } else { $_.Name }
                    if ($name) { Write-Host ("  - {0}" -f $name) }
                }
            }
            else {
                $Cookies.PSObject.Properties | ForEach-Object { Write-Host ("  - {0}" -f $_.Name) }
            }
            
            return $null
        }
    }
    catch {
        Write-Error ("Error parsing JSON file: {0}" -f $_.Exception.Message)
        return $null
    }
}

Function Import-EntraCookieFromBrowser {
    <#
    .SYNOPSIS
        Extracts ESTSAUTH cookie from browser storage and imports it to obtain tokens.

        Author: Custom addition for BARK
        License: GPLv3
        Required Dependencies: None

    .DESCRIPTION
        This function helps extract cookies from local browser storage.
        Supports Chrome, Edge, and Firefox on Windows.

    .PARAMETER Browser
        The browser to extract cookies from. Options: Chrome, Edge, Firefox

    .PARAMETER TenantID
        The Entra ID tenant ID.

    .PARAMETER Resource
        The resource to request a token for. Defaults to MS Graph.

    .EXAMPLE
        $Token = Import-EntraCookieFromBrowser -Browser Chrome -TenantID "contoso.onmicrosoft.com"

        Description
        -----------
        Extract cookie from Chrome and obtain an MS Graph token
    #>
    [cmdletbinding()]
    param(
        [Parameter(Mandatory = $True)]
        [ValidateSet("Chrome", "Edge", "Firefox")]
        [string]
        $Browser,

        [Parameter(Mandatory = $True)]
        [string]
        $TenantID,

        [Parameter(Mandatory = $False)]
        [string]
        $Resource = "https://graph.microsoft.com"
    )

    Write-Host "[*] Note: Browser must be closed for cookie extraction to work reliably" -ForegroundColor Yellow
    Write-Host "[*] This function requires additional dependencies (like SQLite) to read browser databases" -ForegroundColor Yellow
    Write-Host "[!] For manual extraction, open your browser's Developer Tools (F12)" -ForegroundColor Cyan
    Write-Host "[!] Go to Application/Storage > Cookies > https://login.microsoftonline.com" -ForegroundColor Cyan
    Write-Host "[!] Copy the value of 'ESTSAUTH' or 'ESTSAUTHPERSISTENT' cookie" -ForegroundColor Cyan
    Write-Host "[!] Then use: Import-EntraCookie -CookieValue '<paste here>' -TenantID '$TenantID'" -ForegroundColor Cyan
    Write-Host ""

    # Browser cookie locations
    $CookiePaths = @{
        Chrome  = "{0}\Google\Chrome\User Data\Default\Network\Cookies" -f $env:LOCALAPPDATA
        Edge    = "{0}\Microsoft\Edge\User Data\Default\Network\Cookies" -f $env:LOCALAPPDATA
        Firefox = "{0}\Mozilla\Firefox\Profiles\*.default-release\cookies.sqlite" -f $env:APPDATA
    }

    $CookiePath = $CookiePaths[$Browser]

    if (Test-Path $CookiePath) {
        Write-Host ("[+] Found {0} cookie database at: {1}" -f $Browser, $CookiePath) -ForegroundColor Green
        Write-Host "[!] Automated extraction requires additional implementation" -ForegroundColor Yellow
        Write-Host "[!] Please manually extract the cookie using the instructions above" -ForegroundColor Yellow
    }
    else {
        Write-Host ("[-] {0} cookie database not found at: {1}" -f $Browser, $CookiePath) -ForegroundColor Red
    }
}

# Usage examples:
Write-Host "`n=== BARK Cookie Import Functions ===" -ForegroundColor Cyan
Write-Host "`nMethod 1: Import from JSON export (RECOMMENDED):" -ForegroundColor Green
Write-Host '  1. Install a cookie export extension (EditThisCookie, Cookie-Editor, etc.)'
Write-Host '  2. Navigate to portal.azure.com and login'
Write-Host '  3. Export cookies for login.microsoftonline.com to a JSON file'
Write-Host '  4. Run: $Token = Import-EntraCookieFromJSON -JSONPath ".\cookies.json" -TenantID "YOUR_TENANT"'
Write-Host "`nMethod 2: Import cookie manually:" -ForegroundColor Green
Write-Host '  1. Open browser, login to portal.azure.com' 
Write-Host '  2. Press F12, go to Application > Cookies > login.microsoftonline.com'
Write-Host '  3. Copy the ESTSAUTH or ESTSAUTHPERSISTENT cookie value'
Write-Host '  4. Run: $Token = Import-EntraCookie -CookieValue "YOUR_COOKIE" -TenantID "YOUR_TENANT"'
Write-Host "`nMethod 3: Get browser extraction help:" -ForegroundColor Green
Write-Host '  Import-EntraCookieFromBrowser -Browser Chrome -TenantID "YOUR_TENANT"'
Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
Write-Host '  If you get errors, use the diagnostic function:'
Write-Host '  Test-EntraCookieImport -CookieValue "YOUR_COOKIE" -TenantID "YOUR_TENANT"'
Write-Host '  '
Write-Host '  This will show exactly where the import fails and why.'
Write-Host ""
