import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisease } from '../hooks/useDisease';
import { getDiseaseConfig } from '../features/disease/diseaseConfig';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Activity,
  HeartPulse,
  ShieldAlert,
  Stethoscope,
  BarChart3,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { diseases, isLoading } = useDisease();

  const getDiseaseIcon = (id: string) => {
    switch (id) {
      case 'heart':
        return HeartPulse;
      case 'breast_cancer':
        return ShieldAlert;
      case 'diabetes':
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome / Research Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 border border-slate-800 p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold">
            <ShieldCheck size={14} /> SIH 2026 #26139 • Clinical Decision Support
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            QuantumHealth <span className="text-teal-400">AI</span> Research Platform
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Multi-cohort diagnostic risk estimation combining classical ensemble learning with PennyLane Variational Quantum Classifiers (VQC) and automated consensus cross-validation.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              size="md"
              onClick={() => navigate('/analyze?disease=heart')}
              leftIcon={<Stethoscope size={16} />}
            >
              Start Clinical Analysis
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => navigate('/comparison')}
              leftIcon={<BarChart3 size={16} />}
            >
              View Model Benchmarks
            </Button>
          </div>
        </div>
      </div>

      {/* Disease Assessment Modules */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Stethoscope size={18} className="text-teal-400" /> Disease Diagnostic Modules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a specialized clinical module to input patient biomarkers and simulate quantum predictions.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {diseases.length} Active Cohorts
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {diseases.map((disease) => {
              const cfg = getDiseaseConfig(disease.id);
              const Icon = getDiseaseIcon(disease.id);

              return (
                <Card
                  key={disease.id}
                  className="flex flex-col justify-between border-slate-800 bg-slate-900/90 hover:border-teal-500/60 transition-all p-5 group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                        <Icon size={20} />
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={12} /> {disease.status === 'ready' ? 'Model Ready' : 'Active'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-teal-400 font-semibold uppercase tracking-wider block mb-1">
                        {cfg?.specialty || 'Clinical Module'}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-teal-200 transition-colors">
                        {disease.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {cfg?.description || disease.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-sans">Biomarkers</span>
                        <span className="text-teal-300 font-semibold">{disease.features.length} Features</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-sans">Cohort Size</span>
                        <span className="text-slate-200 font-semibold">{cfg?.cohort || `${disease.dataset_size || 0} Cases`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <Button
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => navigate(`/analyze?disease=${disease.id}`)}
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Start Analysis
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Compact Training / Model Status Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="border-slate-800 bg-slate-900/90 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-teal-400" /> Quantum-Classical Architecture Status
            </h2>
            <Badge variant="quantum">PennyLane VQC Active</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans">Classical Layer</span>
              <span className="font-semibold text-slate-200">Ensemble (RF + SVM + LR)</span>
              <p className="text-[10px] text-slate-400">Continuous probability calibration</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans">Quantum Register</span>
              <span className="font-semibold text-teal-300">6 Qubits (Angle Encoding RY)</span>
              <p className="text-[10px] text-slate-400">Ring CNOT entanglement layers</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans">Consensus Protocol</span>
              <span className="font-semibold text-cyan-300">Weighted Fusion (60/40)</span>
              <p className="text-[10px] text-slate-400">Disagreement alert flagging</p>
            </div>
          </div>
        </Card>

        {/* Quick Audit & Benchmark Link */}
        <Card className="border-slate-800 bg-slate-900/90 space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-teal-400" /> Model Verification
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Examine real cross-validation metrics, confusion matrices, and ROC curves for each disease model.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-center"
              onClick={() => navigate('/comparison')}
              leftIcon={<BarChart3 size={14} />}
            >
              Open Model Benchmarking
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
