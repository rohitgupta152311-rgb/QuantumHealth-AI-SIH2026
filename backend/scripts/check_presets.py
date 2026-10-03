import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import asyncio
from app.api.routes.predict import get_prediction_service
from app.datasets.diabetes import DiabetesDataset
from app.datasets.heart import HeartDataset
from app.datasets.breast_cancer import BreastCancerDataset
from app.datasets.kidney import KidneyDataset

async def test_all():
    ps = get_prediction_service()
    for name, cls, dis_id in [
        ('Heart', HeartDataset, 'heart'),
        ('Kidney', KidneyDataset, 'kidney'),
        ('Breast Cancer', BreastCancerDataset, 'breast_cancer'),
        ('Diabetes', DiabetesDataset, 'diabetes')
    ]:
        ds = cls()
        info = ds.get_disease_info()
        presets = info.get('presets', {})
        print(f'=== {name} ({dis_id}) ===')
        for p_key, p_val in presets.items():
            res = await ps.predict(dis_id, p_val['data'])
            hr = res.get('hybrid_result', {})
            qr = res.get('quantum_result', {})
            risk = hr.get('risk_probability', 0)
            level = hr.get('risk_level', 'unknown')
            pred = hr.get('prediction', 'unknown')
            qp = qr.get('risk_probability', 0)
            q_pred = qr.get('prediction', 'unknown')
            cr_probs = [m['risk_probability'] for m in res.get('classical_results', [])]
            cr_avg = sum(cr_probs) / len(cr_probs) if cr_probs else 0
            print(f'  Preset {p_key:12s}: hybrid={risk:.3f} ({level}/{pred}) | classical_avg={cr_avg:.3f} | quantum={qp:.3f} ({q_pred})')

if __name__ == '__main__':
    asyncio.run(test_all())
