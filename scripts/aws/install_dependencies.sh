#!/bin/bash
set -e
cd /home/ec2-user/quantumhealth-ai

# Install Node.js and build frontend
if [ -d "frontend" ]; then
    cd frontend
    npm ci
    npm run build
    cd ..
fi

# Install Python dependencies
cd backend
python3 -m pip install --upgrade pip
pip3 install -r requirements.txt
cd ..

echo "Dependencies installed successfully."
