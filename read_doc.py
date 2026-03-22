import docx

doc = docx.Document(r'c:\Users\HUAWEI\Desktop\新建文件夹\北师大版七上数学自学辅助网站 项目文档.docx')

for i, para in enumerate(doc.paragraphs):
    print(f"段落 {i}: {para.text}")
    print("---")
