from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(String, index=True)
    original_filename = Column(String)
    schema_json = Column(Text)
    row_count = Column(Integer)
    rejected_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    samples = relationship("TrainingSample", back_populates="dataset", cascade="all, delete-orphan")


class TrainingSample(Base):
    __tablename__ = "training_samples"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey('uploaded_datasets.id'), index=True)
    disease_id = Column(String, index=True)
    features_json = Column(Text)
    label = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    dataset = relationship("UploadedDataset", back_populates="samples")


class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(String, index=True)
    data_hash = Column(String)
    metrics_json = Column(Text)
    model_path = Column(String)
    trained_at = Column(DateTime, default=datetime.utcnow)
