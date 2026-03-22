Write-Host "=== Math Study Webpage Test Report ===" -ForegroundColor Cyan
Write-Host ""

$filePath = "c:\Users\HUAWEI\Desktop\新建文件夹\math_study.html"
Write-Host "1. Checking webpage file..." -ForegroundColor Yellow

if (Test-Path $filePath) {
    $fileSize = (Get-Item $filePath).Length
    Write-Host "   OK File exists" -ForegroundColor Green
    Write-Host "   OK File size: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "2. Checking key elements..." -ForegroundColor Yellow
    $content = Get-Content $filePath -Raw
    
    $patterns = @(
        @("HTML Structure", "<!DOCTYPE html>"),
        @("Title", "北师大版七上数学自学助手"),
        @("Home Tab", "首页"),
        @("Knowledge Tab", "知识点梳理"),
        @("Exercise Tab", "例题练习"),
        @("Error Book Tab", "错题本"),
        @("JavaScript", "function switchTab"),
        @("LocalStorage", "localStorage"),
        @("Responsive", "@media")
    )
    
    foreach ($pattern in $patterns) {
        if ($content -match [regex]::Escape($pattern[1])) {
            Write-Host "   OK $($pattern[0])" -ForegroundColor Green
        } else {
            Write-Host "   FAIL $($pattern[0])" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "3. Feature statistics..." -ForegroundColor Yellow
    
    $exerciseCount = ([regex]::Matches($content, 'class="exercise-card"')).Count
    Write-Host "   - Exercises: $exerciseCount" -ForegroundColor Cyan
    
    $knowledgeCount = ([regex]::Matches($content, 'class="knowledge-card"')).Count
    Write-Host "   - Knowledge sections: $knowledgeCount" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "4. Opening webpage..." -ForegroundColor Yellow
    Start-Process $filePath
    Write-Host "   OK Webpage opened in browser" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== Test Complete ===" -ForegroundColor Cyan
    
} else {
    Write-Host "   FAIL File not found" -ForegroundColor Red
}
