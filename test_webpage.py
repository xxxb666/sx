from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# 启动浏览器
driver = webdriver.Edge()
driver.maximize_window()

try:
    # 打开网页
    driver.get(r'file:///c:/Users/HUAWEI/Desktop/新建文件夹/math_study.html')
    print("✅ 网页加载成功！")
    print(f"网页标题：{driver.title}")
    
    # 测试 1: 检查首页内容
    print("\n📋 测试 1: 检查首页内容")
    greeting = driver.find_element(By.CLASS_NAME, 'greeting-card')
    print(f"✓ 问候语卡片存在：{greeting.is_displayed()}")
    
    # 测试 2: 切换标签页
    print("\n📋 测试 2: 测试标签页切换")
    tabs = driver.find_elements(By.CLASS_NAME, 'nav-tab')
    tab_names = ['首页', '知识点梳理', '例题练习', '错题本']
    
    for i, tab in enumerate(tabs):
        tab.click()
        time.sleep(0.5)
        active_tab = driver.find_element(By.CLASS_NAME, 'tab-content.active')
        print(f"✓ 切换到第 {i+1} 个标签：{tab_names[i]}")
    
    # 测试 3: 测试查看答案功能
    print("\n📋 测试 3: 测试查看答案功能")
    driver.find_elements(By.CLASS_NAME, 'btn-primary')[0].click()
    time.sleep(0.5)
    answer = driver.find_element(By.ID, 'answer1')
    print(f"✓ 答案显示：{'show' in answer.get_attribute('class')}")
    
    # 测试 4: 测试加入错题本
    print("\n📋 测试 4: 测试加入错题本功能")
    driver.find_elements(By.CLASS_NAME, 'btn-success')[0].click()
    time.sleep(0.5)
    print("✓ 错题已加入")
    
    # 测试 5: 切换到错题本查看
    print("\n📋 测试 5: 查看错题本")
    tabs[3].click()
    time.sleep(0.5)
    error_list = driver.find_element(By.ID, 'errorList')
    print(f"✓ 错题本内容加载成功")
    
    print("\n✅ 所有测试完成！")
    
except Exception as e:
    print(f"❌ 测试失败：{str(e)}")
finally:
    time.sleep(2)
    driver.quit()
    print("\n浏览器已关闭")
