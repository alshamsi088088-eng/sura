$path = "c:\Users\ALSHAMSI\Documents\GitHub\sura\client\src\pages\HomePage.tsx"
$c = [System.IO.File]::ReadAllText($path)
$c = $c -replace '</\x{FF5C}\x{FF5C}DSML\x{FF5C}\x{FF5C}parameter>', ''
$c = $c -replace '</\x{FF5C}\x{FF5C}parameter>', ''
$c = $c -replace '</\x{EF}\x{BF}\x{BD}\x{EF}\x{BF}\x{BD}DSML\x{EF}\x{BF}\x{BD}\x{EF}\x{BF}\x{BD}parameter>', ''
$c = $c.TrimEnd()
[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "Done"

