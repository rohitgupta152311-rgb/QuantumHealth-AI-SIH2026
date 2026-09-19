"""Force retrain all 4 disease models with corrected code.
Uses the same training path as the training orchestrator.
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split

from app.datasets.loader import DatasetLoader
from app.classical_ml.trainer import ClassicalMLTrainer
from app.preprocessing.pipeline import PreprocessingPipeline
from app.core.config import Settings

settings = Settings()
loader = DatasetLoader()
cache_dir = Path("models_cache")
cache_dir.mkdir(exist_ok=True)

diseases = ["heart", "breast_cancer", "kidney", "diabetes"]

for disease_id in diseases:
    print(f"\n{'='*60}")
    print(f"RETRAINING: {disease_id}")
    print(f"{'='*60}")
    
    t0 = time.time()
    
    # Load disease info and extract sentinels
    disease_info = loader.get_disease_info(disease_id)
    sentinels_map = {}
    for idx, f in enumerate(disease_info.get("features", [])):
        s_list = f.get("missing_sentinels", [])
        if s_list:
            sentinels_map[idx] = [float(val) for val in s_list]
    
    # Handle diabetes special case (grouped split)
    if disease_id == "diabetes":
        X, y, groups, feature_names = loader.load_grouped(disease_id)
        from sklearn.model_selection import GroupShuffleSplit
        gss_test = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=settings.random_seed)
        train_val_idx, test_idx = next(gss_test.split(X, y, groups))
        X_temp, X_test = X[train_val_idx], X[test_idx]
        y_temp, y_test = y[train_val_idx], y[test_idx]
        groups_temp = groups[train_val_idx]
        
        gss_val = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=settings.random_seed)
        train_idx, val_idx = next(gss_val.split(X_temp, y_temp, groups_temp))
        X_train, X_val = X_temp[train_idx], X_temp[val_idx]
        y_train, y_val = y_temp[train_idx], y_temp[val_idx]
    else:
        X, y, feature_names = loader.load(disease_id)
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=0.20, random_state=settings.random_seed, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=0.25, random_state=settings.random_seed, stratify=y_temp
        )
    
    print(f"  Dataset: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"  Class balance: {y.mean():.4f} positive rate")
    print(f"  Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    # Create and fit pipeline
    pipeline_path = cache_dir / f"{disease_id}_pipeline.pkl"
    pipeline = PreprocessingPipeline(
        n_quantum_features=settings.quantum_n_qubits,
        model_version=f"{disease_id}_v1.0",
        missing_sentinels=sentinels_map
    )
    pipeline.fit(X_train, y_train, feature_names)
    pipeline.save(pipeline_path)
    
    X_train_c, X_train_q = pipeline.transform(X_train)
    X_val_c, X_val_q = pipeline.transform(X_val)
    X_test_c, X_test_q = pipeline.transform(X_test)
    
    # Train all models
    trainer = ClassicalMLTrainer(disease_id=disease_id, models_cache_dir=cache_dir)
    trainer.train(
        X_train=X_train_c, y_train=y_train,
        X_test=X_test_c, y_test=y_test,
        feature_names=feature_names,
        X_val=X_val_c, y_val=y_val,
        X_train_q=X_train_q, X_val_q=X_val_q, X_test_q=X_test_q,
        dataset_meta=disease_info, pipeline_path=pipeline_path
    )
    
    elapsed = time.time() - t0
    print(f"\n  Training completed in {elapsed:.1f}s")
    
    # Print key metrics
    manifest = trainer.get_manifest()
    if manifest:
        alpha = manifest.get("hybrid_alpha", "N/A")
        threshold = manifest.get("abstention_disagreement_threshold", "N/A")
        print(f"  Hybrid alpha: {alpha}")
        print(f"  Abstention threshold: {threshold}")
        
        for m in manifest.get("model_metrics", []):
            name = m.get("model_name", "?")
            auc = m.get("roc_auc", 0)
            sens = m.get("sensitivity", 0)
            f1 = m.get("f1_score", 0)
            brier = m.get("brier_score", 0)
            print(f"    {name:20s}  AUC={auc:.4f}  Sens={sens:.4f}  F1={f1:.4f}  Brier={brier:.4f}")

print(f"\n{'='*60}")
print("ALL MODELS RETRAINED SUCCESSFULLY")
print(f"{'='*60}")
