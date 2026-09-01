import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Activity, Brain, Cpu, Zap, Shield, TrendingUp,
  Sparkles, CheckCircle2, Layers, Binary, HeartPulse, ShieldAlert,
  Server, GitBranch, Terminal, FlaskConical, HelpCircle, BarChart3
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
      desc: 'Ingests complex healthcare parameters (glucose, cardiac measurements, tissue metrics) with missing value handling and outlier clipping.',
      icon: Activity,
      layer: 'Classical Layer',
      badge: 'scikit-learn / pandas'
    },
    {
      step: '02',
      title: 'Dimensionality Reduction',
      subtitle: 'Classical Preprocessing',
      desc: 'Applies StandardScaler and SelectKBest mutual information to filter high-dimensional data into the 4 to 8 most impactful features.',
      icon: Brain,
      layer: 'Classical Layer',
      badge: 'Mutual Info / PCA'
    },
    {
      step: '03',
      title: 'Quantum State Encoding',
      subtitle: 'Angle Encoding (RY Gates)',
      desc: 'Encodes each scaled feature xi into the rotation angle θ = π·xi on individual qubits, mapping classical data into quantum Hilbert space.',
      icon: Binary,
      layer: 'Quantum Layer',
      badge: 'Angle Encoding'
    },
    {
      step: '04',
      title: 'Parameterized VQC Circuit',
      subtitle: 'Variational Quantum Classifier',
      desc: 'Executes parameterized RY and RZ rotation layers with ring-topology CNOT 2-qubit entanglement gates on the PennyLane simulator.',
      icon: Cpu,
      layer: 'Quantum Layer',
      badge: 'PennyLane default.qubit'
    },
    {
      step: '05',
      title: 'Quantum Measurement',
      subtitle: 'Pauli-Z Expectation',
      desc: 'Measures the expectation value ⟨Z₀⟩ on the primary register and applies a sigmoid activation function to compute quantum disease risk.',
      icon: Zap,
      layer: 'Quantum Layer',
      badge: '⟨Z₀⟩ Measurement'
    },
    {
      step: '06',
      title: 'Consensus Decision Engine',
      subtitle: 'Hybrid Intelligence Fusion',
      desc: 'Aggregates classical Random Forest, SVM, and Logistic Regression with a simulated Quantum VQC (60/40 weighted fusion) and flags research-model disagreement.',
      icon: Shield,
      layer: 'Hybrid Layer',
      badge: 'Consensus Engine'
    },
  ];

  const diseasePresets = [
    {
      id: 'diabetes',
      name: 'Type 2 Diabetes Early Risk',
      dataset: 'Pima Indians Diabetes',
      samples: '768 Patients',
      features: '8 Features → 6 Qubits',
      icon: Activity,
      color: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'border-blue-500/30',
      tagColor: 'text-blue-400',
    },
    {
      id: 'heart',
      name: 'Cardiovascular Heart Disease',
      dataset: 'Cleveland Heart Study',
      samples: '303 Patients',
      features: '13 Features → 6 Qubits',
      icon: HeartPulse,
      color: 'from-rose-500/20 to-pink-500/20',
      borderColor: 'border-rose-500/30',
      tagColor: 'text-rose-400',
    },
    {
      id: 'breast_cancer',
      name: 'Breast Cancer Diagnostic',
      dataset: 'Wisconsin Diagnostic',
      samples: '569 Patients',
      features: '30 Features → 6 Qubits',
      icon: ShieldAlert,
      color: 'from-purple-500/20 to-fuchsia-500/20',
      borderColor: 'border-purple-500/30',
      tagColor: 'text-purple-400',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-indigo-600/15 rounded-full filter blur-[140px] animate-pulse-slow" />
        <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-purple-600/15 rounded-full filter blur-[140px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-cyan-600/10 rounded-full filter blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-24 space-y-24">
        
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <Sparkles size={16} className="text-yellow-400" />
            <span>Smart India Hackathon 2026 | Problem Statement #26139</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight"
          >
            Hybrid Quantum-Classical{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">
              Intelligence
            </span>{' '}
            for Early Disease Detection
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Bridging conventional machine learning with simulated near-term Quantum Machine Learning (PennyLane VQC) to detect complex biomedical patterns in high-dimensional healthcare data.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button
              size="lg"
              onClick={() => navigate('/analyze')}
              leftIcon={<Activity size={20} />}
              className="shadow-[0_0_25px_rgba(99,102,241,0.4)] text-base px-6 py-3.5"
            >
              Start Disease Analysis
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/quantum-lab')}
              leftIcon={<Cpu size={20} />}
              className="text-base px-6 py-3.5"
            >
              Explore Quantum Lab
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/comparison')}
              leftIcon={<BarChart3 size={20} />}
              className="text-base px-6 py-3.5 border border-gray-800"
            >
              Model Benchmarks
            </Button>
          </motion.div>

          {/* Quick Metrics Strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6"
          >
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800/80 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-mono font-black text-indigo-400">3 Modules</div>
              <div className="text-xs text-gray-400 mt-1">Diabetes, Heart, Cancer</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800/80 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-mono font-black text-purple-400">6 Qubits</div>
              <div className="text-xs text-gray-400 mt-1">PennyLane default.qubit</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800/80 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-400">4-Way Fusion</div>
              <div className="text-xs text-gray-400 mt-1">RF + SVM + LR + VQC</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800/80 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">100% Offline</div>
              <div className="text-xs text-gray-400 mt-1">Quantum Simulator Mode</div>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE WORKFLOW PIPELINE */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">The Hybrid Intelligence Workflow</h2>
            <p className="text-gray-400 text-sm">
              How complex biomedical data flows through classical preprocessing, quantum state encoding, VQC simulation, and consensus prediction.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-center">
            {/* Step Selector List */}
            <div className="space-y-2.5 lg:col-span-1">
              {workflowSteps.map((s, idx) => {
                const isCurrent = activeWorkflowStep === idx;
                const Icon = s.icon;
                return (
                  <div
                    key={s.step}
                    onClick={() => setActiveWorkflowStep(idx)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-gradient-to-r from-indigo-950/70 to-purple-950/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-gray-900/50 border-gray-800/80 hover:bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {s.step}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                          {s.title}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">{s.layer}</div>
                      </div>
                    </div>
                    <Icon size={18} className={isCurrent ? 'text-quantum-400' : 'text-gray-600'} />
                  </div>
                );
              })}
            </div>

            {/* Step Detail Display Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-900/90 to-indigo-950/30 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black font-mono text-indigo-400">
                      {workflowSteps[activeWorkflowStep].step}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {workflowSteps[activeWorkflowStep].title}
                      </h3>
                      <p className="text-xs text-quantum-300 font-mono">
                        {workflowSteps[activeWorkflowStep].subtitle}
                      </p>
                    </div>
                  </div>
                  <Badge variant="quantum" className="text-xs">
                    {workflowSteps[activeWorkflowStep].badge}
                  </Badge>
                </div>

                <p className="text-gray-300 text-base leading-relaxed">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>

                {/* Visual Technical Highlight for each step */}
                <div className="bg-gray-950/80 rounded-2xl p-5 border border-gray-800 font-mono text-xs text-gray-400 space-y-2">
                  <div className="text-indigo-400 font-semibold flex items-center gap-2">
                    <Terminal size={14} /> Technical Execution Trace:
                  </div>
                  {activeWorkflowStep === 0 && (
                    <div className="text-emerald-300">
                      → Input array shape: (N, features) | Imputer strategy: median | Outlier clip: [-3σ, +3σ]
                    </div>
                  )}
                  {activeWorkflowStep === 1 && (
                    <div className="text-blue-300">
                      → StandardScaler fit_transform | SelectKBest(k=6, score_func=mutual_info_classif) | Reduction: 80%
                    </div>
                  )}
                  {activeWorkflowStep === 2 && (
                    <div className="text-purple-300">
                      → Qubit i rotation: RY(θ = π · x_norm[i]) | 6 Qubits initialized to |000000⟩
                    </div>
                  )}
                  {activeWorkflowStep === 3 && (
                    <div className="text-cyan-300">
                      → Ansatz: [RY(θ), RZ(φ)] × 2 layers | Ring CNOT entanglement chain q₀→q₁→q₂→q₃→q₄→q₅→q₀
                    </div>
                  )}
                  {activeWorkflowStep === 4 && (
                    <div className="text-yellow-300">
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

        {/* ========================================================================= */}
        {/* THREE DISEASE MODULES CARDS */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Supported Disease Modules</h2>
            <p className="text-gray-400 text-sm">
              Demonstrating architecture adaptability across three diverse biomedical diagnostic domains.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {diseasePresets.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.id}
                  className={`bg-gradient-to-b ${d.color} to-gray-900/90 border ${d.borderColor} rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 shadow-xl`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 text-white">
                        <Icon size={24} className={d.tagColor} />
                      </div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-gray-950 border border-gray-800 text-gray-400">
                        {d.samples}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{d.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{d.dataset}</p>
                    </div>

                    <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-800/80 text-xs space-y-1 font-mono">
                      <div className="text-gray-400 flex justify-between">
                        <span>Mapping:</span>
                        <span className="text-gray-200">{d.features}</span>
                      </div>
                      <div className="text-gray-400 flex justify-between">
                        <span>Ansatz:</span>
                        <span className="text-quantum-400">2-Layer VQC</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      className="w-full"
                      onClick={() => navigate('/analyze')}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Run {d.name.split(' ')[0]} Analysis
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCIENTIFIC CREDIBILITY & HARDWARE REALITY BANNER */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border border-indigo-500/20 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-3 text-indigo-400">
            <Shield size={22} />
            <h3 className="text-lg font-bold text-white">Scientific Credibility & Hardware Reality Alignment</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Current quantum hardware (NISQ era) faces decoherence and qubit count constraints. QuantumHealth AI operates in <strong>Quantum Simulation Mode</strong> using PennyLane’s <code className="bg-gray-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">default.qubit</code> device. We do not claim unverified quantum supremacy; instead, our platform presents an honest, reproducible benchmark comparing classical ensembles against hybrid quantum-classical workflows on real biomedical datasets.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1.5 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
              <CheckCircle2 size={14} className="text-emerald-400" /> PennyLane 0.45 Simulator
            </span>
            <span className="flex items-center gap-1.5 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
              <CheckCircle2 size={14} className="text-emerald-400" /> Reproducible Seeded Splits
            </span>
            <span className="flex items-center gap-1.5 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
              <CheckCircle2 size={14} className="text-emerald-400" /> Permutation Explainability
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
