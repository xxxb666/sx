$docxPath = "c:\Users\HUAWEI\Desktop\新建文件夹\北师大版七上数学自学辅助网站 项目文档.docx"
$extractPath = "c:\Users\HUAWEI\Desktop\新建文件夹\docx_extract"

# 解压 docx 文件
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($docxPath)
$entries = $zip.Entries

# 找到 document.xml
$documentEntry = $entries | Where-Object { $_.FullName -eq "word/document.xml" }
if ($documentEntry) {
    $reader = New-Object System.IO.StreamReader($documentEntry.Open())
    $content = $reader.ReadToEnd()
    $reader.Close()
    
    # 使用正则表达式提取文本
    $pattern = '<w:t[^>]*>([^<]*)</w:t>'
    $matches = [regex]::Matches($content, $pattern)
    $texts = @()
    foreach ($match in $matches) {
        $texts += $match.Groups[1].Value
    }
    
    $zip.Dispose()
    return $texts -join "`n"
} else {
    $zip.Dispose()
    return "未找到 document.xml"
}
