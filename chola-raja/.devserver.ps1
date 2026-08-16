param(
    [int]$Port = 8020,
    [string]$Root = $PSScriptRoot
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/"

$shotDir = Join-Path $Root ".shots"
if (-not (Test-Path $shotDir)) { New-Item -ItemType Directory -Path $shotDir | Out-Null }

$mimeMap = @{
    '.html' = 'text/html'
    '.js'   = 'application/javascript'
    '.css'  = 'text/css'
    '.json' = 'application/json'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    try {
        $path = $request.Url.LocalPath

        # Development helper: the page POSTs a base64 screenshot here so the
        # canvas can be inspected as a real image file. Not used by the game.
        if ($request.HttpMethod -eq 'POST' -and $path -eq '/__shot') {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $reader.Close()
            $name = $request.QueryString['name']
            if (-not $name) { $name = 'shot' }
            $name = ($name -replace '[^A-Za-z0-9_\-]', '')
            $bytes = [Convert]::FromBase64String($body)
            [System.IO.File]::WriteAllBytes((Join-Path $shotDir "$name.png"), $bytes)
            $ok = [System.Text.Encoding]::UTF8.GetBytes("saved $name")
            $response.ContentType = 'text/plain'
            $response.OutputStream.Write($ok, 0, $ok.Length)
            $response.OutputStream.Close()
            continue
        }

        if ($path -eq '/') { $path = '/index.html' }
        $filePath = Join-Path $Root ($path.TrimStart('/'))
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            $mime = $mimeMap[$ext]
            if (-not $mime) { $mime = 'application/octet-stream' }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.Headers.Add('Cache-Control', 'no-store')
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
    } catch {
        $response.StatusCode = 500
    } finally {
        try { $response.OutputStream.Close() } catch {}
    }
}
