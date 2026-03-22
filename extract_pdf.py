import sys

try:
    import fitz  # PyMuPDF
    
    pdf_path = r"c:\Users\HUAWEI\Desktop\新建文件夹\（根据 2022 年版课程标准修订）义务教育教科书•数学七年级上册.pdf"
    
    # 打开 PDF
    doc = fitz.open(pdf_path)
    
    # 提取前 10 页的内容
    text = ""
    for page_num in range(min(10, len(doc))):
        page = doc[page_num]
        text += f"\n=== 第{page_num + 1}页 ===\n"
        text += page.get_text()
    
    print(text)
    doc.close()
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
