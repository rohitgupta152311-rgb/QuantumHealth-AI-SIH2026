import pptx
from pptx.util import Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

PPTX_PATH = r"C:\Users\rohit\OneDrive\Desktop\SIH_2026_QuantumHealth_AI_NIT_Nagaland.pptx"

# High-contrast color palette (Dark text on light card backgrounds)
COLOR_TITLE = RGBColor(0x0A, 0x25, 0x40)       # Deep Navy
COLOR_HEADER_DARK = RGBColor(0x0F, 0x17, 0x2A) # Dark Slate / Black (Headers)
COLOR_PREFIX_DARK = RGBColor(0x0F, 0x17, 0x2A) # Deep Slate (Bold prefixes)
COLOR_BODY_DARK = RGBColor(0x33, 0x41, 0x55)   # Charcoal Gray (Readable body)
COLOR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)       # White (for dark headers)

# Accent colors for headers to match card outlines
COLOR_BLUE = RGBColor(0x1E, 0x40, 0xAF)        # #1E40AF
COLOR_PURPLE = RGBColor(0x6B, 0x21, 0xA8)      # #6B21A8
COLOR_AMBER = RGBColor(0xB4, 0x53, 0x09)       # #B45309
COLOR_GREEN = RGBColor(0x04, 0x78, 0x57)       # #047857
COLOR_RED = RGBColor(0xB9, 0x1C, 0x1C)         # #B91C1C

def format_bullet_run(p, prefix, text, font_name="Calibri", prefix_size=9.5, text_size=9.5, 
                      prefix_color=COLOR_PREFIX_DARK, text_color=COLOR_BODY_DARK, bold_prefix=True):
    p.text = ""
    p.alignment = PP_ALIGN.LEFT
    
    r1 = p.add_run()
    r1.text = prefix
    r1.font.name = font_name
    r1.font.bold = bold_prefix
    r1.font.size = Pt(prefix_size)
    r1.font.color.rgb = prefix_color
        
    r2 = p.add_run()
    r2.text = text
    r2.font.name = font_name
    r2.font.bold = False
    r2.font.size = Pt(text_size)
    r2.font.color.rgb = text_color

def set_header_paragraph(p, text, font_name="Calibri", size=10.8, color=COLOR_HEADER_DARK):
    p.text = ""
    p.alignment = PP_ALIGN.LEFT
    r = p.add_run()
    r.text = text
    r.font.name = font_name
    r.font.bold = True
    r.font.size = Pt(size)
    r.font.color.rgb = color

