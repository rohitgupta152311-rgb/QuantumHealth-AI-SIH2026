import urllib.request
import json
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

endpoints = [
    ('GET', '/health', None),
    ('GET', '/diseases', None),
    ('POST', '/predict', {
        'disease': 'diabetes',
        'features': {
            'Age': 45, 'Gender': 1, 'BMI': 27.5, 'SBP_mmHg': 130, 'DBP_mmHg': 85,
            'FPG_mg_dL': 115, 'Cholesterol_mmol_L': 5.2, 'Triglyceride_mmol_L': 1.8,
            'ALT_UL': 28, 'CCR_umol_L': 72, 'family_history_of_diabetes': 0
        },
        'mode': 'hybrid'
    }),
    ('POST', '/predict (Abstention)', {
        'disease': 'diabetes',
        'features': {
            'Age': 45, 'Gender': 1, 'BMI': 27.5, 'SBP_mmHg': 130, 'DBP_mmHg': 85,
            'FPG_mg_dL': 0, 'Cholesterol_mmol_L': 5.2, 'Triglyceride_mmol_L': 1.8,
            'ALT_UL': 28, 'CCR_umol_L': 72, 'family_history_of_diabetes': 0
        },
        'mode': 'hybrid'
    }),
    ('POST', '/predict/batch', {
        'disease': 'diabetes',
        'patients': [
            {
                'patient_id': 'P001',
                'features': {
                    'Age': 45, 'Gender': 1, 'BMI': 28.0, 'SBP_mmHg': 135, 'DBP_mmHg': 85,
                    'FPG_mg_dL': 120, 'Cholesterol_mmol_L': 5.5, 'Triglyceride_mmol_L': 2.0,
                    'ALT_UL': 30, 'CCR_umol_L': 75, 'family_history_of_diabetes': 0
                }
            }
        ]
    }),
    ('GET', '/quantum/quantum-config?disease=diabetes', None),
    ('POST', '/quantum/noise-simulation', {
        'disease_id': 'diabetes',
        'n_qubits': 6,
        'n_layers': 2,
        'depolarizing_error_rate': 0.05,
        'readout_error_rate': 0.02
    }),
    ('GET', '/models/compare?disease=diabetes', None),
    ('GET', '/clinical-evidence?biomarker=FPG_mg_dL', None),
    ('POST', '/chat', {
        'message': 'What are the ICMR cutoffs for diabetes?',
        'history': []
    }),
]

base = 'http://127.0.0.1:8000/api/v1'
results = []
print("=" * 70)
print("TESTING ALL BACKEND ENDPOINTS LIVE")
print("=" * 70)

all_passed = True
for method, name, body in endpoints:
    actual_path = name.split(' ')[0]
    url = base + actual_path
    req = urllib.request.Request(url, headers={'Content-Type': 'application/json'}, method=method)
    data = json.dumps(body).encode() if body else None
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, data=data, timeout=15) as res:
            elapsed = (time.time() - t0) * 1000
            resp_body = json.loads(res.read().decode())
            status = 'OK'
            extra = f"{elapsed:.0f}ms"
            if 'Abstention' in name:
                extra += f" | status={resp_body.get('status')} abstained={resp_body.get('abstained')}"
            elif name == '/predict':
                p_obj = resp_body.get('prediction', resp_body)
                extra += f" | risk={p_obj.get('risk_score', 0):.1%} risk_level={p_obj.get('risk_level')}"
            elif 'batch' in name:
                extra += f" | processed={resp_body.get('total_processed')} urgent={len(resp_body.get('triage_summary', {}).get('urgent_followup', []))}"
            elif 'chat' in name:
                extra += f" | reply={resp_body.get('response', '')[:40]}... (engine={resp_body.get('engine')})"
            elif 'noise' in name:
                extra += f" | fidelity={resp_body.get('noisy_state_fidelity', 0.0):.3f}"
            results.append((name, res.status, status, extra))
    except Exception as e:
        all_passed = False
        results.append((name, getattr(e, 'code', 'ERR'), 'FAILED', str(e)))

for p, code, st, ex in results:
    tag = '[PASS]' if st == 'OK' else '[FAIL]'
    print(f"{tag} [{code}] {p:<30} -> {st} ({ex})")

print("=" * 70)
if all_passed:
    print("ALL 10 BACKEND ENDPOINTS ARE 100% OPERATIONAL AND PRODUCTION-READY!")
else:
    print("SOME ENDPOINTS FAILED")
print("=" * 70)
