$htmlFiles = Get-ChildItem `
    .\public `
    -Filter "*.html" `
    -File `
    -Recurse

$filesToCheck = @($htmlFiles) + @(
    Get-Item ".\.gitattributes"
)

$encodingIssues = foreach ($file in $filesToCheck) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)

    $hasUtf8Bom =
        $bytes.Length -ge 3 -and
        $bytes[0] -eq 0xEF -and
        $bytes[1] -eq 0xBB -and
        $bytes[2] -eq 0xBF

    $text = [System.IO.File]::ReadAllText($file.FullName)
    $containsCarriageReturn = $text.Contains("`r")

    if ($hasUtf8Bom -or $containsCarriageReturn) {
        [PSCustomObject]@{
            File = $file.FullName
            UTF8_BOM = $hasUtf8Bom
            Contains_CR = $containsCarriageReturn
        }
    }
}

if ($encodingIssues) {
    Write-Host "FAIL - Encoding or line-ending issues detected:"
    $encodingIssues | Format-Table -AutoSize
}
else {
    Write-Host "PASS - HTML and .gitattributes use UTF-8 without BOM and LF only."
}