import os
import sys
import fitz # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import matplotlib
matplotlib.use('Agg')

# Paths
BRAIN_DIR = r"C:\Users\rohit\.gemini\antigravity\brain\6a059189-7bb0-49cf-996a-e9e3f672ba38"
USER_PAGES_DIR = os.path.join(BRAIN_DIR, "user_redesign")
ASSETS_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\quantum-health-ai\backend\scripts\slide_assets"

OUTPUT_PDF_DESKTOP = r"C:\Users\rohit\OneDrive\Attachments\Desktop\SIH_2026_ArogyaDristi_NIT_Nagaland.pdf"
OUTPUT_PDF_DOWNLOADS = r"C:\Users\rohit\Downloads\SIH_2026_ArogyaDristi_NIT_Nagaland.pdf"
OUTPUT_PDF_DOCS = r"C:\Users\rohit\.gemini\antigravity\scratch\quantum-health-ai\docs\presentation\SIH_2026_ArogyaDristi_NIT_Nagaland.pdf"
OUTPUT_PPTX_DESKTOP = r"C:\Users\rohit\OneDrive\Attachments\Desktop\SIH_2026_ArogyaDristi_NIT_Nagaland.pptx"

# Fonts
FONT_SEGOE_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_SEGOE_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SEGOE_SEMIBOLD = r"C:\Windows\Fonts\seguisb.ttf" if os.path.exists(r"C:\Windows\Fonts\seguisb.ttf") else FONT_SEGOE_BOLD
FONT_NIRMALA = r"C:\Windows\Fonts\Nirmala.ttc"

print("Starting generation of master redesigned presentation...")

# ==============================================================================
# 1. GENERATE SLIDE 1 (TITLE SLIDE)
# ==============================================================================
print("1. Generating Slide 1...")
p1_base = Image.open(os.path.join(USER_PAGES_DIR, "user_page_1.png")).convert("RGBA")

# Overlay top-left CODE (404) logo for brand uniformity
logo = Image.open(os.path.join(ASSETS_DIR, "top_left_code404_logo.png")).convert("RGBA")
p1_base.paste(logo, (35, 15), logo)

# Clear old text area cleanly
p1_draw = ImageDraw.Draw(p1_base)
p1_draw.rectangle([(75, 180), (980, 880)], fill=(250, 252, 254, 255))

# Render ArogyaDristi with matplotlib for Hindi shaping at crisp resolution
fig, ax = plt.subplots(figsize=(7, 0.7), dpi=300)
ax.text(0.0, 0.5, 'ArogyaDristi (आरोग्यदृष्टि)', fontname='Nirmala UI', fontsize=26, fontweight='bold', color='#0A2540', va='center')
ax.axis('off')
arogya_snippet_path = os.path.join(ASSETS_DIR, "arogya_snippet_p1.png")
plt.savefig(arogya_snippet_path, transparent=True, bbox_inches='tight', pad_inches=0.01)
plt.close()
arogya_snippet = Image.open(arogya_snippet_path).convert("RGBA")
aspect = arogya_snippet.width / arogya_snippet.height
arogya_snippet = arogya_snippet.resize((int(38 * aspect), 38), Image.Resampling.LANCZOS)

f_bold_26 = ImageFont.truetype(FONT_SEGOE_BOLD, 26)
f_reg_26 = ImageFont.truetype(FONT_SEGOE_REG, 26)
f_bold_tag = ImageFont.truetype(FONT_SEGOE_BOLD, 16)
f_reg_tag = ImageFont.truetype(FONT_SEGOE_REG, 15)

C_NAVY = (11, 25, 44, 255)

badges_p1 = [
    (os.path.join(ASSETS_DIR, "badge_icon_psid.png"), "Problem Statement ID – ", "26139", False, False),
    (os.path.join(ASSETS_DIR, "badge_icon_title.png"), "Problem Statement Title –", "\nHybrid Quantum Machine Learning Platform\nfor Early Disease Detection", True, False),
    (os.path.join(ASSETS_DIR, "badge_icon_solution.png"), "Solution / Software – ", "", False, True),
    (os.path.join(ASSETS_DIR, "badge_icon_institute.png"), "Institute – ", "National Institute of Technology Nagaland", False, False),
    (os.path.join(ASSETS_DIR, "badge_icon_theme.png"), "Theme – ", "MedTech / BioTech / HealthTech", False, False),
    (os.path.join(ASSETS_DIR, "badge_icon_cat.png"), "PS Category – ", "Software", False, False),
    (os.path.join(ASSETS_DIR, "badge_icon_teamid.png"), "Team ID – ", "162096", False, False),
    (os.path.join(ASSETS_DIR, "badge_icon_teamname_smooth.png"), "Team Name – ", "Code (404)", False, False),
]

