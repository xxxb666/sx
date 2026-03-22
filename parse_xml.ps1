$xmlPath = "c:\Users\HUAWEI\Desktop\新建文件夹\docx_content\word\document.xml"
$xmlContent = Get-Content -Path $xmlPath -Raw -Encoding UTF8

# 使用正则表达式提取所有 w:t 标签中的文本
$pattern = '<w:t[^>]*>([^<]*)</w:t>'
$matches = [regex]::Matches($xmlContent, $pattern)

$allText = @()
foreach ($match in $matches) {
    $text = $match.Groups[1].Value
    if ($text.Trim()) {
        $allText += $text
    }
}

# 输出到控制台
$allText | Out-File -FilePath "c:\Users\HUAWEI\Desktop\新建文件夹\project_content.txt" -Encoding UTF8
Write-Host "Extraction complete! Total segments: $($allText.Count)"
