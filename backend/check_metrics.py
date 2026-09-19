import json

diseases = ['heart', 'breast_cancer', 'kidney', 'diabetes']
for d in diseases:
    m = json.load(open(f'models_cache/{d}_manifest.json'))
    alpha = m.get('hybrid_ensemble_configuration', {}).get('tuned_alpha', 'N/A')
    threshold = m.get('hybrid_ensemble_configuration', {}).get('abstention_disagreement_threshold', 'N/A')
    print(f"\n=== {d.upper()} === (alpha={alpha}, threshold={threshold})")
    for model in m.get('test_metrics_summary', []):
        name = model.get('model', '?')
        auc = model.get('roc_auc', 0)
        sens = model.get('sensitivity', 0)
        f1 = model.get('f1_score', 0)
        brier = model.get('brier_score', 0)
        mtype = model.get('type', '?')
        print(f"  {name:20s} [{mtype:8s}]  AUC={auc:.4f}  Sens={sens:.4f}  F1={f1:.4f}  Brier={brier:.4f}")
