Add-Type -AssemblyName System.Drawing

function Resize-Image($image, [int]$size) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $destImage = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $destImage.SetResolution($image.HorizontalResolution, $image.VerticalResolution)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($image, $destRect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    
    $ms = New-Object System.IO.MemoryStream
    $destImage.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()
    return $ms.ToArray()
}

$sourcePath = Join-Path $PSScriptRoot "..\edumin-icon.png"
$source = [System.Drawing.Image]::FromFile((Resolve-Path $sourcePath))
$sizes = @(16, 32, 48, 64, 128, 256)
$pngData = @()

foreach ($sz in $sizes) {
    $pngData += ,(Resize-Image $source $sz)
}
$source.Dispose()

$msOut = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($msOut)

# ICO Header: 6 bytes
$bw.Write([int16]0) # Reserved
$bw.Write([int16]1) # Type: 1 = ICO
$bw.Write([int16]$sizes.Count) # Number of images

# Calculate offset
$offset = 6 + (16 * $sizes.Count)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $sz = $sizes[$i]
    $data = $pngData[$i]
    $w = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $h = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    
    $bw.Write($w) # Width
    $bw.Write($h) # Height
    $bw.Write([byte]0) # Color palette
    $bw.Write([byte]0) # Reserved
    $bw.Write([int16]1) # Color planes
    $bw.Write([int16]32) # Bits per pixel
    $bw.Write([int32]$data.Length) # Image size
    $bw.Write([int32]$offset) # Offset
    $offset += $data.Length
}

for ($i = 0; $i -lt $sizes.Count; $i++) {
    [byte[]]$bytes = $pngData[$i]
    $bw.Write($bytes, 0, $bytes.Length)
}

$icoBytes = $msOut.ToArray()
Write-Output "ICO total size: $($icoBytes.Length) bytes"
$bw.Close()
$msOut.Dispose()

# Save multi-size favicon.ico to app/ and public/
$appFavicon = Join-Path $PSScriptRoot "..\app\favicon.ico"
$publicFavicon = Join-Path $PSScriptRoot "..\public\favicon.ico"
[System.IO.File]::WriteAllBytes($appFavicon, $icoBytes)
[System.IO.File]::WriteAllBytes($publicFavicon, $icoBytes)

# Copy high-res icon.png and apple-icon.png to app/ and public/
$sourcePngBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $sourcePath))

[System.IO.File]::WriteAllBytes((Join-Path $PSScriptRoot "..\app\icon.png"), $sourcePngBytes)
[System.IO.File]::WriteAllBytes((Join-Path $PSScriptRoot "..\app\apple-icon.png"), $sourcePngBytes)
[System.IO.File]::WriteAllBytes((Join-Path $PSScriptRoot "..\public\icon.png"), $sourcePngBytes)
[System.IO.File]::WriteAllBytes((Join-Path $PSScriptRoot "..\public\apple-icon.png"), $sourcePngBytes)

Write-Output "Successfully generated and copied all icons!"
