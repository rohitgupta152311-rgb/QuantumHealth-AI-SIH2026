import logging
from dataclasses import dataclass
from typing import Optional, Callable
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split

from app.core.config import settings
from app.datasets.loader import DatasetLoader
from app.classical_ml.trainer import ClassicalMLTrainer
from app.preprocessing.pipeline import PreprocessingPipeline
from app.quantum_ml.vqc import QuantumClassifier

logger = logging.getLogger("quantumhealth.services.training")

@dataclass
class TrainedModelBundle:
    trainer: ClassicalMLTrainer
    pipeline: PreprocessingPipeline
    vqc_model: Optional[QuantumClassifier]

class TrainingOrchestrator:
    def __init__(self, dataset_loader: DatasetLoader, models_cache_dir: Path):
        self._dataset_loader = dataset_loader
        self._models_cache_dir = models_cache_dir

    def _extract_missing_sentinels(self, disease_info: dict) -> dict[int, list[float]]:
        sentinels_map = {}
        for idx, f in enumerate(disease_info.get("features", [])):
            s_list = f.get("missing_sentinels", [])
            if s_list:
                sentinels_map[idx] = [float(val) for val in s_list]
        return sentinels_map

    async def get_or_train_models(
        self, disease_id: str, force_retrain: bool = False, on_progress: Optional[Callable[[str, float], None]] = None
    ) -> TrainedModelBundle:
        if on_progress: on_progress("Loading disease info", 0.1)
        disease_info = self._dataset_loader.get_disease_info(disease_id)
        sentinels_map = self._extract_missing_sentinels(disease_info)

        pipeline_path = self._models_cache_dir / f"{disease_id}_pipeline.pkl"
        probe_trainer = ClassicalMLTrainer(disease_id, self._models_cache_dir)
        vqc_model = None
        if not force_retrain:
            try:
                probe_trainer.load_cached(pipeline_path, [f["name"] for f in disease_info["features"]])
                pipeline = PreprocessingPipeline(
                    n_quantum_features=settings.quantum_n_qubits,
                    missing_sentinels=sentinels_map,
                )
                pipeline.load(pipeline_path)
                logger.info("Loaded complete cached bundle for '%s'.", disease_id)
                return TrainedModelBundle(probe_trainer, pipeline, probe_trainer.vqc_model)
            except Exception as exc:
                logger.warning("Cached bundle load failed for '%s': %s", disease_id, exc)
                if not settings.auto_train_missing_models:
                    raise RuntimeError(
                        f"Cached models for '{disease_id}' are missing or incompatible: {exc}. "
                        "Restore a complete compatible checkpoint. Automatic training is disabled."
                    ) from exc

        if not force_retrain and not settings.auto_train_missing_models:
            raise RuntimeError(
                f"Cached models for '{disease_id}' are missing or incompatible. "
                "Automatic training is disabled. Restore compatible model artifacts "
                "or explicitly request training through the training endpoint."
            )

        if on_progress: on_progress("Loading and splitting dataset", 0.3)
        if disease_id == "diabetes":
            X, y, groups, feature_names = self._dataset_loader.load_grouped(disease_id)
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
            X, y, feature_names = self._dataset_loader.load(disease_id)
            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, test_size=0.20, random_state=settings.random_seed, stratify=y
            )
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, test_size=0.25, random_state=settings.random_seed, stratify=y_temp
            )

        if on_progress: on_progress("Fitting pipeline", 0.5)
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

        trainer = ClassicalMLTrainer(disease_id, self._models_cache_dir)
        if on_progress: on_progress("Training models", 0.7)
        if force_retrain:
            trainer.train(
                X_train_c, y_train, X_test_c, y_test, feature_names,
                X_val=X_val_c, y_val=y_val,
                X_train_q=X_train_q, X_val_q=X_val_q, X_test_q=X_test_q,
                dataset_meta=disease_info, pipeline_path=pipeline_path
            )
        else:
            trainer.load_or_train(
                X_train_c, y_train, X_test_c, y_test, feature_names,
                X_val=X_val_c, y_val=y_val,
                X_train_q=X_train_q, X_val_q=X_val_q, X_test_q=X_test_q,
                dataset_meta=disease_info, pipeline_path=pipeline_path
            )
            
        if on_progress: on_progress("Completed training", 1.0)
        return TrainedModelBundle(trainer, pipeline, trainer.vqc_model)

    async def get_or_train_models_with_uploads(
        self, disease_id: str, db, force_retrain: bool = False
    ) -> dict:
        disease_info = self._dataset_loader.get_disease_info(disease_id)
        sentinels_map = self._extract_missing_sentinels(disease_info)

        trainer = ClassicalMLTrainer(disease_id, self._models_cache_dir)
        pipeline = PreprocessingPipeline(
            n_quantum_features=settings.quantum_n_qubits,
            model_version=f"{disease_id}_v1.0",
            missing_sentinels=sentinels_map
        )
        pipeline_path = self._models_cache_dir / f"{disease_id}_pipeline.pkl"

        X, y, feature_names, data_info = await self._dataset_loader.load_with_uploads(
            disease_id, db
        )

        if len(X) < 10:
            raise ValueError(f"Insufficient data: {len(X)} samples (minimum 10).")
        if len(np.unique(y)) < 2:
            raise ValueError("Need both 0 and 1 labels for training.")

        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=0.20, random_state=settings.random_seed, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=0.25, random_state=settings.random_seed, stratify=y_temp
        )

        pipeline.fit(X_train, y_train, feature_names)
        pipeline.save(pipeline_path)

        X_train_c, _ = pipeline.transform(X_train)
        X_val_c, _ = pipeline.transform(X_val)
        X_test_c, _ = pipeline.transform(X_test)

        trainer.train(
            X_train_c, y_train, X_test_c, y_test, feature_names,
            X_val=X_val_c, y_val=y_val, dataset_meta=disease_info,
            pipeline_path=pipeline_path
        )

        return data_info
