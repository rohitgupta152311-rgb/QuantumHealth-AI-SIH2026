#!/bin/bash
pkill -f "uvicorn main:app" || true
echo "Server stopped."
