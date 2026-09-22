import os
import re
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

md_path = "docs/EPICS_ReadQuest_IEEE_Documentation.md"
docx_path = "docs/EPICS_ReadQuest_IEEE_Documentation.docx"
txt_path = "docs/EPICS_ReadQuest_Word_Text.txt"

with open(md_path, "r", encoding="utf-8") as f:
    text = f.read()

# Also write raw clean text for word copy-pasting
with open(txt_path, "w", encoding="utf-8") as f:
    f.write(text)

doc = Document()

# Set standard margins (1 inch)
for section in doc.sections:
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

# Normal style font
style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(11)
font.color.rgb = RGBColor(0, 0, 0)

lines = text.split("\n")
i = 0
in_code = False
code_lines = []

while i < len(lines):
    line = lines[i]
    
    # Handle code blocks
    if line.strip().startswith("```"):
        if in_code:
            in_code = False
            p = doc.add_paragraph("\n".join(code_lines))
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(6)
            for r in p.runs:
                r.font.name = 'Courier New'
                r.font.size = Pt(9.5)
            code_lines = []
        else:
            in_code = True
            code_lines = []
        i += 1
        continue
        
    if in_code:
        code_lines.append(line)
        i += 1
        continue

    # Title #
    if line.startswith("# "):
        title_text = line[2:].strip()
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title_text)
        r.bold = True
        r.font.size = Pt(18)
        i += 1
        continue

    # Subtitle **EPICS ...**
    if line.startswith("**EPICS") or (line.startswith("**") and "Project Documentation" in line):
        clean_text = line.replace("**", "").strip()
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(12)
        r = p.add_run(clean_text)
        r.bold = True
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(50, 80, 120)
        i += 1
        continue

    # H2 ##
    if line.startswith("## "):
        h2_text = line[3:].strip()
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(h2_text)
        r.bold = True
        r.font.size = Pt(13)
        i += 1
        continue

    # H3 ###
    if line.startswith("### "):
        h3_text = line[4:].strip()
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(h3_text)
        r.bold = True
        r.italic = True
        r.font.size = Pt(11.5)
        i += 1
        continue

    # Table parsing
    if line.strip().startswith("|") and i + 1 < len(lines) and "|---" in lines[i+1]:
        header_line = line
        divider_line = lines[i+1]
        table_rows = []
        i += 2
        while i < len(lines) and lines[i].strip().startswith("|"):
            table_rows.append(lines[i])
            i += 1
            
        headers = [c.strip() for c in header_line.split("|")[1:-1]]
        table = doc.add_table(rows=1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = table.rows[0].cells
        for col_idx, h in enumerate(headers):
            hdr_cells[col_idx].text = re.sub(r'[*_`]', '', h)
            hdr_p = hdr_cells[col_idx].paragraphs[0]
            for r in hdr_p.runs:
                r.bold = True
                r.font.size = Pt(9.5)
                
        for row_str in table_rows:
            cols = [c.strip() for c in row_str.split("|")[1:-1]]
            row_cells = table.add_row().cells
            for c_idx, val in enumerate(cols):
                if c_idx < len(row_cells):
                    row_cells[c_idx].text = re.sub(r'[*_`$]', '', val)
                    for r in row_cells[c_idx].paragraphs[0].runs:
                        r.font.size = Pt(9)
                        
        doc.add_paragraph() # space after table
        continue

    # Horizontal divider
    if line.strip() == "---":
        i += 1
        continue

    # Bullet / numbered item
    if line.strip().startswith("- ") or line.strip().startswith("* "):
        bullet_text = line.strip()[2:].strip()
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        # Handle simple bold formatting
        parts = re.split(r'(\*\*.*?\*\*)', bullet_text)
        for part in parts:
            if part.startswith("**") and part.endswith("**"):
                r = p.add_run(part[2:-2])
                r.bold = True
            else:
                p.add_run(part)
        i += 1
        continue

    if re.match(r'^\d+\.\s', line.strip()):
        num_text = re.sub(r'^\d+\.\s', '', line.strip())
        p = doc.add_paragraph(style='List Number')
        p.paragraph_format.space_after = Pt(2)
        parts = re.split(r'(\*\*.*?\*\*)', num_text)
        for part in parts:
            if part.startswith("**") and part.endswith("**"):
                r = p.add_run(part[2:-2])
                r.bold = True
            else:
                p.add_run(part)
        i += 1
        continue

    # Normal paragraph
    if line.strip():
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        parts = re.split(r'(\*\*.*?\*\*)', line.strip())
        for part in parts:
            if part.startswith("**") and part.endswith("**"):
                r = p.add_run(part[2:-2])
                r.bold = True
            else:
                clean_part = part.replace("$", "").replace("`", "")
                p.add_run(clean_part)
                
    i += 1

doc.save(docx_path)
print(f"Successfully generated DOCX at {docx_path}")
print(f"Successfully generated clean TXT at {txt_path}")
