# Production Python Machine Learning & Quantum Engine for AWS Elastic Beanstalk
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy pre-built frontend distribution for unified serving
COPY frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 8000

# AWS health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

LABEL maintainer="QuantumHealth AI Team" \
      version="1.0.0" \
      description="ArogyaDristi Hybrid Quantum-Classical ML Platform"

CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
