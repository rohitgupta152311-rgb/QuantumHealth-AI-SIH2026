"""Retrain all disease models on the upgraded datasets."""
import sys, os, asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from pathlib import Path

# Enable auto-training
os.environ['AUTO_TRAIN_MISSING_MODELS'] = 'true'

from app.core.config import settings
settings.auto_train_missing_models = True

from app.datasets.loader import DatasetLoader
from app.services.prediction_service import PredictionService

MODELS_DIR = Path(__file__).resolve().parent.parent / "models_cache"
MODELS_DIR.mkdir(exist_ok=True)

async def main():
    loader = DatasetLoader()
    svc = PredictionService(dataset_loader=loader, models_cache_dir=MODELS_DIR)
    diseases = ['heart', 'diabetes', 'breast_cancer', 'kidney']
    for disease_id in diseases:
        print(f"\n{'='*60}")
        print(f"Training {disease_id}...")
        print(f"{'='*60}")
        try:
            bundle = await svc.get_or_train_models(disease_id, force_retrain=True)
            print(f"  [OK] {disease_id} trained successfully!")
        except Exception as e:
            print(f"  [FAIL] {disease_id}: {e}")
            import traceback; traceback.print_exc()
    print("\nDone! Models cached in:", MODELS_DIR)

if __name__ == '__main__':
    asyncio.run(main())
