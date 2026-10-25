"""Retrain all 4 disease models with optimized hyperparameters."""
import sys
import os
import time
import json
import asyncio

# Setup paths
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from app.datasets.loader import DatasetLoader
from app.services.training_orchestrator import TrainingOrchestrator
from pathlib import Path

async def retrain_disease(disease_id: str, orchestrator: TrainingOrchestrator):
    print(f"\n{'='*60}")
    print(f"  TRAINING: {disease_id.upper()}")
    print(f"{'='*60}")
    start = time.time()
    
    try:
        bundle = await orchestrator.get_or_train_models(disease_id, force_retrain=True)
        elapsed = time.time() - start
        
        metrics = bundle.trainer.get_model_metrics()
        manifest = bundle.trainer.get_manifest()
        
        print(f"\n  Results for {disease_id} (trained in {elapsed:.1f}s):")
        print(f"  {'Model':<25} {'Accuracy':>10} {'F1':>8} {'AUC':>8} {'Brier':>8}")
        print(f"  {'-'*59}")
        
        for m in metrics:
            name = m.get('model_name', '?')
            acc = m.get('accuracy', 0)
            f1 = m.get('f1_score', 0)
            auc = m.get('roc_auc', 0)
            brier = m.get('brier_score', 1)
            print(f"  {name:<25} {acc:>9.4f} {f1:>7.4f} {auc:>7.4f} {brier:>7.4f}")
        
        # Print alpha
        if manifest:
            alpha = manifest.get('hybrid_ensemble_configuration', {}).get('tuned_alpha', '?')
            absth = manifest.get('hybrid_ensemble_configuration', {}).get('abstention_disagreement_threshold', '?')
            print(f"\n  Alpha (quantum weight): {alpha}")
            print(f"  Abstention threshold:  {absth}")
        
        return metrics
    except Exception as e:
        print(f"  ERROR training {disease_id}: {e}")
        import traceback
        traceback.print_exc()
        return None

async def main():
    print("QuantumHealth AI - Full Model Retraining")
    print("="*60)
    
    loader = DatasetLoader()
    cache_dir = Path("models_cache")
    orchestrator = TrainingOrchestrator(loader, cache_dir)
    
    diseases = ["heart", "breast_cancer", "kidney", "diabetes"]
    all_results = {}
    
    total_start = time.time()
    for disease_id in diseases:
        result = await retrain_disease(disease_id, orchestrator)
        all_results[disease_id] = result
    
    total_elapsed = time.time() - total_start
    
    print(f"\n\n{'='*60}")
    print(f"  RETRAINING COMPLETE - Total time: {total_elapsed:.1f}s")
    print(f"{'='*60}")
    
    # Summary table
    print(f"\n  {'Disease':<18} {'Best Classical':>15} {'VQC':>8} {'Hybrid':>8} {'Alpha':>7}")
    print(f"  {'-'*56}")
    for disease_id, metrics in all_results.items():
        if metrics:
            classical = [m for m in metrics if m.get('model_type') == 'classical']
            quantum = [m for m in metrics if m.get('model_type') == 'quantum']
            hybrid = [m for m in metrics if m.get('model_type') == 'hybrid']
            
            best_c = max((m.get('accuracy', 0) for m in classical), default=0)
            vqc_acc = quantum[0].get('accuracy', 0) if quantum else 0
            h_acc = hybrid[0].get('accuracy', 0) if hybrid else 0
            alpha = hybrid[0].get('alpha_weight', '?') if hybrid else '?'
            
            print(f"  {disease_id:<18} {best_c:>14.2%} {vqc_acc:>7.2%} {h_acc:>7.2%} {alpha:>7}")

if __name__ == "__main__":
    asyncio.run(main())
