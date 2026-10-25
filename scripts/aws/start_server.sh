#!/bin/bash
set -e
cd /home/ec2-user/quantumhealth-ai/backend

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

export PORT=${PORT:-8000}

# Start with gunicorn + uvicorn workers for production
nohup python3 -m uvicorn main:app \
    --host 0.0.0.0 \
    --port $PORT \
    --workers 2 \
    --timeout-keep-alive 120 \
    > /var/log/quantumhealth-ai.log 2>&1 &

echo "QuantumHealth AI backend started on port $PORT"
