import os
import subprocess
import markdown

md_path = os.path.abspath("docs/EPICS_ReadQuest_IEEE_Documentation.md")
html_path = os.path.abspath("docs/EPICS_ReadQuest_IEEE_Documentation.html")
pdf_path = os.path.abspath("docs/EPICS_ReadQuest_IEEE_Documentation.pdf")

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown to html
html_body = markdown.markdown(
    md_content,
    extensions=["tables", "fenced_code", "toc", "attr_list"]
)

# Custom IEEE-style Academic CSS
html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ReadQuest: EPICS Technical Documentation</title>
<style>
  @page {{
    size: letter;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}

  body {{
    font-family: "Times New Roman", Times, Georgia, serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #111;
    margin: 0;
    padding: 0;
    background: #fff;
  }}

  h1 {{
    font-size: 19pt;
    text-align: center;
    font-weight: bold;
    margin-top: 0;
    margin-bottom: 6px;
    line-height: 1.25;
  }}

  h1 + p {{
    text-align: center;
    font-size: 12pt;
    font-weight: bold;
    color: #2b3a4a;
    margin-top: 0;
    margin-bottom: 16px;
  }}

  h2 {{
    font-size: 12.5pt;
    text-transform: uppercase;
    font-weight: bold;
    border-bottom: 1.5px solid #222;
    padding-bottom: 3px;
    margin-top: 22px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }}

  h4 {{
    font-size: 10.5pt;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 4px;
  }}

  p, li {{
    text-align: justify;
    margin-top: 4px;
    margin-bottom: 8px;
  }}

  ul, ol {{
    margin-top: 4px;
    margin-bottom: 8px;
    padding-left: 24px;
  }}

  /* Author block styling */
  h3:has(+ ul) {{
    text-align: center;
  }}

  /* Table styling */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}

  th, td {{
    border: 1px solid #333;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }}

  th {{
    background-color: #f0f2f5;
    font-weight: bold;
    text-align: center;
  }}

  /* Code / Architecture blocks */
  pre {{
    background-color: #f7f8fa;
    border: 1px solid #dcdfe4;
    border-radius: 4px;
    padding: 10px 12px;
    font-family: "Consolas", "Courier New", Courier, monospace;
    font-size: 8.5pt;
    line-height: 1.35;
    overflow-x: auto;
    page-break-inside: avoid;
    white-space: pre;
  }}

  code {{
    font-family: "Consolas", "Courier New", Courier, monospace;
    font-size: 9pt;
    background-color: #f3f4f6;
    padding: 1px 4px;
    border-radius: 3px;
  }}

  pre code {{
    background-color: transparent;
    padding: 0;
  }}

  /* Blockquote / Alert styling */
  blockquote {{
    border-left: 3.5px solid #2563eb;
    background-color: #f8fafc;
    margin: 12px 0;
    padding: 8px 14px;
    font-size: 10pt;
    color: #1e293b;
    page-break-inside: avoid;
  }}

  blockquote p {{
    margin: 0;
  }}

  /* Horizontal dividers */
  hr {{
    border: none;
    border-top: 1px solid #ddd;
    margin: 18px 0;
  }}

  /* References section */
  ol:has(li[id^="fn"]) {{
    font-size: 9pt;
  }}

  @media print {{
    body {{
      color: #000;
    }}
    a {{
      color: #000;
      text-decoration: none;
    }}
    a[href^="http"]:after {{
      content: " (" attr(href) ")";
      font-size: 8pt;
      color: #444;
    }}
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_template)

print(f"HTML saved to {html_path}")

# Run Chrome Headless to print to PDF
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Rendering PDF with Chrome headless...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0 and os.path.exists(pdf_path):
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"SUCCESS: PDF generated at {pdf_path} ({size_kb:.1f} KB)")
else:
    print(f"Chrome exited with code {res.returncode}")
    print(res.stderr)
