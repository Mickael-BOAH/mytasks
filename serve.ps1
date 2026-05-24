$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:3000/')
$listener.Start()
Write-Host "Serving MyTasks on http://localhost:3000"
while ($true) {
    $ctx = $listener.GetContext()
    $file = Join-Path $PSScriptRoot "index.html"
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentType = "text/html; charset=utf-8"
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
}
