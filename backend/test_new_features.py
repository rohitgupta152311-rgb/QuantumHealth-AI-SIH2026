import urllib.request
import json

def test_endpoints():
    print("=== Testing /split-insights endpoint ===")
    url = "http://127.0.0.1:8000/api/v1/diseases/heart/split-insights?test_size=0.20"
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read())
        print(f"Disease: {data['disease_name']}")
        print(f"Total samples: {data['total_samples']}")
        print(f"Requested test %: {data['requested_test_pct']}%")
        print(f"Split breakdown: Train={data['split_breakdown']['train']['count']} ({data['split_breakdown']['train']['percentage']}%), Val={data['split_breakdown']['validation']['count']} ({data['split_breakdown']['validation']['percentage']}%), Test={data['split_breakdown']['test']['count']} ({data['split_breakdown']['test']['percentage']}%)")
        print(f"95% CI Margin: ±{data['statistical_insights']['confidence_interval_95_margin_pct']}%")
        print(f"Power: {data['statistical_insights']['power_rating']}")

    print("\n=== Testing /quantum/backends endpoint ===")
    url_b = "http://127.0.0.1:8000/api/v1/quantum/backends"
    with urllib.request.urlopen(url_b) as response:
        data_b = json.loads(response.read())
        print(f"Total available backends: {len(data_b['available_backends'])}")
        for b in data_b['available_backends']:
            print(f"  * {b['name']} -> {b['identifier']}")

    print("\n=== Testing prediction with custom quantum_weight (70%) and custom simulator (pennylane:default.qubit) ===")
    predict_url = "http://127.0.0.1:8000/api/v1/predict"
    payload = {
        "disease": "heart",
        "features": {
            "age": 64, "sex": 1, "cp": 3, "trestbps": 160, "chol": 295,
            "fbs": 1, "restecg": 2, "thalach": 122, "exang": 1,
            "oldpeak": 2.8, "slope": 0, "ca": 2, "thal": 3
        },
        "mode": "hybrid",
        "quantum_weight": 0.70,
        "quantum_backend": "pennylane:default.qubit"
    }
    req = urllib.request.Request(
        predict_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        pred_res = json.loads(resp.read())
        print(f"Status: {pred_res.get('status')}")
        print(f"Quantum Backend used: {pred_res.get('quantum_result', {}).get('backend')}")
        print(f"Quantum prob: {pred_res.get('quantum_result', {}).get('risk_probability')}")
        print(f"Hybrid prob: {pred_res.get('hybrid_result', {}).get('risk_probability')}")
        print(f"Quantum Weight applied: {pred_res.get('hybrid_result', {}).get('quantum_weight')}")
        print(f"Classical Weight applied: {pred_res.get('hybrid_result', {}).get('classical_weight')}")
        print(f"Blend ratio label: {pred_res.get('hybrid_result', {}).get('blend_ratio_label')}")

if __name__ == "__main__":
    test_endpoints()
