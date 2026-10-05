Add-Type -AssemblyName System.Drawing

function Create-OptimizedBase64($srcPath, $outWidth, $quality) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $origW = $srcImg.Width
    $origH = $srcImg.Height
    $aspect = $origH / $origW
    $outHeight = [int]($outWidth * $aspect)

    $targetBmp = New-Object System.Drawing.Bitmap $outWidth, $outHeight
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($srcImg, 0, 0, $outWidth, $outHeight)
    $g.Dispose()
    $srcImg.Dispose()

    # Save as high-quality JPEG (97%) for great compression and sharpness
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

    $ms = New-Object System.IO.MemoryStream
    $targetBmp.Save($ms, $codec, $ep)
    $bytes = $ms.ToArray()
    $ms.Dispose()
    $targetBmp.Dispose()

    Write-Output "Resized $srcPath to ${outWidth}x${outHeight} (Q=$quality): $($bytes.Length) bytes ($([math]::Round($bytes.Length/1KB, 1)) KB)"
    return "data:image/jpeg;base64," + [Convert]::ToBase64String($bytes)
}

$frontPath = (Resolve-Path "image/id-card-1.png").Path
$backPath = (Resolve-Path "image/id-card back.png").Path

# 1400px width is super sharp (over 400 DPI) and lightning fast
$frontB64 = Create-OptimizedBase64 $frontPath 1400 97
$backB64 = Create-OptimizedBase64 $backPath 1400 97

$jsContent = "window.CARD_TEMPLATES = { front: '$frontB64', back: '$backB64' };"
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "js/templates-data.js"), $jsContent, [System.Text.Encoding]::UTF8)
Write-Output "js/templates-data.js updated successfully!"
