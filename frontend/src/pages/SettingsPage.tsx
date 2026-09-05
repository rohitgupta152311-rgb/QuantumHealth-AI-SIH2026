import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { healthCheck } from '../services/api';
import type { HealthResponse } from '../types';
import {
  Settings,
  Server,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Terminal,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await healthCheck();
      setHealth(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to establish connection to backend API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Settings size={14} /> System Configuration & Environment
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Application Settings</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Verify runtime parameters, API endpoints, and quantum simulation hardware adapters.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={fetchHealth}
          isLoading={isLoading}
          leftIcon={<RefreshCw size={14} />}
        >
          Check Connectivity
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend & API Configuration */}
        <Card className="border-slate-800 bg-slate-900/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server size={16} className="text-teal-400" /> Backend API Service
            </h2>
            {health?.status === 'ok' ? (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={13} /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <AlertCircle size={13} /> {isLoading ? 'Checking...' : 'Offline'}
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">Active Base URL</span>
              <span className="font-mono text-teal-300 font-semibold">{apiUrl}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">Service Status</span>
              <span className="font-mono text-slate-200">
                {health?.status ? `Status: ${health.status}` : error || 'No response from API service.'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">Backend Framework</span>
              <span className="text-slate-200 font-medium">FastAPI Python 3.14 + PennyLane Quantum Engine</span>
            </div>
          </div>
        </Card>

        {/* Quantum Engine Hardware Configuration */}
        <Card className="border-slate-800 bg-slate-900/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-cyan-400" /> Quantum Simulation Engine
            </h2>
            <Badge variant="quantum" className="text-xs">
              6-Qubit Register
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">Active Backend Device</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {health?.quantum_backend || 'PennyLane default.qubit (Statevector)'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">State Preparation</span>
              <span className="text-slate-200 font-medium">RY Rotation Angle Encoding (θ = π · x)</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">Entanglement Layer</span>
              <span className="text-slate-200 font-medium">Ring CNOT Multi-Qubit Topology</span>
            </div>
          </div>
        </Card>

        {/* Clinical Disclaimer & Project Identity */}
        <Card className="border-slate-800 bg-slate-900/90 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-400" /> Compliance & Governance
          </h2>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-2 leading-relaxed">
            <p>
              <strong>Research Prototype Protocol:</strong> QuantumHealth AI is developed for the Smart India Hackathon (SIH 2026 #26139).
              All risk assessments, probabilities, and quantum circuit evaluations are algorithmic decision-support outputs and must not be interpreted as definitive clinical diagnoses.
            </p>
            <p className="text-[11px] text-slate-400">
              Frontend version: 1.0.0 | Design System: Swiss Medical Typography (Inter + JetBrains Mono)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
