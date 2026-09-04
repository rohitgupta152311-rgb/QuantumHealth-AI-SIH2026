@echo off
title QuantumHealth AI - Model Training Pipeline
echo ============================================================
echo   QuantumHealth AI - Full Model Training Pipeline
echo   Smart India Hackathon 2026 - Problem Statement #26139
echo ============================================================
echo.
cd /d "C:\Users\rohit\.gemini\antigravity\scratch\quantum-health-ai"
echo Training all 4 disease models (Breast Cancer, Diabetes, Heart, Kidney)...
echo Using Classical ML Ensemble + PennyLane Variational Quantum Classifier (VQC)
echo.
backend\venv\Scripts\python.exe backend\scripts\train_all_models.py
echo.
echo ============================================================
echo Training finished. Press any key to exit.
echo ============================================================
pause
