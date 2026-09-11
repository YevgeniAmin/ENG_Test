$ErrorActionPreference = "Stop"

$publicDirectory = [System.IO.Path]::GetFullPath(
    (Join-Path $PSScriptRoot "..\public")
)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

$faviconBlock = @"
    <!-- BEGIN Portal Favicons -->
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="64x64" href="/assets/images/favicon-64x64.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png">
    <!-- END Portal Favicons -->
"@ -replace "`r`n", "`n"

$managedBlockPattern = '(?is)[ \t]*<!--\s*BEGIN Portal Favicons\s*-->.*?<!--\s*END Portal Favicons\s*-->[ \t]*(?:\n)?'
$legacyCommentPattern = '(?im)^[ \t]*<!--\s*Portal Favicons\s*-->[ \t]*(?:\n)?'
$legacyLinkPattern = '(?im)^[ \t]*<link\b(?=[^>]*\brel=["''](?:icon|apple-touch-icon)["''])(?=[^>]*\bhref=["'']/assets/images/(?:favicon-(?:16x16|32x32|64x64)\.png|apple-touch-icon\.png)["''])[^>]*>[ \t]*(?:\n)?'
$headPattern = '(?is)<head\b[^>]*>.*?</head>'

try {
    $htmlFiles = @(
        Get-ChildItem -LiteralPath $publicDirectory -Filter "*.html" -File -Recurse
    )
}
catch {
    Write-Error "Unable to discover HTML files under '$publicDirectory': $($_.Exception.Message)"
    exit 1
}

if ($htmlFiles.Count -eq 0) {
    Write-Warning "No HTML files were found under: $publicDirectory"
    exit 0
}

$updatedFiles = 0
$skippedFiles = 0
$failedFiles = 0

foreach ($file in $htmlFiles) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $normalizedContent = $content -replace "`r`n", "`n"
        $normalizedContent = $normalizedContent -replace "`r", "`n"
        $headMatches = [regex]::Matches($normalizedContent, $headPattern)

        if ($headMatches.Count -ne 1) {
            throw "Expected exactly one valid head section; found $($headMatches.Count)."
        }

        $head = $headMatches[0].Value
        $cleanHead = [regex]::Replace($head, $managedBlockPattern, "")
        $cleanHead = [regex]::Replace($cleanHead, $legacyCommentPattern, "")
        $cleanHead = [regex]::Replace($cleanHead, $legacyLinkPattern, "")
        $cleanHead = $cleanHead -replace '[ \t]*\n?</head>$', "`n$faviconBlock`n</head>"

        $updatedContent = $normalizedContent.Substring(0, $headMatches[0].Index) +
            $cleanHead +
            $normalizedContent.Substring(
                $headMatches[0].Index + $headMatches[0].Length
            )

        if ($updatedContent -ceq $content) {
            Write-Host "SKIP    $($file.FullName)"
            $skippedFiles++
            continue
        }

        [System.IO.File]::WriteAllText(
            $file.FullName,
            $updatedContent,
            $utf8NoBom
        )
        $updatedFiles++
        Write-Host "UPDATE  $($file.FullName)"
    }
    catch {
        Write-Warning "FAILED  $($file.FullName): $($_.Exception.Message)"
        $failedFiles++
    }
}

Write-Host ""
Write-Host "Favicon update completed."
Write-Host "Updated: $updatedFiles"
Write-Host "Skipped: $skippedFiles"
Write-Host "Failed:  $failedFiles"
Write-Host "Total:   $($htmlFiles.Count)"

if ($failedFiles -gt 0) {
    exit 1
}
