import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.experiment import ExperimentResult

router = APIRouter()

@router.get("/experiment-results")
async def list_experiments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExperimentResult).order_by(ExperimentResult.created_at.desc()).limit(50))
    experiments = result.scalars().all()
    
    return [
        {
            "id": exp.id,
            "disease": exp.disease,
            "model_type": exp.model_type,
            "metrics": json.loads(exp.metrics_json),
            "created_at": exp.created_at
        }
        for exp in experiments
    ]

@router.post("/experiment-results")
async def save_experiment(data: dict, db: AsyncSession = Depends(get_db)):
    try:
        disease = data.get("disease", "unknown")
        model_type = data.get("model_type", "unknown")
        metrics = data.get("metrics", {})
        
        exp = ExperimentResult(
            disease=disease,
            model_type=model_type,
            metrics_json=json.dumps(metrics)
        )
        db.add(exp)
        await db.commit()
        await db.refresh(exp)
        
        return {"id": exp.id, "status": "saved"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
