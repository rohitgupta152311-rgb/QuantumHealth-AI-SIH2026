import os
import sys
import time
import json
import hashlib
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd

PROJECT_ROOT = Path(r"C:\Users\rohit\.gemini\antigravity\scratch\quantum-health-ai\backend")
DB_PATH = PROJECT_ROOT / "quantumhealth.db"
CSV_PATH = PROJECT_ROOT / "data" / "heart_disease_uci_cdc.csv"

def compute_sample_fingerprint(disease_id: str, features_dict: dict, label: int) -> str:
    items_str = ",".join(f"{k}={float(v):.6f}" for k, v in sorted(features_dict.items()))
    raw_str = f"{disease_id}:{int(label)}:{items_str}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

def main():
    print(f"Loading {CSV_PATH.name}...")
    t0 = time.time()
    
    with open(CSV_PATH, "rb") as f:
        content = f.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    df = pd.read_csv(CSV_PATH)
    expected_features = [c for c in df.columns if c != "target"]
    total_rows = len(df)
    print(f"Loaded {total_rows} rows in {time.time() - t0:.2f}s")
    
    conn = sqlite3.connect(DB_PATH)
    # Set PRAGMAs outside transaction
    conn.isolation_level = None
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.isolation_level = ""  # standard deferred transaction mode
    
    cur = conn.cursor()
    
    # Ensure any existing heart upload record is cleaned
    cur.execute("SELECT id FROM uploaded_datasets WHERE disease_id = 'heart'")
    existing_ids = [row[0] for row in cur.fetchall()]
    if existing_ids:
        cur.executemany("DELETE FROM training_samples WHERE dataset_id = ?", [(i,) for i in existing_ids])
        cur.execute("DELETE FROM uploaded_datasets WHERE disease_id = 'heart'")
        conn.commit()
        print(f"Cleaned up {len(existing_ids)} previous heart dataset(s).")
    
    # Insert uploaded_dataset
    now_str = datetime.now(timezone.utc).isoformat()
    cur.execute(
        """INSERT INTO uploaded_datasets 
        (disease_id, original_filename, file_hash, schema_json, row_count, rejected_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)""",
        ('heart', 'heart_disease_uci_cdc.csv', file_hash, json.dumps(expected_features), total_rows, 0, now_str)
    )
    dataset_id = cur.lastrowid
    print(f"Created uploaded_dataset #{dataset_id} for 'heart'")
    
    # Prepare batch data
    print("Preparing 200,000 samples with JSON and fingerprints...")
    t_prep = time.time()
    records_feats = df[expected_features].to_dict("records")
    labels = df["target"].astype(int).tolist()
    
    batch_data = []
    for feat_dict, label_val in zip(records_feats, labels):
        fp = compute_sample_fingerprint("heart", feat_dict, label_val)
        fj = json.dumps(feat_dict)
        batch_data.append((dataset_id, "heart", fp, fj, label_val, now_str))
    
    print(f"Prepared 200,000 records in {time.time() - t_prep:.2f}s")
    
    print("Inserting into SQLite database...")
    t_insert = time.time()
    
    # Insert in 25,000 batches
    chunk_size = 25000
    for i in range(0, len(batch_data), chunk_size):
        chunk = batch_data[i:i + chunk_size]
        cur.executemany(
            """INSERT INTO training_samples 
            (dataset_id, disease_id, fingerprint, features_json, label, created_at)
            VALUES (?, ?, ?, ?, ?, ?)""",
            chunk
        )
    conn.commit()
    conn.close()
    
    print(f"Inserted and committed 200,000 rows in {time.time() - t_insert:.2f}s!")
    print(f"TOTAL TIME: {time.time() - t0:.2f}s")

if __name__ == "__main__":
    main()