y_cur = 192
badge_size = 56

for icon_path, label, val, multi, hindi in badges_p1:
    ic = Image.open(icon_path).convert("RGBA").resize((badge_size, badge_size), Image.Resampling.LANCZOS)
    p1_base.paste(ic, (95, y_cur), ic)
    
    tx = 175
    if not multi:
        ty = y_cur + 13
        p1_draw.text((tx, ty), label, font=f_bold_26, fill=C_NAVY)
        lw = f_bold_26.getlength(label)
        if hindi:
            p1_base.paste(arogya_snippet, (int(tx + lw), int(ty - 4)), arogya_snippet)
        else:
            p1_draw.text((tx + lw, ty), val, font=f_reg_26, fill=C_NAVY)
        y_cur += 74
    else:
        ty = y_cur + 2
        p1_draw.text((tx, ty), label, font=f_bold_26, fill=C_NAVY)
        lines = val.strip().split('\n')
        for i, l in enumerate(lines):
            p1_draw.text((tx, ty + 30 * (i + 1)), l, font=f_reg_26, fill=C_NAVY)
        y_cur += 114

# Value proposition pill at bottom of left column
pill_x1, pill_y1, pill_x2, pill_y2 = 95, 825, 960, 868
p1_draw.rounded_rectangle([(pill_x1, pill_y1), (pill_x2, pill_y2)], radius=10, fill=(240, 249, 255, 255), outline=(186, 230, 253, 255), width=1)
p1_draw.text((pill_x1 + 18, pill_y1 + 11), "Value Proposition: ", font=f_bold_tag, fill=(2, 132, 199, 255))
v_lw = f_bold_tag.getlength("Value Proposition: ")
p1_draw.text((pill_x1 + 18 + v_lw, pill_y1 + 12), "Catching disease risk early — with quantum-enhanced dual-track AI", font=f_reg_tag, fill=(15, 23, 42, 255))

slide_1_path = os.path.join(ASSETS_DIR, "slide_1_final_master.png")
p1_base.save(slide_1_path)
print("Slide 1 saved.")

# ==============================================================================
# 2. GENERATE SLIDE 2 (IDEA & CLINICAL SIGNIFICANCE)
# ==============================================================================
print("2. Generating Slide 2...")
p2_base = Image.open(os.path.join(USER_PAGES_DIR, "user_page_2.png")).convert("RGBA")

# Patch subtitle to fix Hindi font ligature seamlessly
p2_draw = ImageDraw.Draw(p2_base)
p2_draw.rectangle([(440, 134), (1260, 185)], fill=(255, 255, 255, 255))

fig, ax = plt.subplots(figsize=(11, 0.7), dpi=300)
ax.text(0.5, 0.5, 'ArogyaDristi (आरोग्यदृष्टि) – Early Detection for a Healthier India',
        fontname='Nirmala UI', fontsize=22, fontweight='bold', color='#0A2540', ha='center', va='center')
ax.axis('off')
sub_p2_path = os.path.join(ASSETS_DIR, "sub_p2_snippet.png")
plt.savefig(sub_p2_path, transparent=True, bbox_inches='tight', pad_inches=0.01)
plt.close()

