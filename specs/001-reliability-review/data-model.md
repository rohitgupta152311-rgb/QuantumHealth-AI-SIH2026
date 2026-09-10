# Data model
Bundle fields: disease_id, models, vqc_model, hybrid_ensemble, calibrators, alpha_star, abstention_threshold, feature_names, preprocessing_hash, data_hashes. Required keys must be present even when a legitimate optional model is null. Restore state atomically after validation.
Manifest: disease_id, preprocessing_artifact_sha256, test_metrics_summary and existing provenance. Its disease and preprocessing identity must match the bundle. No invented metrics.
Health UI: idle/loading -> success or failure; each request owns a generation. Refresh invalidates old health values; only the latest generation may update state.
Disease URL: path disease takes precedence at entry; user selection creates a canonical /analyze/:diseaseId URL. Query links remain accepted.
Tests: default, training, or artifact-dependent integration. Training and integration opt-ins are independent and their exclusions are reported.
