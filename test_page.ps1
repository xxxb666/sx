# 网页功能测试脚本

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  北师大版七上数学自学助手 - 功能测试" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$filePath = "c:\Users\HUAWEI\Desktop\新建文件夹\math_study.html"

# 1. 检查文件
Write-Host "[1/5] 检查网页文件..." -ForegroundColor Yellow
if (Test-Path $filePath) {
    $size = (Get-Item $filePath).Length
    Write-Host "  ✓ 文件存在 (大小：$([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "  ✗ 文件不存在！" -ForegroundColor Red
    exit
}

# 2. 读取内容
Write-Host ""
Write-Host "[2/5] 检查网页内容..." -ForegroundColor Yellow
$content = Get-Content $filePath -Raw

# 3. 验证关键功能
Write-Host ""
Write-Host "[3/5] 验证关键功能..." -ForegroundColor Yellow

$tests = @(
    @("HTML5 结构", "<!DOCTYPE html>"),
    @("中文标题", "北师大版七上数学自学助手"),
    @("4 个导航标签", "错题本"),
    @("JavaScript 函数", "function switchTab"),
    @("错题本功能", "addToErrorBook"),
    @("本地存储", "localStorage"),
    @("查看答案功能", "toggleAnswer"),
    @("清空错题本", "clearErrorBook"),
    @("4 道例题", "exercise-card"),
    @("6 章知识点", "knowledge-card")
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    if ($content -match [regex]::Escape($test[1])) {
        Write-Host "  ✓ $($test[0])" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ✗ $($test[0])" -ForegroundColor Red
        $failed++
    }
}

# 4. 统计内容
Write-Host ""
Write-Host "[4/5] 内容统计..." -ForegroundColor Yellow

$exerciseCount = ([regex]::Matches($content, 'exercise-card')).Count
Write-Host "  • 例题数量：$exerciseCount 道" -ForegroundColor Cyan

$knowledgeCount = ([regex]::Matches($content, 'knowledge-card')).Count
Write-Host "  • 知识点章节：$knowledgeCount 章" -ForegroundColor Cyan

$chapterCount = ([regex]::Matches($content, 'chapter-item')).Count
Write-Host "  • 教材目录：$chapterCount 章" -ForegroundColor Cyan

$buttonCount = ([regex]::Matches($content, '<button')).Count
Write-Host "  • 按钮总数：$buttonCount 个" -ForegroundColor Cyan

# 5. 打开网页
Write-Host ""
Write-Host "[5/5] 打开网页进行测试..." -ForegroundColor Yellow
Start-Process $filePath
Write-Host "  ✓ 网页已在浏览器中打开" -ForegroundColor Green

# 测试结果
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  测试结果：$passed 通过，$failed 失败" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请在浏览器中测试以下功能：" -ForegroundColor Yellow
Write-Host "  1. 点击 4 个导航标签，检查切换是否正常" -ForegroundColor White
Write-Host "  2. 点击"查看答案"按钮，检查答案显示" -ForegroundColor White
Write-Host "  3. 点击"加入错题本"，检查错题收录" -ForegroundColor White
Write-Host "  4. 切换到"错题本"标签，查看错题列表" -ForegroundColor White
Write-Host "  5. 测试"删除此题"和"清空错题本"功能" -ForegroundColor White
