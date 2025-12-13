Add-Type -AssemblyName System.Drawing

$targetSize = 48
$folder = "d:\sinhviennam4\PTUDHTTTHD\Project\Human-Management\frontend\public"
$files = @("grabbing.png")

foreach ($file in $files) {
    $path = Join-Path $folder $file
    if (Test-Path $path) {
        try {
            $img = [System.Drawing.Image]::FromFile($path)
            $resized = new-object System.Drawing.Bitmap($targetSize, $targetSize)
            $graph = [System.Drawing.Graphics]::FromImage($resized)
            $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graph.DrawImage($img, 0, 0, $targetSize, $targetSize)
            
            $img.Dispose()
            $resized.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
            $resized.Dispose()
            $graph.Dispose()
            
            Write-Host "Resized $file to 32x32"
        } catch {
            Write-Host "Error resizing $file : $_"
        }
    } else {
        Write-Host "File not found: $file"
    }
}
