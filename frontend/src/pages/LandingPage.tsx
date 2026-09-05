import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Activity, Brain, Cpu, Zap, Shield, TrendingUp,
  Sparkles, CheckCircle2, Layers, Binary, HeartPulse, ShieldAlert,
  Server, GitBranch, Terminal, FlaskConical, HelpCircle, BarChart3,
  Stethoscope, Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'Biomedical Data Ingestion',
      subtitle: 'Raw Clinical Profiles',
      desc: 'Ingests complex healthcare biomarkers (glycemic levels, cardiac measurements, cytological biopsy features) with missing value median imputation and outlier clipping.',
      icon: Activity,
      layer: 'Classical Preprocessing Layer',
      badge: 'scikit-learn / pandas'
    },
    {
      step: '02',
      title: 'Dimensionality Reduction',
      subtitle: 'Feature Selection & Normalization',
      desc: 'Applies StandardScaler and SelectKBest mutual information to filter high-dimensional data into the 6 most impactful clinical biomarker dimensions.',
      icon: Brain,
      layer: 'Classical Preprocessing Layer',
      badge: 'Mutual Info / StandardScaler'
    },
    {
      step: '03',
      title: 'Quantum State Encoding',
      subtitle: 'Angle Encoding (RY Gates)',
      desc: 'Encodes each scaled feature xi into the rotation angle θ = π·xi on individual qubits, mapping classical patient data into quantum Hilbert space.',
      icon: Binary,
      layer: 'Quantum Computational Layer',
      badge: 'Angle Encoding (RY)'
    },
    {
      step: '04',
      title: 'Parameterized VQC Circuit',
      subtitle: 'Variational Quantum Classifier',
      desc: 'Executes parameterized RY and RZ rotation layers with ring-topology CNOT 2-qubit entanglement gates on the PennyLane quantum simulator.',
      icon: Cpu,
      layer: 'Quantum Computational Layer',
      badge: 'PennyLane default.qubit'
    },
    {
      step: '05',
      title: 'Quantum Measurement',
      subtitle: 'Pauli-Z Expectation',
      desc: 'Measures the expectation value ⟨Z₀⟩ on the primary register and applies a sigmoid activation function to compute quantum disease risk.',
      icon: Zap,
      layer: 'Quantum Computational Layer',
      badge: '⟨Z₀⟩ Measurement'
    },
    {
      step: '06',
      title: 'Consensus Decision Engine',
      subtitle: 'Hybrid Intelligence Fusion',
      desc: 'Aggregates classical Random Forest, SVM, and Logistic Regression with a simulated Quantum VQC (60/40 weighted fusion) and flags research-model disagreement.',
      icon: Shield,
      layer: 'Hybrid Decision Support',
      badge: 'Consensus Engine'
    },
  ];

  const diseasePresets = [
    {
      id: 'heart',
      name: 'Cardiovascular Risk (Heart Disease)',
      specialty: 'Cardiology',
      dataset: 'Cleveland Clinic Heart Cohort',
      samples: '303 Patients',
      features: '13 Features → 6 Qubits',
      icon: HeartPulse,
      borderColor: 'border-rose-500/40',
      tagColor: 'text-rose-400',
      description: 'Hemodynamic indicators, resting ECG, ST depression, exercise-induced angina, and coronary artery narrowing.',
    },
    {
      id: 'breast_cancer',
      name: 'Breast Cancer Cytopathology',
      specialty: 'Oncology',
      dataset: 'Wisconsin Diagnostic Biopsies',
      samples: '569 Biopsies',
      features: '30 Features → 6 Qubits',
      icon: ShieldAlert,
      borderColor: 'border-amber-500/40',
      tagColor: 'text-amber-400',
      description: 'Fine Needle Aspirate (FNA) digitized cytological features: nuclear radius, texture variability, and compactness.',
    },
    {
      id: 'diabetes',
      name: 'Type 2 Diabetes Mellitus',
      specialty: 'Endocrinology',
      dataset: 'Pima Indians Diabetes Study',
      samples: '768 Patients',
      features: '8 Features → 6 Qubits',
      icon: Activity,
      borderColor: 'border-teal-500/40',
      tagColor: 'text-teal-400',
      description: 'Metabolic markers: glucose tolerance, fasting serum insulin, pedigree genetic risk function, and body mass index.',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 space-y-20">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-teal-300 text-xs sm:text-sm font-medium">
            <Sparkles size={15} className="text-teal-400" />
            <span>Smart India Hackathon 2026 | Problem Statement #26139</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Hybrid Quantum-Classical <br className="hidden sm:inline" />
            <span className="text-teal-400">Clinical Decision Support</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Uniting classical machine learning ensembles with simulated Variational Quantum Classifiers (PennyLane VQC) to detect early biomarkers in cardiovascular, oncological, and metabolic disease profiles.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/analyze')}
              leftIcon={<Activity size={18} />}
              className="text-sm px-5 py-3 shadow-sm font-semibold"
            >
              Start Clinical Risk Analysis
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/quantum-lab')}
              leftIcon={<Cpu size={18} />}
              className="text-sm px-5 py-3"
            >
              Quantum VQC Laboratory
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/comparison')}
              leftIcon={<BarChart3 size={18} />}
              className="text-sm px-5 py-3 border border-slate-800"
            >
              Model Benchmarks
            </Button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xl sm:text-2xl font-mono font-bold text-teal-400">3 Specialties</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cardiology, Oncology, Endocrine</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xl sm:text-2xl font-mono font-bold text-sky-400">6 Qubits</div>
              <div className="text-[11px] text-slate-400 mt-0.5">PennyLane default.qubit</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xl sm:text-2xl font-mono font-bold text-teal-300">4-Way Fusion</div>
              <div className="text-[11px] text-slate-400 mt-0.5">RF + SVM + LR + VQC</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-center">
              <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">100% Validated</div>
              <div className="text-[11px] text-slate-400 mt-0.5">5-Fold Cross Validation</div>
            </div>
          </div>
        </div>

        {/* DEDICATED DISEASE MODULES CARDS */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">Supported Diagnostic Modules</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Standardized hybrid prediction across three validated clinical datasets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {diseasePresets.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.id}
                  className={`bg-slate-900 border ${d.borderColor} rounded-2xl p-5 flex flex-col justify-between hover:border-teal-500/60 transition-all shadow-sm`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-white">
                        <Icon size={22} className={d.tagColor} />
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                        {d.samples}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-teal-400 uppercase tracking-wide">
                        {d.specialty}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{d.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{d.dataset}</p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {d.description}
                    </p>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1 font-mono">
                      <div className="text-slate-400 flex justify-between">
                        <span>Mapping:</span>
                        <span className="text-slate-200">{d.features}</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Ansatz:</span>
                        <span className="text-teal-300">2-Layer Parameterized VQC</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5">
                    <Button
                      className="w-full text-xs py-2.5"
                      onClick={() => navigate(`/analyze?disease=${d.id}`)}
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Open {d.specialty} Assessment
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WORKFLOW PIPELINE */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">Hybrid Architecture Workflow</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Flow of clinical biomarker data through classical normalization, quantum state encoding, VQC simulation, and consensus prediction.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 items-start">
            {/* Step Selector List */}
            <div className="space-y-2 lg:col-span-1">
              {workflowSteps.map((s, idx) => {
                const isCurrent = activeWorkflowStep === idx;
                const Icon = s.icon;
                return (
                  <div
                    key={s.step}
                    onClick={() => setActiveWorkflowStep(idx)}
                    className={`cursor-pointer p-3 rounded-xl border transition-colors flex items-center justify-between ${
                      isCurrent
                        ? 'bg-slate-900 border-teal-500 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {s.step}
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                          {s.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.layer}</div>
                      </div>
                    </div>
                    <Icon size={16} className={isCurrent ? 'text-teal-400' : 'text-slate-600'} />
                  </div>
                );
              })}
            </div>

            {/* Step Detail Display Card */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold text-teal-400">
                      {workflowSteps[activeWorkflowStep].step}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {workflowSteps[activeWorkflowStep].title}
                      </h3>
                      <p className="text-xs text-teal-300 font-mono">
                        {workflowSteps[activeWorkflowStep].subtitle}
                      </p>
                    </div>
                  </div>
                  <Badge variant="quantum" className="text-xs">
                    {workflowSteps[activeWorkflowStep].badge}
                  </Badge>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>

                {/* Technical Highlight */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-400 space-y-1.5">
                  <div className="text-teal-400 font-semibold flex items-center gap-2">
                    <Terminal size={14} /> Execution Protocol Details:
                  </div>
                  {activeWorkflowStep === 0 && (
                    <div className="text-emerald-300">
                      → Input array shape: (N, features) | Imputer strategy: median | Outlier clip: [-3σ, +3σ]
                    </div>
                  )}
                  {activeWorkflowStep === 1 && (
                    <div className="text-sky-300">
                      → StandardScaler fit_transform | SelectKBest(k=6, score_func=mutual_info_classif) | Reduction: 80%
                    </div>
                  )}
                  {activeWorkflowStep === 2 && (
                    <div className="text-teal-300">
                      → Qubit i rotation: RY(θ = π · x_norm[i]) | 6 Qubits initialized to |000000⟩
                    </div>
                  )}
                  {activeWorkflowStep === 3 && (
                    <div className="text-cyan-300">
                      → Ansatz: [RY(θ), RZ(φ)] × 2 layers | Ring CNOT entanglement chain q₀→q₁→q₂→q₃→q₄→q₅→q₀
                    </div>
                  )}
                  {activeWorkflowStep === 4 && (
                    <div className="text-amber-300">
                      → Output = sigmoid(⟨Z₀⟩) | Optimizer: Nelder-Mead gradient-free numerical optimization
                    </div>
                  )}
                  {activeWorkflowStep === 5 && (
                    <div className="text-emerald-300">
                      → P_hybrid = 0.60 · P_classical + 0.40 · P_quantum | Disagreement threshold = 0.50
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveWorkflowStep((prev) => (prev > 0 ? prev - 1 : workflowSteps.length - 1))}
                  >
                    ← Previous Step
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setActiveWorkflowStep((prev) => (prev < workflowSteps.length - 1 ? prev + 1 : 0))}
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Next Step →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SCIENTIFIC CREDIBILITY & HARDWARE REALITY BANNER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-teal-400">
            <Shield size={20} />
            <h3 className="text-base font-bold text-white">Scientific Credibility & Hardware Reality Alignment</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Current quantum hardware in the NISQ era faces noise and qubit count constraints. QuantumHealth AI operates in <strong>Quantum Simulation Mode</strong> using PennyLane’s <code className="bg-slate-950 px-1.5 py-0.5 rounded text-teal-300 font-mono">default.qubit</code> simulator. We present an honest, reproducible benchmark comparing classical ensembles against hybrid quantum-classical workflows on real biomedical datasets.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <CheckCircle2 size={13} className="text-emerald-400" /> PennyLane 0.45 Simulator
            </span>
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <CheckCircle2 size={13} className="text-emerald-400" /> Reproducible Seeded Splits
            </span>
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <CheckCircle2 size={13} className="text-emerald-400" /> Permutation Explainability
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
