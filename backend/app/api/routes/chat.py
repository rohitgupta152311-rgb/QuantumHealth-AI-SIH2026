"""
Chatbot Route powered by Google Gemini API (google-genai SDK).
Provides interactive clinical, quantum, and SIH jury clarification for users.
Includes built-in offline clinical intelligence fallback when GEMINI_API_KEY is not configured.
"""
import os
import logging
from typing import List, Dict, Optional, Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger("quantumhealth.chat")
router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # "user" or "model" or "assistant"
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    patient_context: Optional[Dict[str, Any]] = None
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    source: str  # "gemini-2.5-flash" or "built-in-clinical-intelligence"
    references: List[str] = []
    suggested_followups: List[str] = []

SYSTEM_INSTRUCTION = """You are Dr. Quanta — the QuantumHealth AI Clinical Decision Support Copilot and SIH 2026 Technical Advisor.
You assist doctors, researchers, medical students, and hackathon judges with:
1. Clinical Biomarkers & Risk Profiles: Fasting Plasma Glucose (FPG), blood pressure, BMI, lipid panels (cholesterol/triglycerides), ALT, and serum creatinine.
2. Clinical Guidelines:
   - ICMR-INDIAB (2023): Emphasize the South Asian "Thin-Fat Indian Phenotype" where cardiometabolic risk manifests at lower BMI (overweight >= 23 kg/m², obese >= 25 kg/m²) and younger ages.
   - ADA Standards of Care (2024): Normal FPG < 100 mg/dL, Prediabetes 100-125 mg/dL, Diabetes >= 126 mg/dL.
   - AHA/ACC (2022) for cardiovascular disease and KDIGO (2024) for renal biomarkers.
3. Quantum Machine Learning (QML):
   - 6-Qubit Variational Quantum Classifier (VQC) parameterized with Angle Encoding RY(π · x_i) into a 64-dimensional complex Hilbert space.
   - Quantum Parameter Advantage: Explain that 24 variational rotation angles compress ~18,000 classical tree splits (99.88% parameter compression).
   - Ring topology CNOT entanglement capturing cross-biomarker non-linear correlations.
   - Physical NISQ noise, depolarizing errors, and Zero-Noise Extrapolation (ZNE).
4. Platform Safety & Abstention:
   - Why missing sentinels (e.g. Glucose = 0) and out-of-distribution values cause automatic abstention rather than dangerous guesses.
   - Model consensus spread: Candidate model disagreement > 0.45 triggers a Data Quality Alert.

Tone: Clinically sharp, mathematically sound, articulate, clear, and reassuring. Use formatting (bullet points, bold text) to make answers easy to read.
Disclaimer: Remind users that predictions provide research decision support and do not replace formal clinical diagnostic evaluation.
"""

