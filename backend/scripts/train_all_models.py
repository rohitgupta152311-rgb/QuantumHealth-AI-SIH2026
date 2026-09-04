"""
Train all 4 disease models via the backend API:
- breast_cancer
- diabetes
- heart
- kidney
"""
import sys
import time
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"
DISEASES = ["breast_cancer", "diabetes", "heart", "kidney"]

def train_disease(disease: str):
    print(f"\n{'='*60}")
    print(f"[{time.strftime('%H:%M:%S')}] Starting training for: {disease.upper()}")
    print(f"{'='*60}")
    t0 = time.time()
    try:
        resp = requests.post(
            f"{BASE_URL}/models/train",
            json={"disease": disease, "force_retrain": True},
            timeout=600,
        )
        elapsed = time.time() - t0
        if resp.status_code == 200:
            data = resp.json()
            metrics = data.get("metrics", {})
            hybrid = metrics.get("hybrid", {})
            classical = metrics.get("classical", {})
            quantum = metrics.get("quantum", {})
            print(f"[OK] [{disease}] Training completed in {elapsed:.1f}s")
            print(f"  Experiment ID: {data.get('experiment_id')}")
            print(f"  Model Version ID: {data.get('model_version_id')}")
            print(f"  Classical Acc: {classical.get('accuracy', 0)*100:.1f}% | F1: {classical.get('f1_score', 0):.4f}")
            print(f"  Quantum   Acc: {quantum.get('accuracy', 0)*100:.1f}% | F1: {quantum.get('f1_score', 0):.4f}")
            print(f"  Hybrid    Acc: {hybrid.get('accuracy', 0)*100:.1f}% | F1: {hybrid.get('f1_score', 0):.4f}")
            return True, data
        else:
            print(f"[FAILED] [{disease}] Training failed ({resp.status_code}) after {elapsed:.1f}s: {resp.text[:200]}")
            return False, None
    except Exception as e:
        print(f"[ERROR] [{disease}] Exception: {e}")
        return False, None

def main():
    diseases = [sys.argv[1]] if len(sys.argv) > 1 else DISEASES
    results = {}
    for d in diseases:
        success, data = train_disease(d)
        results[d] = success

    print(f"\n{'='*60}")
    print("TRAINING SUMMARY:")
    for d, ok in results.items():
        print(f"  {d:15s}: {'SUCCESS [OK]' if ok else 'FAILED [X]'}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
