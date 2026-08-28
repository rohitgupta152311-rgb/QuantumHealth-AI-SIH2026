import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base

class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    id = Column(Integer, primary_key=True, index=True)
    disease = Column(String, index=True)
    model_type = Column(String)
    metrics_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