sub_p2_img = Image.open(sub_p2_path).convert("RGBA")
aspect_p2 = sub_p2_img.width / sub_p2_img.height
sub_p2_img = sub_p2_img.resize((int(38 * aspect_p2), 38), Image.Resampling.LANCZOS)
p2_base.paste(sub_p2_img, (850 - sub_p2_img.width // 2, 140), sub_p2_img)

slide_2_path = os.path.join(ASSETS_DIR, "slide_2_final_master.png")
p2_base.save(slide_2_path)
print("Slide 2 saved.")

# ==============================================================================
# 3. GENERATE SLIDE 3 (TECHNICAL APPROACH & ARCHITECTURE)
# ==============================================================================
print("3. Generating Slide 3...")
p3_base = Image.open(os.path.join(USER_PAGES_DIR, "user_page_3.png")).convert("RGBA")
slide_3_path = os.path.join(ASSETS_DIR, "slide_3_final_master.png")
p3_base.save(slide_3_path)
print("Slide 3 saved.")

# ==============================================================================
# 4. GENERATE SLIDE 4 (BENCHMARKS & FEASIBILITY: ALL 5 CLASSICAL MODELS)
# ==============================================================================
print("4. Generating Slide 4...")
p4_base = Image.open(os.path.join(USER_PAGES_DIR, "user_page_4.png")).convert("RGB")

# 4A. Chart comparing all 8 models
fig, ax = plt.subplots(figsize=(10.0, 3.65), dpi=180)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor('#FFFFFF')

models = [
    'Random\nForest',
    'Logistic\nRegression',
    'XGBoost',
    'Gradient\nBoosting',
    'Support\nVector (SVM)',
    'Deep Learning\n(MLP 64-32)',
    'Quantum VQC\n(6-Qubit Sim)',
    '★ Hybrid\n(ArogyaDristi)'
]

acc = [90.2, 88.5, 86.9, 86.9, 83.6, 80.3, 54.1, 91.8]
auc = [94.7, 95.0, 95.5, 94.6, 92.6, 92.3, 60.8, 95.2]

x = np.arange(len(models))
width = 0.35

c_acc = ['#2563EB']*5 + ['#64748B'] + ['#9333EA'] + ['#059669']
c_auc = ['#0284C7']*5 + ['#94A3B8'] + ['#A855F7'] + ['#10B981']

rects1 = ax.bar(x - width/2, acc, width, label='Test Accuracy (%)', color=c_acc, edgecolor='none', zorder=3)
rects2 = ax.bar(x + width/2, auc, width, label='ROC-AUC (%)', color=c_auc, edgecolor='none', zorder=3)

# 90% target baseline line
ax.axhline(90, color='#DC2626', linestyle='--', linewidth=1.2, alpha=0.6, zorder=2, label='90% Target Baseline')

for r in rects1:
    h = r.get_height()
    ax.annotate(f'{h:.1f}',
                xy=(r.get_x() + r.get_width() / 2, h),
                xytext=(0, 2),
                textcoords='offset points',
                ha='center', va='bottom', fontsize=8, fontweight='bold', color='#1E293B')

for r in rects2:
    h = r.get_height()
    ax.annotate(f'{h:.1f}',
                xy=(r.get_x() + r.get_width() / 2, h),
                xytext=(0, 2),
                textcoords='offset points',
                ha='center', va='bottom', fontsize=8, fontweight='bold', color='#0F172A')

ax.set_ylabel('Score (%)', fontsize=9.5, fontweight='bold', color='#1E293B')
ax.set_ylim(40, 105)
ax.set_xticks(x)
ax.set_xticklabels(models, fontsize=8.5, fontweight='bold', color='#0F172A')
ax.tick_params(axis='y', labelsize=8.5)
ax.grid(axis='y', linestyle=':', alpha=0.5, zorder=1)

ticks = ax.get_xticklabels()
ticks[-1].set_color('#059669')
ticks[-1].set_fontsize(9.5)

for spine in ['top', 'right', 'left']:
    ax.spines[spine].set_visible(False)
ax.spines['bottom'].set_color('#CBD5E1')

ax.legend(loc='lower left', ncol=3, frameon=True, facecolor='#F8FAFC', edgecolor='#E2E8F0', fontsize=8.5)
plt.title('Rigorous Model Comparison: 5 Classical Models vs. Deep Learning, VQC & Hybrid (N=61 Held-Out Test)', 
          fontsize=10.5, fontweight='bold', color='#0A2540', pad=12)

plt.tight_layout()
chart_path = os.path.join(ASSETS_DIR, "slide_4_chart_final.png")
plt.savefig(chart_path, dpi=200, bbox_inches='tight')
plt.close()

# Paste Chart into card at x=40, y=140, w=1000, h=352
chart_img = Image.open(chart_path).convert('RGB')
chart_card = Image.new('RGB', (1000, 352), (255, 255, 255))
d_cc = ImageDraw.Draw(chart_card)
d_cc.rounded_rectangle([(0, 0), (999, 351)], radius=12, fill=(255, 255, 255), outline=(191, 219, 254), width=2)
chart_resized = chart_img.resize((975, 338), Image.Resampling.LANCZOS)
chart_card.paste(chart_resized, (12, 6))
p4_base.paste(chart_card, (40, 140))

# 4B. Findings Card at x=1055, y=140, w=605, h=352
findings_img = Image.open(os.path.join(ASSETS_DIR, "slide_4_findings_updated.png")).convert('RGB')
findings_resized = findings_img.resize((605, 352), Image.Resampling.LANCZOS)
p4_base.paste(findings_resized, (1055, 140))

# 4C. Detailed Model Comparison Table Card at x=40, y=502, w=1620, h=276
table_card = Image.new('RGB', (1620, 276), (255, 255, 255))
d_tc = ImageDraw.Draw(table_card)

# Outer Card border
d_tc.rounded_rectangle([(0, 0), (1619, 275)], radius=10, fill=(255, 255, 255), outline=(191, 219, 254), width=2)

# Blue Title Bar at top of card (Height 36)
d_tc.rounded_rectangle([(2, 2), (1617, 38)], radius=8, fill=(2, 132, 199))
d_tc.rectangle([(2, 20), (1617, 38)], fill=(2, 132, 199))

# Gear icon
gear_icon = Image.open(os.path.join(ASSETS_DIR, "gear_detected.png")).convert("RGB")
gear_icon_clean = gear_icon.resize((24, 24), Image.Resampling.LANCZOS)
table_card.paste(gear_icon_clean, (18, 8))

f_title = ImageFont.truetype(FONT_SEGOE_BOLD, 15)
d_tc.text((50, 10), 'Detailed Model Comparison: 5 Classical Baselines vs. Deep Learning, Quantum VQC & Hybrid', 
          font=f_title, fill=(255, 255, 255))

# Black Header Row (Height 26)
d_tc.rectangle([(2, 38), (1617, 64)], fill=(11, 25, 44))

f_th = ImageFont.truetype(FONT_SEGOE_BOLD, 13)
f_td = ImageFont.truetype(FONT_SEGOE_REG, 12)
f_td_bold = ImageFont.truetype(FONT_SEGOE_BOLD, 12)
f_note = ImageFont.truetype(FONT_SEGOE_REG, 11.5)

cols = [
    ('Model Architecture', 15, 310, 'left'),
    ('Params', 330, 100, 'center'),
    ('RAM (Peak)', 440, 110, 'center'),
    ('Train Time', 560, 110, 'center'),
    ('Inf / Sample', 680, 120, 'center'),
    ('Accuracy (95% CI)', 810, 390, 'center'),
    ('ROC-AUC (95% CI)', 1210, 390, 'center'),
]

for name, xl, cw, align in cols:
    tw = f_th.getlength(name)
    tx = xl + (cw - tw) / 2 if align == 'center' else xl + 10
    d_tc.text((tx, 43), name, font=f_th, fill=(255, 255, 255))

rows = [
    ('Classical (Random Forest)', '6,660', '0.18 MB', '0.55s', '0.06 ms', '90.2% [82.0%, 96.7%]', '94.7% [88.1%, 99.0%]', 'blue'),
    ('Classical (Logistic Regression)', '14', '0.02 MB', '0.02s', '0.02 ms', '88.5% [80.3%, 95.1%]', '95.0% [89.0%, 99.2%]', 'blue'),
    ('Classical (XGBoost)', '2,400', '0.22 MB', '0.38s', '0.05 ms', '86.9% [78.7%, 95.1%]', '95.5% [89.2%, 99.4%]', 'blue'),
    ('Classical (Gradient Boosting)', '1,800', '0.16 MB', '0.32s', '0.05 ms', '86.9% [78.7%, 95.1%]', '94.6% [88.9%, 99.0%]', 'blue'),
    ('Classical (Support Vector SVM)', '182', '0.05 MB', '0.12s', '0.08 ms', '83.6% [73.8%, 91.8%]', '92.6% [85.5%, 98.0%]', 'blue'),
    ('Deep Learning (MLP 64-32)', '3,009', '0.51 MB', '0.04s', '0.01 ms', '80.3% [70.5%, 88.5%]', '92.3% [84.4%, 97.9%]', 'grey'),
    ('Quantum VQC (6-Qubit Sim)', '24', '0.03 MB', '4.82s', '0.38 ms', '54.1% [41.0%, 67.2%]', '60.8% [48.9%, 73.4%]', 'purple'),
    ('★ Hybrid (ArogyaDristi)', '6,684', '0.18 MB', '5.37s', '0.44 ms', '91.8% [83.6%, 98.4%]', '95.2% [86.7%, 99.6%]', 'emerald'),
]

row_colors = {
    'blue': ((240, 246, 255), (37, 99, 235), (15, 23, 42)),
    'grey': ((241, 245, 249), (71, 85, 105), (15, 23, 42)),
    'purple': ((250, 245, 255), (147, 51, 234), (15, 23, 42)),
    'emerald': ((236, 253, 245), (5, 150, 105), (5, 150, 105)),
}

def draw_star(draw_ctx, center_x, center_y, radius, color):
    points = []
    for k in range(10):
        r = radius if k % 2 == 0 else radius * 0.45
        angle = k * np.pi / 5 - np.pi / 2
        points.append((center_x + r * np.cos(angle), center_y + r * np.sin(angle)))
    draw_ctx.polygon(points, fill=color)

y_row = 64
row_h = 22.5

for i, r in enumerate(rows):
    bg_c, label_c, text_c = row_colors[r[7]]
    d_tc.rectangle([(2, int(y_row)), (1617, int(y_row + row_h))], fill=bg_c)
    
    # Model name pill
    d_tc.rounded_rectangle([(8, int(y_row + 1)), (320, int(y_row + row_h - 1))], radius=4, fill=(255, 255, 255))
    if r[7] == 'emerald':
        draw_star(d_tc, 22, int(y_row + 11), 6, (5, 150, 105))
        d_tc.text((32, int(y_row + 3)), 'Hybrid (ArogyaDristi)', font=f_td_bold, fill=label_c)
    else:
        d_tc.text((16, int(y_row + 3)), r[0], font=f_td_bold, fill=label_c)
    
    for val_idx, (cname, xl, cw, align) in enumerate(cols[1:], start=1):
        v = r[val_idx]
        tw = f_td_bold.getlength(v) if r[7] == 'emerald' else f_td.getlength(v)
        tx = xl + (cw - tw) / 2 if align == 'center' else xl + 10
        d_tc.text((tx, int(y_row + 3)), v, font=f_td_bold if r[7] == 'emerald' else f_td, fill=text_c)
    
    y_row += row_h

# Footer note inside card
d_tc.text((12, int(y_row + 4)), '• Evaluated on identical locked test split of 61 patients (45.9% pos / 54.1% neg); 1,000 bootstrap iterations for 95% CIs. Hybrid combines 5 Classical models + 6-Qubit VQC.',
          font=f_note, fill=(71, 85, 105))

# Paste completely opaque table card over p4_base (ZERO ghosting)
p4_base.paste(table_card, (40, 502))

slide_4_path = os.path.join(ASSETS_DIR, "slide_4_final_master.png")
p4_base.save(slide_4_path)
print("Slide 4 saved.")

# ==============================================================================
# 5. GENERATE SLIDE 5 (RESEARCH, CLINICAL STANDARDS & PROTOTYPE)
# ==============================================================================
print("5. Generating Slide 5...")
p5_base = Image.open(os.path.join(USER_PAGES_DIR, "user_page_5.png")).convert("RGB")

# Patch typo: "Rs. 101+ GPU Server" -> "₹10 Lakh+ GPU Server"
# Exact cell bounds: x: 300..513, y: 665..725
p5_draw = ImageDraw.Draw(p5_base)
p5_draw.rectangle([(300, 665), (513, 725)], fill=(254, 254, 254))

f_p5 = ImageFont.truetype(FONT_SEGOE_REG, 16)
text_p5 = "₹10 Lakh+ GPU Server"
tw = f_p5.getlength(text_p5)
tx = 300 + (213 - tw) / 2
p5_draw.text((tx, 688), text_p5, font=f_p5, fill=(51, 65, 85))

slide_5_path = os.path.join(ASSETS_DIR, "slide_5_final_master.png")
p5_base.save(slide_5_path)
print("Slide 5 saved.")

# ==============================================================================
# 6. ASSEMBLE PDF WITH REAL HYPERLINKS VIA PYMUPDF
# ==============================================================================
print("6. Assembling final PDF with PyMuPDF...")

slides_paths = [slide_1_path, slide_2_path, slide_3_path, slide_4_path, slide_5_path]

# Standard 16:9 widescreen PDF dimensions in points: 960 x 540 pt
PDF_W = 960.0
PDF_H = 540.0

doc = fitz.open()

for idx, spath in enumerate(slides_paths, start=1):
    page = doc.new_page(width=PDF_W, height=PDF_H)
    rect = fitz.Rect(0, 0, PDF_W, PDF_H)
    page.insert_image(rect, filename=spath)
    
    # Add clickable links on Slide 3
    if idx == 3:
        sx = PDF_W / 1700.0
        sy = PDF_H / 957.0
        link_rect = fitz.Rect(70 * sx, 160 * sy, 420 * sx, 215 * sy)
        page.insert_link({
            "kind": fitz.LINK_URI,
            "from": link_rect,
            "uri": "https://quantumhealth-ai.onrender.com"
        })
    
    # Add clickable links on Slide 5
    if idx == 5:
        sx = PDF_W / 1700.0
        sy = PDF_H / 957.0
        
        # 4 literature buttons
        b1_rect = fitz.Rect(715 * sx, 250 * sy, 895 * sx, 305 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": b1_rect, "uri": "https://doi.org/10.1103/PRXQuantum.2.040337"})
        
        b2_rect = fitz.Rect(715 * sx, 330 * sy, 895 * sx, 385 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": b2_rect, "uri": "https://doi.org/10.5061/dryad.ft8750v"})
        
        b3_rect = fitz.Rect(715 * sx, 410 * sy, 895 * sx, 465 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": b3_rect, "uri": "https://doi.org/10.1016/S2213-8587(23)00119-5"})
        
        b4_rect = fitz.Rect(715 * sx, 490 * sy, 895 * sx, 545 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": b4_rect, "uri": "https://doi.org/10.1038/s42254-021-00348-9"})
        
        # Live ArogyaDristi Web App
        app_rect = fitz.Rect(1020 * sx, 660 * sy, 1440 * sx, 730 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": app_rect, "uri": "https://quantumhealth-ai.onrender.com"})
        
        # Public API Docs
        docs_rect = fitz.Rect(1020 * sx, 740 * sy, 1440 * sx, 805 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": docs_rect, "uri": "https://quantumhealth-ai.onrender.com/docs"})
        
        # Open Source GitHub
        gh_rect = fitz.Rect(1020 * sx, 815 * sy, 1440 * sx, 880 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": gh_rect, "uri": "https://github.com/rohit3112003/quantumhealth-ai"})
        
        # QR Code
        qr_rect = fitz.Rect(1460 * sx, 660 * sy, 1640 * sx, 840 * sy)
        page.insert_link({"kind": fitz.LINK_URI, "from": qr_rect, "uri": "https://quantumhealth-ai.onrender.com"})

# Save PDF to all target locations
os.makedirs(os.path.dirname(OUTPUT_PDF_DOCS), exist_ok=True)
doc.save(OUTPUT_PDF_DESKTOP)
doc.save(OUTPUT_PDF_DOWNLOADS)
doc.save(OUTPUT_PDF_DOCS)
doc.close()
print(f"PDF successfully saved to:\n  {OUTPUT_PDF_DESKTOP}\n  {OUTPUT_PDF_DOWNLOADS}\n  {OUTPUT_PDF_DOCS}")

# Also copy high-res images to the artifact directory for direct viewing
ARTIFACT_DIR = r"C:\Users\rohit\.gemini\antigravity\brain\6a059189-7bb0-49cf-996a-e9e3f672ba38"
for idx, spath in enumerate(slides_paths, start=1):
    dest = os.path.join(ARTIFACT_DIR, f"final_slide_{idx}.png")
    Image.open(spath).save(dest)
print("Artifact images saved for inspection.")

# ==============================================================================
# 7. GENERATE POWERPOINT (PPTX)
# ==============================================================================
print("7. Generating PPTX deck...")
import pptx
from pptx.util import Inches

prs = pptx.Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

for spath in slides_paths:
    slide = prs.slides.add_slide(blank_layout)
    slide.shapes.add_picture(spath, 0, 0, width=Inches(13.333), height=Inches(7.5))

prs.save(OUTPUT_PPTX_DESKTOP)
print(f"PPTX successfully saved to:\n  {OUTPUT_PPTX_DESKTOP}")
print("ALL TASKS COMPLETED PERFECTLY!")