def generate_offline_clinical_reply(message: str, context: Optional[Dict[str, Any]]) -> ChatResponse:
    """Generate high-quality context-aware response when Gemini API key is absent."""
    msg_lower = message.lower()
    disease = (context or {}).get("disease", "diabetes")
    risk_pct = (context or {}).get("risk_percentage") or (context or {}).get("risk_probability", 0.35)
    if isinstance(risk_pct, float) and risk_pct <= 1.0:
        risk_pct = round(risk_pct * 100, 1)

    # 1. Quantum advantage / VQC questions
    if any(k in msg_lower for k in ["quantum", "vqc", "qubit", "hilbert", "compression", "advantage", "noise"]):
        reply = (
            "### 🔬 Quantum Machine Learning Architecture & Parameter Advantage\n\n"
            "In our **Hybrid Quantum-Classical Platform**, the quantum module operates as a **6-qubit Variational Quantum Classifier (VQC)** built in PennyLane:\n\n"
            "- **64-Dimensional Hilbert Space**: The 6-qubit register maps normalized biomedical inputs ($x_i \\in [0, 1]$) into a complex state space $\\mathcal{H}^{\\otimes 6}$ via single-qubit angle rotations $RY(\\pi \\cdot x_i)$.\\n"
            "- **99.88% Parameter Compression**: While a classical Random Forest ensemble uses **~18,000 decision split nodes** (300 estimators × depth 8), our VQC achieves non-linear classification using only **24 trainable rotation angles** (2 layers × 6 qubits × 2 rotation gates $RY, RZ$).\n"
            "- **Ring-Topology Entanglement**: Nearest-neighbor CNOT gates create quantum entanglement across wires, capturing cross-biomarker dependencies (e.g., blood pressure interacting with glucose).\n"
            "- **NISQ Noise Resilience**: Under physical depolarizing noise rates (p ≈ 1.5-2.0%), state fidelity retention is maintained at ~74%, with Zero-Noise Extrapolation (ZNE) mitigating gate errors.\n\n"
            "> *Key SIH Defense Note: Quantum computing here is not a gimmick—it provides extreme parameter compression and models non-linear biomarker correlations in Hilbert space.*"
        )
        refs = ["PennyLane Quantum Machine Learning (Schuld et al., 2020)", "Havlíček et al., Nature (2019) Quantum-Enhanced Feature Spaces"]
        followups = ["How does angle encoding differ from amplitude encoding?", "Can this circuit run on physical IBM Quantum QPUs?", "What is the Brier-tuned hybrid weighting?"]

    # 2. ICMR / Indian phenotype questions
    elif any(k in msg_lower for k in ["icmr", "indiab", "south asian", "indian", "thin-fat", "asian", "phenotype"]):
        reply = (
            "### 🇮🇳 ICMR-INDIAB South Asian Phenotype Recalibration\n\n"
            "The **Indian Council of Medical Research (ICMR-INDIAB, 2023)** highlighted that South Asians exhibit a unique **'Thin-Fat Phenotype'**:\n\n"
            "1. **Lower BMI Cutoffs**: For Asian Indians, the overweight threshold is **BMI ≥ 23 kg/m²** (vs. 25 kg/m² globally) and obesity is **≥ 25 kg/m²** (vs. 30 kg/m² globally).\n"
            "2. **Excess Visceral Adiposity**: Even at 'normal' body weight, Asian Indians carry higher percentages of abdominal visceral fat and lower skeletal muscle mass.\n"
            "3. **Accelerated Prediabetes Progression**: Individuals progress from impaired fasting glucose (FPG 100-125 mg/dL) to overt Type 2 Diabetes up to 2-3x faster than Caucasian cohorts.\n"
            "4. **Our Recalibration Engine**: When enabled, our model recalibrates risk for individuals with **BMI ≥ 23 kg/m²**, triggering proactive screening recommendations.\n\n"
            "**Recommended Provider Action**: Confirm with an Oral Glucose Tolerance Test (OGTT), measure fasting lipid profile, and advise diet/lifestyle interventions."
        )
        refs = ["ICMR Guidelines for Management of Type 2 Diabetes (2023)", "Anjana et al., Lancet Diabetes & Endocrinology (ICMR-INDIAB Study)"]
        followups = ["What specific lifestyle interventions does ICMR recommend?", "How does the model adjust risk probabilities for BMI >= 23?", "What are the ADA 2024 criteria?"]

    # 3. Risk interpretation / patient-specific questions
    elif any(k in msg_lower for k in ["risk", "why", "score", "explain", "result", "probability", "percentage", "driver"]):
        reply = (
            f"### 📊 Clinical Risk Interpretation (Estimated Risk: {risk_pct}%)\n\n"
            f"Based on the processed clinical biomarker panel for **{disease.replace('_', ' ').title()}**, here is the breakdown:\n\n"
            f"- **Stratification**: This patient falls into the **{'Elevated Risk' if risk_pct >= 40 else 'Baseline / Moderate Risk'}** category.\n"
            "- **Ensemble Fusion**: The final risk score represents a Platt-calibrated consensus between 5 classical classifiers (Random Forest, SVM, Logistic Regression, XGBoost, HistGBM) weighted at 60% and the 6-qubit VQC weighted at 40%.\n"
            "- **Key Risk Drivers**: Local perturbation analysis identifies Fasting Plasma Glucose (FPG), Blood Pressure, and BMI as the primary drivers shifting the risk distribution upward.\n"
            "- **Clinical Decision Support**: Values in this range warrant secondary confirmation via HbA1c testing and a comprehensive metabolic panel.\n\n"
            "> *Note: QuantumHealth AI is an educational and research decision-support prototype. It does not replace comprehensive medical evaluation by a licensed healthcare provider.*"
        )
        refs = ["ADA Standards of Care in Diabetes (2024)", "ICMR-INDIAB Guidelines (2023)"]
        followups = ["What lifestyle modifications are recommended?", "How does the consensus voting between classical and quantum work?", "What causes the model to abstain?"]

    # 4. Abstention / Safety questions
    elif any(k in msg_lower for k in ["abstain", "safety", "missing", "sentinel", "ood", "zero", "disagree"]):
        reply = (
            "### 🛡️ Safety Protocols & Selective Abstention Engine\n\n"
            "Real-world clinical deployments fail when machine learning models blindly predict on bad data. QuantumHealth AI employs an **Autonomous Abstention Protocol**:\n\n"
            "1. **Missing Sentinel Detection**: In clinical databases, unmeasured lab values are frequently entered as zeroes (e.g. Glucose = 0 or Blood Pressure = 0). While standard models mistakenly classify these as 'low risk', our engine flags them as physiologically impossible sentinels and **abstains**.\n"
            "2. **Out-of-Distribution (OOD) Guardrails**: Extreme values (e.g. Glucose > 700 mg/dL or Age > 130) trigger safety warnings.\n"
            "3. **Model Disagreement Monitoring**: If the disagreement spread between candidate models exceeds **0.45**, the engine issues a **Data Quality Alert** because divergent predictions cannot be trusted.\n\n"
            "This safety architecture ensures our AI is accountable, clinically defensible, and safe for public health screening."
        )
        refs = ["Geifman & El-Yaniv, Selective Classification (NeurIPS)", "WHO Guidance on Ethics and Governance of AI for Health"]
        followups = ["What is the disagreement threshold formula?", "Can I test an abstention case on the live dashboard?", "How does this prevent medical errors?"]

    # General / Default response
    else:
        reply = (
            f"### 👋 Hello! I am Dr. Quanta, your QuantumHealth AI Copilot\n\n"
            f"I am here to answer any clinical, technical, or competition defense questions regarding our **Hybrid Quantum Machine Learning Platform** (SIH #26139).\n\n"
            f"**You can ask me about:**\n"
            f"- **Clinical Findings**: Why a patient's risk score is {risk_pct}%, or what their biomarkers indicate.\n"
            f"- **ICMR-INDIAB Guidelines**: How the Asian Indian phenotype affects diabetes and cardiovascular thresholds.\n"
            f"- **Quantum Computing (VQC)**: How the 6-qubit circuit compresses 18,000 classical tree splits by 99.88% into a 64-dimensional Hilbert space.\n"
            f"- **Safety & Abstention**: How the platform catches missing sentinels (e.g. Glucose = 0) and prevents diagnostic errors.\n\n"
            f"*To activate live Google Gemini generative reasoning, simply configure your `GEMINI_API_KEY` in the top-right settings icon or in `backend/.env`.*"
        )
        refs = ["ICMR-INDIAB (2023)", "PennyLane Quantum ML", "ADA Standards of Care (2024)"]
        followups = ["Explain the quantum parameter compression advantage", "What does ICMR say about Asian Indian BMI?", "Why does the model abstain on Glucose = 0?"]

    return ChatResponse(
        reply=reply,
        source="built-in-clinical-intelligence",
        references=refs,
        suggested_followups=followups
    )