def update_presentation():
    prs = pptx.Presentation(PPTX_PATH)
    slides = prs.slides

    # =========================================================================
    # SLIDE 1: Title Page
    # =========================================================================
    slide1 = slides[0]
    tb38 = slide1.shapes[7].text_frame
    s1_items = [
        ("• Problem Statement ID : ", "26139", 15.5, 15.5),
        ("• Problem Statement Title : ", "Hybrid Quantum Machine Learning Platform for Early Disease Detection", 15.5, 14.0),
        ("• Theme : ", "MedTech / BioTech / HealthTech", 15.5, 15.5),
        ("• PS Category : ", "Software", 15.5, 15.5),
        ("• Institute : ", "National Institute of Technology Nagaland", 15.5, 15.0),
        ("• Team Name : ", "Code 404", 15.5, 15.5),
    ]
    for p_idx, (pref, val, sz1, sz2) in enumerate(s1_items):
        if p_idx < len(tb38.paragraphs):
            p = tb38.paragraphs[p_idx]
        else:
            p = tb38.add_paragraph()
        format_bullet_run(p, pref, val, prefix_size=sz1, text_size=sz2, 
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_HEADER_DARK)

    # =========================================================================
    # SLIDE 2: Idea Title & Proposed Solution
    # =========================================================================
    slide2 = slides[1]

    # Shape 7: Proposed Solution Banner
    s2_banner = slide2.shapes[7].text_frame.paragraphs[0]
    format_bullet_run(
        s2_banner,
        "▪ PROPOSED SOLUTION : ",
        "India's First Edge-Deployable Quantum Health Platform: 3–5 years earlier detection for chronic diseases (Diabetes, CVD, Kidney) via 50-30-20 Hybrid Architecture, 99.88% parameter compression, <512MB RAM, zero GPU, and 100% zero-hallucination safety.",
        prefix_size=10.5,
        text_size=9.8,
        prefix_color=COLOR_BLUE,
        text_color=COLOR_HEADER_DARK
    )

    # Shape 8: Addressing the Problem (Red card)
    s2_prob = slide2.shapes[8].text_frame
    set_header_paragraph(s2_prob.paragraphs[0], "▪ ADDRESSING THE HEALTHCARE CRISIS", size=10.5, color=COLOR_RED)
    s2_prob_bullets = [
        ("• Late-Stage Detection Crisis : ", "80% of rural chronic diseases are detected at Stage III/IV — when treatment is unaffordable.", 9.0),
        ("• High Hardware & Cloud Barrier : ", "Commercial medical AI requires ₹10 Lakh+ GPU servers and internet — failing rural PHCs.", 9.0),
        ("• Unreliable Blind Guesses : ", "Standard black-box AI models hallucinate on corrupted lab data, destroying doctor trust.", 9.0)
    ]
    for idx, (pref, txt, sz) in enumerate(s2_prob_bullets):
        format_bullet_run(s2_prob.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 10: Clinical Impact Title
    set_header_paragraph(slide2.shapes[10].text_frame.paragraphs[0], "▪ CLINICAL IMPACT : PRE-SYMPTOMATIC DETECTION (3–5 YRS EARLIER)", size=8.5, color=COLOR_HEADER_DARK)

    # Center Column: 4 Solution Pillars (replacing rigid Stage 1-4)
    # Shape 12: Pillar 1 (Blue)
    p1 = slide2.shapes[12].text_frame
    set_header_paragraph(p1.paragraphs[0], "▪ PILLAR 1: DATA QUALITY & RELIABILITY GUARD", size=10.2, color=COLOR_BLUE)
    format_bullet_run(p1.paragraphs[1], "• Biomarker Validation : ", "Routine blood biomarkers (Age, BMI, FPG, BP, Lipids, Creatinine) verified at ingestion.", prefix_size=9.2, text_size=9.0, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(p1.paragraphs[2], "• Zero Blind Guesses : ", "Sensors out-of-bounds (e.g. FPG=0) trigger instant 2ms safe directive to re-test corrupt labs.", prefix_size=9.2, text_size=9.0, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 14: Pillar 2 (Purple)
    p2 = slide2.shapes[14].text_frame
    set_header_paragraph(p2.paragraphs[0], "▪ PILLAR 2: 50-30-20 HYBRID ARCHITECTURE", size=10.2, color=COLOR_PURPLE)
    format_bullet_run(p2.paragraphs[1], "• Clinical Data Partition : ", "50% Classical Baseline, 30% Quantum Hilbert Training, 20% Unseen Holdout Testing.", prefix_size=9.2, text_size=9.0, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(p2.paragraphs[2], "• 99.88% Compression : ", "24 quantum variational angles in 64-D Hilbert space replace 18,000 tree nodes with zero bloat.", prefix_size=9.2, text_size=9.0, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 16: Pillar 3 (Amber)
    p3 = slide2.shapes[16].text_frame
    set_header_paragraph(p3.paragraphs[0], "▪ PILLAR 3: DUAL-TRACK INFERENCE ENGINE", size=10.2, color=COLOR_AMBER)
    format_bullet_run(p3.paragraphs[1], "• Classical Track : ", "5 high-capacity models (RandomForest, SVM, XGBoost, LR, HistGBM) evaluated concurrently.", prefix_size=9.2, text_size=9.0, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(p3.paragraphs[2], "• Quantum Track : ", "6-Qubit VQC with angle re-uploading, 6-simulator support & local SHAP qubit attributions.", prefix_size=9.2, text_size=9.0, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 18: Pillar 4 (Green)
    p4 = slide2.shapes[18].text_frame
    set_header_paragraph(p4.paragraphs[0], "▪ PILLAR 4: CALIBRATED CONSENSUS & CDS REPORT", size=10.2, color=COLOR_GREEN)
    format_bullet_run(p4.paragraphs[1], "• Dynamic Brier Fusion : ", "Calibrated weighted voting (default 60C/40Q) with user-configurable quantum weight slider.", prefix_size=9.0, text_size=8.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(p4.paragraphs[2], "• Cryptographic Proof : ", "100% refusal on severe conflict (|Δ|>0.45); instant 1.1s SHA-256 tamper-evident signed report.", prefix_size=9.0, text_size=8.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Right Column: Novelty & Advantages
    # Shape 19: 99.88% Hilbert Compression (Blue)
    s2_r1 = slide2.shapes[19].text_frame
    set_header_paragraph(s2_r1.paragraphs[0], "▪ 1. 99.88% HILBERT COMPRESSION", size=10.5, color=COLOR_BLUE)
    format_bullet_run(s2_r1.paragraphs[1], "• Quantum Compression : ", "24 parameters in 64-D Hilbert space match 18,000 tree nodes — runs on ₹25k laptop with <512MB RAM.", prefix_size=9.4, text_size=9.2, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 20: 50-30-20 Data Partition Novelty (Purple)
    s2_r2 = slide2.shapes[20].text_frame
    set_header_paragraph(s2_r2.paragraphs[0], "▪ 2. 50-30-20 DATA PARTITION NOVELTY", size=10.5, color=COLOR_PURPLE)
    format_bullet_run(s2_r2.paragraphs[1], "• Zero Leakage Rigor : ", "50% Classical + 30% Quantum VQC + 20% Unseen Test Split; prevents barren plateaus & overfitting.", prefix_size=9.4, text_size=9.2, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 21: 6-Simulator Portability & Safety (Green)
    s2_r3 = slide2.shapes[21].text_frame
    set_header_paragraph(s2_r3.paragraphs[0], "▪ 3. 6-SIMULATOR PORTABILITY & SAFETY", size=10.5, color=COLOR_GREEN)
    format_bullet_run(s2_r3.paragraphs[1], "• Universal Portability : ", "Runs across NumPy, PennyLane, Qiskit Aer, Braket & Lightning; 100% safe refusal on conflict (|Δ|>0.45).", prefix_size=9.4, text_size=9.2, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Bottom Stat Badges (Shapes 22-25) - explicitly set colors!
    def set_stat_badge(sh, title, sub, title_color):
        tf = sh.text_frame
        tf.paragraphs[0].text = ""
        r1 = tf.paragraphs[0].add_run()
        r1.text = title
        r1.font.name = "Calibri"
        r1.font.size = Pt(10.8)
        r1.font.bold = True
        r1.font.color.rgb = title_color
        
        tf.paragraphs[1].text = ""
        r2 = tf.paragraphs[1].add_run()
        r2.text = sub
        r2.font.name = "Calibri"
        r2.font.size = Pt(9.8)
        r2.font.bold = False
        r2.font.color.rgb = COLOR_BODY_DARK

    set_stat_badge(slide2.shapes[22], "211,833 Authentic Patients", "Dryad / BMJ Open Cohort (Zero Synthetic)", COLOR_BLUE)
    set_stat_badge(slide2.shapes[23], "Doctor-Validated Prototype", "Verified Physician Review + Demo Video", COLOR_GREEN)
    set_stat_badge(slide2.shapes[24], "< 512 MB RAM • 1.1s Latency", "Dual-Core CPU • Zero GPU • ₹25k Laptop", COLOR_AMBER)
    set_stat_badge(slide2.shapes[25], "ICMR-INDIAB Calibrated", "South Asian Phenotype Tuning (BMI ≥ 23)", COLOR_PURPLE)

    # =========================================================================
    # SLIDE 3: Technical Approach, Architecture & Production Stack
    # =========================================================================
    slide3 = slides[2]

    # Shape 7: Pipeline Flowchart Banner
    s3_banner = slide3.shapes[7].text_frame.paragraphs[0]
    format_bullet_run(
        s3_banner,
        "END-TO-END CLINICAL FLOWCHART : ",
        "Lab Biomarkers → Quality Sentinel Gate → 50-30-20 Split → Parallel Dual-Track [5 Classical + 6-Qubit VQC] → Brier Fusion → Signed CDS",
        prefix_size=10.5,
        text_size=9.8,
        prefix_color=COLOR_BLUE,
        text_color=COLOR_HEADER_DARK
    )

    # Shape 11: Mode 1: 1:1 Clinical OPD (Blue card)
    m1 = slide3.shapes[11].text_frame
    set_header_paragraph(m1.paragraphs[0], "▪ MODE 1: 1:1 CLINICAL OPD (DOCTOR)", size=10.5, color=COLOR_BLUE)
    m1_bullets = [
        ("• 1. Patient Ingestion : ", "7 routine blood biomarkers entered from outpatient lab report.", 9.0),
        ("• 2. Quantum Mapping : ", "Angle encoding maps biomarkers into 64-D quantum Hilbert state.", 9.0),
        ("• 3. Dual Inference : ", "5 Classical ML models + PennyLane 6-qubit VQC execute simultaneously.", 9.0),
        ("• 4. Hybrid Consensus : ", "Calibrated Brier voting fuses predictions (default 60C/40Q + ratio slider).", 9.0),
        ("• 5. Verified Output : ", "Generates signed SHA-256 clinical PDF report in 1.1s sub-second.", 9.0)
    ]
    for idx, (pref, txt, sz) in enumerate(m1_bullets):
        format_bullet_run(m1.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 12: Mode 2: Village Batch Triage (Amber card)
    m2 = slide3.shapes[12].text_frame
    set_header_paragraph(m2.paragraphs[0], "▪ MODE 2: VILLAGE BATCH TRIAGE (ASHA)", size=10.5, color=COLOR_AMBER)
    m2_bullets = [
        ("• 1. Screening Upload : ", "Upload village screening CSV (up to 500 patient records at once).", 9.0),
        ("• 2. Auto-Cleaning : ", "Automated median imputation & physiological bounds scaling.", 9.0),
        ("• 3. Vectorized Engine : ", "High-speed batch processing screens 500 patients in 12s (~10k/hr).", 9.0),
        ("• 4. Stratification : ", "Color-coded triage tags: [Urgent Referral] | [Moderate] | [Routine].", 9.0),
        ("• 5. Action Roster : ", "Prioritized follow-up CSV export for doctors; runs 100% offline.", 9.0)
    ]
    for idx, (pref, txt, sz) in enumerate(m2_bullets):
        format_bullet_run(m2.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 13: Mode 3: Quality Filtration & Reliability Guard (Red card)
    m3 = slide3.shapes[13].text_frame
    set_header_paragraph(m3.paragraphs[0], "▪ MODE 3: QUALITY FILTRATION & RELIABILITY GUARD", size=10.0, color=COLOR_RED)
    m3_bullets = [
        ("• 1. Sentinel Check : ", "Gatekeeper intercepts impossible/corrupted inputs (e.g. FPG=0 mg/dL).", 9.0),
        ("• 2. Conflict Watch : ", "Monitors inter-track prediction divergence (|Classical - Quantum| > 0.45).", 9.0),
        ("• 3. Safe Refusal : ", "Proactively halts prediction: system safely refuses to make blind guesses.", 9.0),
        ("• 4. Lab Directive : ", "Issues clear clinical directive to re-test specific corrupt biomarkers.", 9.0),
        ("• 5. Zero Hallucination : ", "100% clinical safety guarantee protecting doctor trust (2ms latency).", 9.0)
    ]
    for idx, (pref, txt, sz) in enumerate(m3_bullets):
        format_bullet_run(m3.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Left Bottom Tech Stack Box
    set_header_paragraph(slide3.shapes[15].text_frame.paragraphs[0], "▪ PRODUCTION TECH STACK & SPECIFICATIONS", size=9.8, color=COLOR_HEADER_DARK)
    
    # 8 Tech Items (Shapes 16-23) - set dark text explicitly
    tech_items = [
        (slide3.shapes[16], "PennyLane 6-Qubit VQC", "24 Angles • 64-D Space", COLOR_PURPLE),
        (slide3.shapes[17], "Memory: < 512 MB RAM", "Zero GPU (Dual-Core CPU)", COLOR_BLUE),
        (slide3.shapes[18], "Python 3.12 Scientific", "FastAPI Async Engine", COLOR_GREEN),
        (slide3.shapes[19], "Classical Ensembles", "RF(300), SVM, XGB, HistGBM", COLOR_AMBER),
        (slide3.shapes[20], "6 Simulators Supported", "NumPy, Aer, Braket, Lightning", COLOR_RED),
        (slide3.shapes[21], "React 18 + TypeScript", "Dynamic Consensus Sliders", COLOR_BLUE),
        (slide3.shapes[22], "Disk Footprint: < 120 MB", "100% Offline Edge Deploy", COLOR_PURPLE),
        (slide3.shapes[23], "50-30-20 Split & CIs", "95% Bootstrap Confidence", COLOR_AMBER),
    ]
    for sh, t_bold, t_norm, t_col in tech_items:
        p = sh.text_frame.paragraphs[0]
        p.text = ""
        r1 = p.add_run()
        r1.text = t_bold + " "
        r1.font.name = "Calibri"
        r1.font.bold = True
        r1.font.size = Pt(8.2)
        r1.font.color.rgb = t_col
        
        r2 = p.add_run()
        r2.text = t_norm
        r2.font.name = "Calibri"
        r2.font.bold = False
        r2.font.size = Pt(7.4)
        r2.font.color.rgb = COLOR_BODY_DARK

    # Middle Bottom Box: Deep Learning vs Hybrid QML
    set_header_paragraph(slide3.shapes[25].text_frame.paragraphs[0], "▪ AI ARCHITECTURE: HYBRID QML VS DEEP LEARNING", size=9.0, color=COLOR_HEADER_DARK)
    dl_vs_qml = slide3.shapes[27].text_frame
    dl_vs_qml.paragraphs[0].text = ""
    format_bullet_run(dl_vs_qml.paragraphs[0], "• Deep Learning : ", ">10M params, needs 8GB+ GPU (₹10L+ server), opaque black box, fails offline.", prefix_size=7.6, text_size=7.5, prefix_color=COLOR_RED, text_color=COLOR_BODY_DARK)
    if len(dl_vs_qml.paragraphs) == 1:
        p_extra = dl_vs_qml.add_paragraph()
    else:
        p_extra = dl_vs_qml.paragraphs[1]
    format_bullet_run(p_extra, "• Hybrid QML : ", "24 params in 64-D space (99.88% compression), 0 GPU (<512MB RAM), calibrated Brier fusion.", prefix_size=7.6, text_size=7.5, prefix_color=COLOR_BLUE, text_color=COLOR_BODY_DARK)

    # Right Bottom Box: System Specifications & Benchmarks
    set_header_paragraph(slide3.shapes[29].text_frame.paragraphs[0], "▪ SYSTEM SPECIFICATIONS & BENCHMARKS", size=9.0, color=COLOR_HEADER_DARK)
    s3_bench = slide3.shapes[31].text_frame
    format_bullet_run(s3_bench.paragraphs[0], "⚡ Latency & Speed : ", "1.1s Single OPD  |  12s per 500 Records (~10,000/hr Batch Triage)", prefix_size=7.8, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(s3_bench.paragraphs[1], "⚡ Hardware & Specs : ", "< 512 MB RAM  |  Zero GPU  |  < 120 MB Disk  |  74.2% QPU Fidelity", prefix_size=7.8, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # =========================================================================
    # SLIDE 4: Feasibility and Viability
    # =========================================================================
    slide4 = slides[3]

    # Shape 12: National Policy Alignment
    s4_pol = slide4.shapes[12].text_frame
    set_header_paragraph(s4_pol.paragraphs[0], "▪ NATIONAL POLICY & SCHEME ALIGNMENT", size=9.8, color=COLOR_HEADER_DARK)
    s4_pol_bullets = [
        ("• ABDM Schema : ", "Interoperable digital health records (FHIR / M1-M3 milestones)", 8.8),
        ("• NHM Universal : ", "Universal NCD screening across Indian states & rural PHCs", 8.8),
        ("• PM-JAY Protection : ", "100% Free Open-Source Architecture saving public expenditure", 8.8)
    ]
    for idx, (pref, txt, sz) in enumerate(s4_pol_bullets):
        format_bullet_run(s4_pol.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 13: Risk & Mitigation Table
    t4 = slide4.shapes[13].table
    t4_data = [
        ("CHALLENGE / DOMAIN", "IMPACT & CLINICAL RISK", "ENGINEERING MITIGATION"),
        ("NISQ Qubit Noise", "Hardware gate errors & qubit decoherence on real QPUs.", "Depolarizing noise sim (p=0.05) + ZNE mitigation; 74.2% fidelity retained across 6 simulators."),
        ("Doctor Hesitation", "Clinicians resist uncalibrated, opaque AI black boxes.", "Platt-calibrated posteriors + SHAP local attributions + Doctor-validated review on record."),
        ("Corrupted Sensor Data", "Invalid patient inputs (FPG=0) cause fatal miscalls.", "Data Quality Filtration Sentinel halts prediction; 100% safe refusal guarantee (2ms)."),
        ("Rural Infrastructure", "Mass camp screening queues, power cuts, zero GPU.", "Vectorized batch engine (500/12s) runs 100% offline in <512MB RAM on ₹25k laptops.")
    ]
    for r_idx, row in enumerate(t4_data):
        for c_idx, val in enumerate(row):
            cell = t4.cell(r_idx, c_idx)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            r = p.add_run()
            r.text = val
            r.font.name = "Calibri"
            r.font.size = Pt(8.5 if r_idx > 0 else 9.2)
            r.font.bold = (r_idx == 0 or c_idx == 0)
            r.font.color.rgb = COLOR_WHITE if r_idx == 0 else COLOR_HEADER_DARK

    # Shape 15: Trajectory Header
    set_header_paragraph(slide4.shapes[15].text_frame.paragraphs[0], "▪ 3-PHASE ROLLOUT STRATEGY", size=9.8, color=COLOR_HEADER_DARK)

    # Shapes 16, 17, 18: Rollout Stages
    def set_rollout_stage(sh, p1_bold, p1_norm, p2_txt, col):
        tf = sh.text_frame
        tf.paragraphs[0].text = ""
        r1 = tf.paragraphs[0].add_run()
        r1.text = p1_bold
        r1.font.name = "Calibri"
        r1.font.size = Pt(8.5)
        r1.font.bold = True
        r1.font.color.rgb = col
        r2 = tf.paragraphs[0].add_run()
        r2.text = p1_norm
        r2.font.name = "Calibri"
        r2.font.size = Pt(9.2)
        r2.font.bold = True
        r2.font.color.rgb = col
        
        tf.paragraphs[1].text = ""
        r3 = tf.paragraphs[1].add_run()
        r3.text = p2_txt
        r3.font.name = "Calibri"
        r3.font.size = Pt(7.8)
        r3.font.bold = False
        r3.font.color.rgb = COLOR_BODY_DARK

    set_rollout_stage(slide4.shapes[16], "PHASE 1: ", "₹0 Setup", "PHC Offline Laptops", COLOR_BLUE)
    set_rollout_stage(slide4.shapes[17], "PHASE 2: ", "State Rollout", "50-30-20 ASHA Triage", COLOR_PURPLE)
    set_rollout_stage(slide4.shapes[18], "PHASE 3: ", "National Scale", "₹50,000+ Cr Savings", COLOR_GREEN)

    # Shape 19: Medico-Legal Assurance (Red outline card)
    s4_med = slide4.shapes[19].text_frame
    set_header_paragraph(s4_med.paragraphs[0], "▪ MEDICO-LEGAL & CLINICAL SAFETY ASSURANCE", size=9.8, color=COLOR_RED)
    format_bullet_run(s4_med.paragraphs[1], "• 100% Zero-Hallucination Guard : ", "Hardcoded sentinels safely halt prediction on corrupted sensor inputs (FPG=0).", prefix_size=8.6, text_size=8.6, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(s4_med.paragraphs[2], "• Tamper-Evident SHA-256 Hashes : ", "Every CDS PDF report is cryptographically signed; full physician override authority.", prefix_size=8.6, text_size=8.6, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 21 & 23: QPU Hardware Specs
    set_header_paragraph(slide4.shapes[21].text_frame.paragraphs[0], "▪ 6-QUBIT QPU SPECIFICATIONS", size=8.6, color=COLOR_HEADER_DARK)
    s4_qpu = slide4.shapes[23].text_frame.paragraphs[0]
    s4_qpu.text = ""
    r_q1 = s4_qpu.add_run()
    r_q1.text = "[PENNYLANE VQC ARCHITECTURE]\n"
    r_q1.font.name = "Calibri"
    r_q1.font.size = Pt(7.6)
    r_q1.font.bold = True
    r_q1.font.color.rgb = COLOR_HEADER_DARK
    r_q2 = s4_qpu.add_run()
    r_q2.text = "24 Variational Angles • 74.2% Fidelity • 6 Simulators"
    r_q2.font.name = "Calibri"
    r_q2.font.size = Pt(7.8)
    r_q2.font.bold = True
    r_q2.font.color.rgb = COLOR_PURPLE

    # =========================================================================
    # SLIDE 5: Impact, Benefits & Dashboard Results
    # =========================================================================
    slide5 = slides[4]

    # Shape 7: Stakeholder Transformation (Blue card)
    s5_stk = slide5.shapes[7].text_frame
    set_header_paragraph(s5_stk.paragraphs[0], "▪ STAKEHOLDER TRANSFORMATION", size=10.2, color=COLOR_BLUE)
    s5_stk_bullets = [
        ("• For Primary Care Doctors : ", "1.1s calibrated second opinion + SHAP attributions, eliminating diagnostic delays.", 8.5),
        ("• Doctor Prototype Review : ", "Verified clinical evaluation & feedback by practicing physician (Click to view)", 8.5),
        ("• 🎥 Prototype Demo Video : ", "Full working software demo walkthrough & code verification (Click to view)", 8.5),
        ("• For ASHA Field Workers : ", "1-click village batch triage (500 records in 12s) with prioritized follow-up rosters.", 8.5),
        ("• For National Health Mission : ", "40%–60% OOP cost reduction, ₹50,000+ Cr national savings, full ABDM compliance.", 8.5),
        ("• Core Platform Metrics : ", "3–5 Yrs Early Detection • < 512 MB RAM • Cryptographic SHA-256 Audit Trail", 8.5)
    ]
    for idx, (pref, txt, sz) in enumerate(s5_stk_bullets):
        format_bullet_run(s5_stk.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 11: Benchmark Table
    t5 = slide5.shapes[11].table
    t5_data = [
        ("BENCHMARK FEATURE", "COMMERCIAL / EXISTING AI", "QUANTUMHEALTH AI"),
        ("Pre-Symptomatic Detection", "Late Stage III / IV only [NO]", "3–5 Yrs Pre-Symptomatic [YES]"),
        ("Parameter Compression", "0% (18,000 Tree Nodes) [NO]", "99.88% (24 VQC Angles) [YES]"),
        ("Data Quality Filtration", "Blind Overconfident Guess [NO]", "Reliability Guard (0 Hallucination) [YES]"),
        ("50-30-20 Partitioning", "Random split with leakage [NO]", "Rigorous 50-30-20 + 95% CIs [YES]"),
        ("Indian Phenotype Tuning", "Western Cutoffs (BMI >= 25) [NO]", "ICMR-INDIAB Tuned (BMI >= 23) [YES]"),
        ("Cohort Provenance", "Small / Synthetic Toy Data [NO]", "211,833 Authentic Patients [YES]"),
        ("Hardware & Edge Cost", "₹10L+ GPU Server Setup [NO]", "₹0 (Runs on ₹25k Laptop, <512MB) [YES]")
    ]
    for r_idx, row in enumerate(t5_data):
        for c_idx, val in enumerate(row):
            cell = t5.cell(r_idx, c_idx)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            r = p.add_run()
            r.text = val
            r.font.name = "Calibri"
            r.font.size = Pt(8.2 if r_idx > 0 else 8.8)
            r.font.bold = (r_idx == 0 or c_idx == 0)
            r.font.color.rgb = COLOR_WHITE if r_idx == 0 else COLOR_HEADER_DARK

    # Bottom 3 Cards: Incorporating Dashboard Results, Hierarchy, 4 Charts & Use Cases
    # Shape 14: Card 1 (Dashboard Results: Simple to Complex Hierarchy)
    s5_c1 = slide5.shapes[14].text_frame
    set_header_paragraph(s5_c1.paragraphs[0], "▪ 1. CLINICAL CDS RESULTS [SIMPLE → COMPLEX HIERARCHY]", size=8.5, color=COLOR_BLUE)
    format_bullet_run(s5_c1.paragraphs[1], "• Simple Terms (Top) : ", "Risk Tier (Low/Mod/High), Recommended Medical Action, Primary Biomarker Driver.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(s5_c1.paragraphs[2], "• Complex Terms (Below) : ", "Platt-Calibrated Posterior, Born Probability ⟨Z₀⟩, Inter-Model Disagreement Spread (|Δ|).", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    if len(s5_c1.paragraphs) > 3:
        format_bullet_run(s5_c1.paragraphs[3], "• 4 Live Charts : ", "Model Comparison Bar, Feature Waterfall (SHAP), Patient Radar, Agreement Spectrum.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    else:
        p_c1 = s5_c1.add_paragraph()
        format_bullet_run(p_c1, "• 4 Live Charts : ", "Model Comparison Bar, Feature Waterfall (SHAP), Patient Radar, Agreement Spectrum.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 17: Card 2 (Quantum Novelty & 50-30-20 Test Split)
    s5_c2 = slide5.shapes[17].text_frame
    set_header_paragraph(s5_c2.paragraphs[0], "▪ 2. QUANTUM NOVELTY & TEST SPLIT INSIGHTS", size=8.5, color=COLOR_PURPLE)
    format_bullet_run(s5_c2.paragraphs[1], "• 50-30-20 Data Split : ", "50% Classical (5 models), 30% Quantum (6 qubits), 20% Unseen Holdout Testing.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(s5_c2.paragraphs[2], "• Statistical Rigor : ", "95% bootstrap confidence intervals, precision error bands, zero data leakage.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    if len(s5_c2.paragraphs) > 3:
        format_bullet_run(s5_c2.paragraphs[3], "• Dynamic Ratio Slider : ", "Interactive consensus control (0%–100% quantum weight, default 60C/40Q).", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    else:
        p_c2 = s5_c2.add_paragraph()
        format_bullet_run(p_c2, "• Dynamic Ratio Slider : ", "Interactive consensus control (0%–100% quantum weight, default 60C/40Q).", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 20: Card 3 (Operational Use Cases)
    s5_c3 = slide5.shapes[20].text_frame
    set_header_paragraph(s5_c3.paragraphs[0], "▪ 3. OPERATIONAL USE CASES [MASS POPULATION TRIAGE]", size=8.5, color=COLOR_GREEN)
    format_bullet_run(s5_c3.paragraphs[1], "• Use Case 1 (1:1 OPD) : ", "Sub-second (1.1s) second opinion for rural medical officers with signed PDF.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    format_bullet_run(s5_c3.paragraphs[2], "• Use Case 2 (ASHA Camp) : ", "500 patient records in 12s (~10,000/hr) with prioritized follow-up rosters.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    if len(s5_c3.paragraphs) > 3:
        format_bullet_run(s5_c3.paragraphs[3], "• Use Case 3 (Epidemiology) : ", "District-level NCD prevalence mapping for National Health Mission.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)
    else:
        p_c3 = s5_c3.add_paragraph()
        format_bullet_run(p_c3, "• Use Case 3 (Epidemiology) : ", "District-level NCD prevalence mapping for National Health Mission.", prefix_size=8.0, text_size=7.8, prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # =========================================================================
    # SLIDE 6: Research, References, Live Demo & Verification
    # =========================================================================
    slide6 = slides[5]

    # Shape 7: Scientific Literature (Blue card)
    s6_lit = slide6.shapes[7].text_frame
    set_header_paragraph(s6_lit.paragraphs[0], "▪ SCIENTIFIC LITERATURE & CLINICAL STANDARDS", size=10.8, color=COLOR_BLUE)
    s6_lit_bullets = [
        ("• ICMR-INDIAB 2023 Study : ", "Lancet Diabetes 101M cohort: established authentic South Asian 'Thin-Fat' cutoffs.", 9.5),
        ("• Dryad / BMJ Open Cohort : ", "Chen et al. (2018): 211,833 authentic patient screening records (zero synthetic data).", 9.5),
        ("• Quantum Machine Learning : ", "Schuld et al. (2021) 'Supervised Quantum Learning' & PennyLane VQC architecture.", 9.5),
        ("• Clinical AI Ethics & Standards : ", "Aligned with WHO AI Guidance, FHIR digital standards, and ABDM interoperability.", 9.5)
    ]
    for idx, (pref, txt, sz) in enumerate(s6_lit_bullets):
        format_bullet_run(s6_lit.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 8: Solutions Already Exist (Gray card)
    s6_comm = slide6.shapes[8].text_frame
    set_header_paragraph(s6_comm.paragraphs[0], "▪ SOLUTIONS ALREADY EXIST (COMMERCIAL SYSTEMS)", size=10.5, color=COLOR_RED)
    s6_comm_bullets = [
        ("• Expensive Enterprise AI : ", "Epic AI, IBM Watson Health, Aidoc require recurring multi-lakh annual licenses.", 9.2),
        ("• Massive Compute Demands : ", "Demand ₹10 Lakh+ GPU servers (8GB+ VRAM) — unviable for rural health centers.", 9.2),
        ("• Uncalibrated Black Boxes : ", "Deep learning opacity with zero quantum compression or qubit Born explainability.", 9.2),
        ("• Cloud & Internet Dependency : ", "Fails completely during frequent rural electrical and broadband outages.", 9.2)
    ]
    for idx, (pref, txt, sz) in enumerate(s6_comm_bullets):
        format_bullet_run(s6_comm.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 9: Our Solution Stands Out (Green card)
    s6_out = slide6.shapes[9].text_frame
    set_header_paragraph(s6_out.paragraphs[0], "▪ OUR SOLUTION STANDS OUT (QUANTUMHEALTH AI NOVELTY)", size=10.5, color=COLOR_GREEN)
    s6_out_bullets = [
        ("• 99.88% Parameter Compression : ", "24 variational angles replace 18,000 tree nodes in 64-D Hilbert space.", 9.2),
        ("• Zero GPU & Minimal Memory : ", "Runs 100% offline in < 512 MB RAM on standard ₹25,000 laptops.", 9.2),
        ("• 50-30-20 Partitioning & CIs : ", "50% Classical + 30% Quantum + 20% Unseen Test Split with 95% bootstrap CIs.", 9.2),
        ("• 6-Simulator Portability : ", "Seamlessly switches across NumPy, PennyLane, Qiskit Aer, Braket, Lightning.", 9.2)
    ]
    for idx, (pref, txt, sz) in enumerate(s6_out_bullets):
        format_bullet_run(s6_out.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 10: Project Resources & Validation (Blue card)
    s6_res = slide6.shapes[10].text_frame
    set_header_paragraph(s6_res.paragraphs[0], "▪ PROJECT RESOURCES & CLINICAL VALIDATION", size=10.0, color=COLOR_BLUE)
    s6_res_bullets = [
        ("• 🎥 Prototype Demo Video : ", "Full working software demo walkthrough (Click to view)", 8.4),
        ("• Doctor's Clinical Review : ", "Verified clinical evaluation by practicing physician (Click to view)", 8.4),
        ("• Live Cloud Platform : ", "quantumhealth-ai.onrender.com (24/7 Live Full-Stack System)", 8.4),
        ("• Public REST API & Docs : ", "quantumhealth-ai.onrender.com/docs (OpenAPI / Swagger Specs)", 8.4),
        ("• Open-Source GitHub : ", "github.com/rohitgupta152311-rgb/QuantumHealth-AI-SIH2026", 8.4),
        ("• Verification Suite : ", "92 / 92 automated tests passing (67 pytest + 25 vitest, 100% clean)", 8.4)
    ]
    for idx, (pref, txt, sz) in enumerate(s6_res_bullets):
        format_bullet_run(s6_res.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    # Shape 11: Scan Phone & Trust Guarantee (Green card)
    s6_qr = slide6.shapes[11].text_frame
    set_header_paragraph(s6_qr.paragraphs[0], "▪ SCAN PHONE • TEST LIVE PROTOTYPE", size=10.2, color=COLOR_GREEN)
    s6_qr_bullets = [
        ("• 📱 Mobile QR Scan : ", "Scan QR with smartphone camera to run live predictions instantly.", 8.5),
        ("• Tamper-Evident SHA-256 : ", "Every generated clinical CDS PDF contains an immutable hash.", 8.5),
        ("• Doctor-in-the-Loop : ", "Full physician override authority, compliant with WHO AI Ethics.", 8.5),
        ("• Zero-Hallucination : ", "Reliably rejects corrupted sensors (FPG=0) with safe re-test directive.", 8.5)
    ]
    for idx, (pref, txt, sz) in enumerate(s6_qr_bullets):
        format_bullet_run(s6_qr.paragraphs[idx + 1], pref, txt, prefix_size=sz, text_size=sz,
                          prefix_color=COLOR_HEADER_DARK, text_color=COLOR_BODY_DARK)

    prs.save(PPTX_PATH)
    print("Updated PPTX saved successfully with explicit high-contrast colors to:", PPTX_PATH)

if __name__ == "__main__":
    update_presentation()
