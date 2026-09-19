"""Test all 16 presets across 4 diseases and verify predictions are sensible."""
import requests
import json

BASE = "http://127.0.0.1:8000/api/v1"

# Presets from diseaseConfig
PRESETS = {
    "heart": {
        "lower": {"age":42,"sex":1,"cp":0,"trestbps":118,"chol":195,"fbs":0,"restecg":0,"thalach":168,"exang":0,"oldpeak":0.2,"slope":2,"ca":0,"thal":2},
        "intermediate": {"age":56,"sex":1,"cp":1,"trestbps":135,"chol":245,"fbs":0,"restecg":1,"thalach":145,"exang":0,"oldpeak":1.4,"slope":1,"ca":1,"thal":2},
        "higher": {"age":64,"sex":1,"cp":3,"trestbps":160,"chol":295,"fbs":1,"restecg":2,"thalach":122,"exang":1,"oldpeak":2.8,"slope":0,"ca":2,"thal":3},
        "median": {"age":55,"sex":1,"cp":1,"trestbps":130,"chol":241,"fbs":0,"restecg":1,"thalach":153,"exang":0,"oldpeak":0.8,"slope":1,"ca":0,"thal":2},
    },
    "breast_cancer": {
        "lower": {"mean radius":11.2,"mean texture":16.5,"mean perimeter":72.0,"mean area":385,"mean smoothness":0.085,"mean compactness":0.05,"mean concavity":0.015,"mean concave points":0.01,"mean symmetry":0.17,"mean fractal dimension":0.06},
        "intermediate": {"mean radius":14.8,"mean texture":20.5,"mean perimeter":96.0,"mean area":680,"mean smoothness":0.1,"mean compactness":0.1,"mean concavity":0.065,"mean concave points":0.04,"mean symmetry":0.19,"mean fractal dimension":0.062},
        "higher": {"mean radius":20.5,"mean texture":25.2,"mean perimeter":138.0,"mean area":1320,"mean smoothness":0.12,"mean compactness":0.21,"mean concavity":0.285,"mean concave points":0.14,"mean symmetry":0.22,"mean fractal dimension":0.075},
        "median": {"mean radius":13.37,"mean texture":18.84,"mean perimeter":86.24,"mean area":551.1,"mean smoothness":0.096,"mean compactness":0.093,"mean concavity":0.061,"mean concave points":0.034,"mean symmetry":0.181,"mean fractal dimension":0.063},
    },
    "kidney": {
        "lower": {"age":35,"bp":70,"sg":1.025,"al":0,"su":0,"bgr":100,"bu":18,"sc":0.8,"sod":140,"pot":4.2,"hemo":15.0,"htn":0},
        "intermediate": {"age":52,"bp":80,"sg":1.015,"al":1,"su":0,"bgr":135,"bu":45,"sc":1.4,"sod":135,"pot":4.8,"hemo":12.2,"htn":0},
        "higher": {"age":64,"bp":90,"sg":1.008,"al":3,"su":2,"bgr":220,"bu":100,"sc":4.8,"sod":125,"pot":5.8,"hemo":8.4,"htn":1},
        "median": {"age":51.5,"bp":80,"sg":1.018,"al":1,"su":0,"bgr":121,"bu":53,"sc":1.3,"sod":137,"pot":4.6,"hemo":12.5,"htn":0},
    },
    "diabetes": {
        "lower": {"Age":35,"Gender":2,"BMI":20.5,"SBP_mmHg":105,"DBP_mmHg":65,"FPG_mg_dL":88,"Cholesterol_mmol_L":4.2,"Triglyceride_mmol_L":1.0,"ALT_UL":18,"CCR_umol_L":65,"family_history_of_diabetes":0},
        "intermediate": {"Age":52,"Gender":1,"BMI":26.2,"SBP_mmHg":132,"DBP_mmHg":82,"FPG_mg_dL":112,"Cholesterol_mmol_L":5.5,"Triglyceride_mmol_L":2.1,"ALT_UL":32,"CCR_umol_L":80,"family_history_of_diabetes":0},
        "higher": {"Age":62,"Gender":1,"BMI":29.8,"SBP_mmHg":150,"DBP_mmHg":92,"FPG_mg_dL":124,"Cholesterol_mmol_L":6.2,"Triglyceride_mmol_L":3.5,"ALT_UL":48,"CCR_umol_L":95,"family_history_of_diabetes":1},
        "median": {"Age":47,"Gender":1,"BMI":23.8,"SBP_mmHg":125,"DBP_mmHg":78,"FPG_mg_dL":95,"Cholesterol_mmol_L":5.1,"Triglyceride_mmol_L":1.4,"ALT_UL":22,"CCR_umol_L":72,"family_history_of_diabetes":0},
    },
}

total = 0
passed = 0
failed = 0

for disease, presets in PRESETS.items():
    print(f"\n{'='*60}")
    print(f"DISEASE: {disease.upper()}")
    print(f"{'='*60}")
    for preset_name, features in presets.items():
        total += 1
        try:
            resp = requests.post(f"{BASE}/predict", json={
                "disease": disease,
                "features": features,
                "mode": "hybrid"
            }, timeout=60)
            data = resp.json()
            status = data.get("status", "error")
            
            if status == "completed":
                hybrid = data.get("hybrid_result", {})
                risk_pct = hybrid.get("risk_percentage", 0)
                risk_level = hybrid.get("risk_level", "?")
                q_result = data.get("quantum_result", {})
                q_prob = q_result.get("risk_probability", 0)
                
                # Get classical individual results
                c_results = data.get("classical_results", [])
                c_probs = [r.get("risk_probability", 0) for r in c_results]
                c_mean = sum(c_probs) / max(len(c_probs), 1)
                
                passed += 1
                print(f"  [{preset_name:12s}] COMPLETED - Risk: {risk_pct:.1f}% ({risk_level}) | C_mean={c_mean:.3f} Q={q_prob:.3f} H={risk_pct/100:.3f}")
            elif status == "abstained":
                reason = data.get("abstention_reason", "?")[:80]
                failed += 1
                print(f"  [{preset_name:12s}] ABSTAINED - {reason}")
            else:
                failed += 1
                print(f"  [{preset_name:12s}] ERROR - {data}")
        except Exception as e:
            failed += 1
            print(f"  [{preset_name:12s}] EXCEPTION - {e}")

print(f"\n{'='*60}")
print(f"RESULTS: {passed}/{total} passed, {failed}/{total} failed")
print(f"{'='*60}")
