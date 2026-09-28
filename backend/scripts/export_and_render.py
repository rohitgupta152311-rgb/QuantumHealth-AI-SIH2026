import os
import shutil
import sys
import time
import win32com.client
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

PPTX_PATH = r"C:\Users\rohit\OneDrive\Attachments\Desktop\SIH_2026_QuantumHealth_AI_NIT_Nagaland.pptx"
PDF_DESKTOP = r"C:\Users\rohit\OneDrive\Attachments\Desktop\SIH_2026_QuantumHealth_AI_NIT_Nagaland.pdf"
PDF_ARTIFACTS = r"C:\Users\rohit\.gemini\antigravity\brain\6a059189-7bb0-49cf-996a-e9e3f672ba38\SIH_2026_QuantumHealth_AI_NIT_Nagaland.pdf"
PDF_DOCS = r"C:\Users\rohit\.gemini\antigravity\scratch\quantum-health-ai\docs\presentation\SIH_2026_QuantumHealth_AI_NIT_Nagaland.pdf"
PDF_DOWNLOADS = r"C:\Users\rohit\Downloads\SIH_2026_QuantumHealth_AI_NIT_Nagaland.pdf"

ARTIFACT_DIR = r"C:\Users\rohit\.gemini\antigravity\brain\6a059189-7bb0-49cf-996a-e9e3f672ba38"

print(f"Exporting PPTX to PDF via PowerPoint COM: {PPTX_PATH} -> {PDF_DESKTOP}")
powerpoint = win32com.client.DispatchEx("PowerPoint.Application")
try:
    deck = powerpoint.Presentations.Open(PPTX_PATH, WithWindow=False)
    # ppSaveAsPDF format code is 32
    deck.SaveAs(PDF_DESKTOP, 32)
    deck.Close()
    print("Exported successfully to Desktop PDF!")
finally:
    powerpoint.Quit()

# Copy to destinations
PDF_DESKTOP_AROGYA = r"C:\Users\rohit\OneDrive\Attachments\Desktop\SIH_2026_ArogyaDristi_NIT_Nagaland.pdf"
shutil.copy2(PDF_DESKTOP, PDF_DESKTOP_AROGYA)

destinations = [
    PDF_ARTIFACTS,
    PDF_DOCS,
    PDF_DOWNLOADS,
    r"C:\Users\rohit\.gemini\antigravity\brain\6a059189-7bb0-49cf-996a-e9e3f672ba38\SIH_2026_ArogyaDristi_NIT_Nagaland.pdf",
    r"C:\Users\rohit\Downloads\SIH_2026_ArogyaDristi_NIT_Nagaland.pdf",
    r"C:\Users\rohit\.gemini\antigravity\scratch\quantum-health-ai\docs\presentation\SIH_2026_ArogyaDristi_NIT_Nagaland.pdf",
]
for dest in destinations:
    try:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(PDF_DESKTOP, dest)
        print(f"Copied PDF to: {dest}")
    except Exception as e:
        print(f"Notice copying to {dest}: {e}")

# Render PDF pages to PNG at 150 DPI
print(f"Rendering PDF pages to PNG at 150 DPI in {ARTIFACT_DIR}...")
doc = pymupdf.open(PDF_DESKTOP)
zoom = 150 / 72.0  # 150 DPI
mat = pymupdf.Matrix(zoom, zoom)

for i, page in enumerate(doc, 1):
    pix = page.get_pixmap(matrix=mat, alpha=False)
    out_png = os.path.join(ARTIFACT_DIR, f"slide_{i}.png")
    pix.save(out_png)
    print(f"Saved slide {i} image: {out_png} ({pix.width}x{pix.height})")

print("All slides successfully rendered to PNG!")
