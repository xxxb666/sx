import zipfile
import xml.etree.ElementTree as ET

docx_path = r'c:\Users\HUAWEI\Desktop\新建文件夹\北师大版七上数学自学辅助网站 项目文档.docx'

with zipfile.ZipFile(docx_path, 'r') as zip_ref:
    # 读取 document.xml
    document_xml = zip_ref.read('word/document.xml')
    root = ET.fromstring(document_xml)
    
    # 定义命名空间
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    # 提取所有文本
    paragraphs = root.findall('.//w:p', ns)
    for i, para in enumerate(paragraphs):
        texts = para.findall('.//w:t', ns)
        para_text = ''.join([t.text for t in texts if t.text])
        if para_text.strip():
            print(f"段落 {i}: {para_text}")
            print("---")