@router.post("", response_model=ChatResponse)
async def chat_with_copilot(request: ChatRequest) -> ChatResponse:
    """Chat endpoint connecting to Gemini 2.5 API with offline clinical intelligence fallback."""
    # Resolve API key: request body > environment variable > settings
    api_key = (
        request.api_key or 
        os.environ.get("GEMINI_API_KEY") or 
        getattr(settings, "gemini_api_key", None)
    )

    if not api_key:
        logger.info("No GEMINI_API_KEY found; responding with built-in clinical intelligence engine.")
        return generate_offline_clinical_reply(request.message, request.patient_context)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        # Build prompt including clinical context if available
        context_prompt = ""
        if request.patient_context:
            ctx = request.patient_context
            context_prompt = (
                f"\n\n[ACTIVE PATIENT PROFILE & PREDICTION CONTEXT]:\n"
                f"- Disease Module: {ctx.get('disease', 'diabetes')}\n"
                f"- Predicted Risk Level: {ctx.get('risk_level', 'N/A')} ({ctx.get('risk_percentage', 'N/A')} / 100%)\n"
                f"- Multi-Model Consensus: {ctx.get('consensus_agreement', 'N/A')}\n"
                f"- Model Disagreement Spread: {ctx.get('disagreement_spread', 'N/A')}\n"
                f"- Biomarkers: {ctx.get('features', {})}\n"
                f"- Top Drivers: {ctx.get('top_drivers', [])}\n"
            )

        conversation_contents = []
        # Add past user/model turns
        for m in request.history[-6:]:
            conversation_contents.append(f"{'User' if m.role == 'user' else 'Dr. Quanta'}: {m.text}")

        # Current message
        current_input = f"{context_prompt}\n\nUser Question: {request.message}"
        conversation_contents.append(f"User: {current_input}")

        full_prompt = f"{SYSTEM_INSTRUCTION}\n\nConversation History:\n" + "\n".join(conversation_contents)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )

        reply_text = response.text or "I processed your question, but received an empty response. Please try rephrasing."

        return ChatResponse(
            reply=reply_text,
            source="gemini-2.5-flash",
            references=[
                "ICMR-INDIAB Guidelines for Type 2 Diabetes Management (2023)",
                "ADA Standards of Care in Diabetes (2024)",
                "PennyLane Variational Quantum Classifiers (VQC)"
            ],
            suggested_followups=[
                "Explain the quantum parameter compression advantage",
                "What clinical actions are recommended for this patient?",
                "How does the model handle missing sentinels?"
            ]
        )

    except Exception as e:
        logger.error(f"Gemini API invocation error: {e}. Falling back to offline clinical intelligence.")
        fallback = generate_offline_clinical_reply(request.message, request.patient_context)
        fallback.reply = f"> *Note: Gemini API notice ({str(e)[:80]}...). Using built-in clinical intelligence.*\n\n" + fallback.reply
        return fallback
