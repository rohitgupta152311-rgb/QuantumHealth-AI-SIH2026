import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Activity, Brain, Cpu, Zap, Shield,
  Sparkles, CheckCircle2, Binary, HeartPulse, ShieldAlert,
  Terminal, BarChart3, ChevronRight, Layers, GitBranch
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ScrollReveal } from '../components/effects/PageTransition';

/* ------------------------------------------------------------------ */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return { count, ref };
}

/* ------------------------------------------------------------------ */
const TypingText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(iv);
    }, 35);
    return () => clearInterval(iv);
  }, [started, text]);

  return <span>{displayed}{displayed.length < text.length && <span className="animate-blink text-indigo-400">▌</span>}</span>;
};

/* ================================================================== */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setActiveStep(p => (p < 5 ? p + 1 : 0)), 4000);
    return () => clearInterval(iv);
  }, []);

  const steps = [
    { id: '01', title: 'Data Ingestion', sub: 'Clinical Profiles', desc: 'Ingests complex healthcare parameters with median imputation and ±3σ outlier clipping.', icon: Activity, layer: 'Classical', tech: 'scikit-learn', trace: '→ shape: (N, features) | imputer: median | clip: [-3σ, +3σ]' },
    { id: '02', title: 'Feature Selection', sub: 'Dimensionality Reduction', desc: 'StandardScaler + SelectKBest(k=6) reduces features to fit the quantum register.', icon: Brain, layer: 'Classical', tech: 'Mutual Info', trace: '→ SelectKBest(k=6, score_func=mutual_info) | reduction: 80%' },
    { id: '03', title: 'Quantum Encoding', sub: 'RY Angle Encoding', desc: 'Maps each normalized feature to a qubit rotation: RY(θ = π·x_i).', icon: Binary, layer: 'Quantum', tech: 'Angle Encoding', trace: '→ RY(θ = π · x_norm[i]) | init: |000000⟩' },
    { id: '04', title: 'VQC Execution', sub: 'Variational Quantum Circuit', desc: 'Parameterized RY/RZ rotations + CNOT ring entanglement on 6-qubit simulator.', icon: Cpu, layer: 'Quantum', tech: 'PennyLane', trace: '→ [RY(θ),RZ(φ)] × 2L | CNOT ring: q₀→q₁→...→q₅→q₀' },
    { id: '05', title: 'Measurement', sub: 'Pauli-Z Expectation', desc: 'Measures ⟨Z₀⟩ and applies sigmoid to produce quantum risk probability.', icon: Zap, layer: 'Quantum', tech: '⟨Z₀⟩', trace: '→ sigmoid(⟨Z₀⟩) | optimizer: Nelder-Mead' },
    { id: '06', title: 'Consensus Engine', sub: '60/40 Hybrid Fusion', desc: 'Fuses RF + SVM + LR + VQC with weighted voting and disagreement detection.', icon: Shield, layer: 'Hybrid', tech: 'Consensus', trace: '→ P_hybrid = 0.60·P_classical + 0.40·P_quantum' },
  ];

  const diseases = [
    { id: 'diabetes', name: 'Type 2 Diabetes', sub: 'CDC BRFSS Survey Data', samples: 253680, qubits: '8→6', icon: Activity, color: 'from-blue-500 to-indigo-600' },
    { id: 'heart', name: 'Heart Disease', sub: 'CDC BRFSS + Cleveland Study', samples: 200000, qubits: '13→6', icon: HeartPulse, color: 'from-rose-500 to-pink-600' },
    { id: 'breast_cancer', name: 'Breast Cancer', sub: 'UCI Wisconsin Diagnostic + SMOTE', samples: 50000, qubits: '30→6', icon: ShieldAlert, color: 'from-violet-500 to-purple-600' },
  ];

  const stats = [
    { value: 504, label: 'Thousand Clinical Records', suffix: 'K' },
    { value: 6, label: 'Simulated Qubits', suffix: '' },
    { value: 4, label: 'Model Fusion', suffix: '-Way' },
    { value: 97, label: 'Peak Accuracy', suffix: '%' },
  ];

  const layerColor: Record<string, string> = {
    Classical: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    Quantum: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    Hybrid: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32 space-y-32">

        {/* ═══════════ HERO ═══════════ */}
        <div className="text-center max-w-5xl mx-auto space-y-10">
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm font-semibold text-indigo-300 shadow-[0_0_30px_rgba(129,140,248,0.15)]"
          >
            <Sparkles size={16} className="text-amber-400" />
            Smart India Hackathon 2026 — Problem Statement #26139
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05]"
          >
            <span className="text-white"><TypingText text="Hybrid Quantum" delay={400} /></span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient">
              Intelligence
            </span>
            <br />
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.6 }}
              className="text-gray-400 text-3xl sm:text-4xl lg:text-5xl font-bold"
            >
              for Early Disease Detection
            </motion.span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
          >
            Combining classical ML ensembles with PennyLane Variational Quantum Circuits
            to uncover non-linear biomedical patterns invisible to traditional models.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/analyze')}
              className="btn-glow flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-[0_0_30px_rgba(129,140,248,0.4)] hover:shadow-[0_0_50px_rgba(129,140,248,0.6)] transition-shadow"
            >
              <Activity size={18} /> Start Disease Analysis <ArrowRight size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/quantum-lab')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold text-gray-300 bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
            >
              <Cpu size={18} /> Quantum Lab
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/comparison')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors"
            >
              <BarChart3 size={18} /> Benchmarks <ChevronRight size={14} />
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-3xl mx-auto"
          >
            {stats.map((s, i) => {
              const c = useCounter(s.value, 2500);
              return (
                <motion.div key={i} whileHover={{ scale: 1.05, y: -3 }}
                  className="gradient-border card-hover-glow"
                >
                  <div className="relative bg-[#030712] rounded-[1.15rem] p-5 text-center">
                    <div className="text-3xl sm:text-4xl font-black font-mono text-white" ref={c.ref as React.RefObject<HTMLDivElement>}>
                      {c.count}{s.suffix}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 font-medium">{s.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ═══════════ WORKFLOW ═══════════ */}
        <ScrollReveal>
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                The <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Hybrid</span> Workflow
              </h2>
              <p className="text-gray-500 text-sm">Six-stage pipeline from raw clinical data to consensus diagnosis.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6 items-start">
              {/* Steps List */}
              <div className="lg:col-span-2 space-y-2">
                {steps.map((s, idx) => {
                  const isCurrent = activeStep === idx;
                  const Icon = s.icon;
                  return (
                    <motion.div key={s.id} onClick={() => setActiveStep(idx)} whileHover={{ x: 6 }}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-white/[0.05] border-indigo-500/40 shadow-[0_0_25px_rgba(129,140,248,0.1)]'
                          : 'bg-transparent border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.08]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black font-mono shrink-0 transition-all ${
                        isCurrent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(129,140,248,0.4)]' : 'bg-white/[0.04] text-gray-500'
                      }`}>{s.id}</div>
                      <div className="min-w-0">
                        <div className={`text-sm font-bold truncate ${isCurrent ? 'text-white' : 'text-gray-300'}`}>{s.title}</div>
                        <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded inline-block mt-0.5 border ${layerColor[s.layer]}`}>{s.layer}</div>
                      </div>
                      <Icon size={16} className={`ml-auto shrink-0 ${isCurrent ? 'text-indigo-400' : 'text-gray-700'}`} />
                    </motion.div>
                  );
                })}
              </div>

              {/* Detail Card */}
              <div className="lg:col-span-3">
                <div className="gradient-border">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeStep} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}
                      className="relative bg-[#030712] rounded-[1.15rem] p-7 space-y-5 min-h-[320px]"
                    >
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            {steps[activeStep].id}
                          </div>
                          <h3 className="text-xl font-bold text-white mt-1">{steps[activeStep].title}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{steps[activeStep].sub}</p>
                        </div>
                        <span className="text-[11px] font-bold font-mono px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-400">
                          {steps[activeStep].tech}
                        </span>
                      </div>

                      <p className="text-gray-300 text-[15px] leading-relaxed">{steps[activeStep].desc}</p>

                      <div className="bg-black/40 rounded-xl p-4 border border-white/[0.04] font-mono text-xs space-y-2">
                        <div className="text-indigo-400 font-bold flex items-center gap-2"><Terminal size={13} /> Execution Trace</div>
                        <motion.div key={activeStep} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="text-emerald-300">{steps[activeStep].trace}</motion.div>
                      </div>

                      {/* Progress dots */}
                      <div className="flex gap-2 pt-1">
                        {steps.map((_, i) => (
                          <button key={i} onClick={() => setActiveStep(i)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              i === activeStep ? 'w-8 bg-gradient-to-r from-indigo-500 to-purple-500' :
                              i < activeStep ? 'w-3 bg-indigo-500/40' : 'w-3 bg-white/[0.06]'
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════ DISEASE CARDS ═══════════ */}
        <ScrollReveal>
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Disease Modules</h2>
              <p className="text-gray-500 text-sm">Plug-and-play architecture across diverse biomedical domains.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {diseases.map((d, i) => {
                const Icon = d.icon;
                const sc = useCounter(d.samples, 2500);
                return (
                  <ScrollReveal key={d.id} delay={i * 0.15} direction="scale">
                    <motion.div whileHover={{ y: -10 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="group gradient-border card-3d"
                    >
                      <div className="relative bg-[#030712] rounded-[1.15rem] p-6 space-y-5 h-full flex flex-col">
                        {/* Glow */}
                        <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${d.color} group-hover:opacity-40 transition-opacity`} />

                        <div className="flex items-center justify-between relative">
                          <motion.div whileHover={{ rotate: 12, scale: 1.1 }}
                            className={`p-3 rounded-xl bg-gradient-to-br ${d.color} shadow-lg`}
                          >
                            <Icon size={22} className="text-white" />
                          </motion.div>
                          <span ref={sc.ref as React.RefObject<HTMLSpanElement>}
                            className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400"
                          >
                            {sc.count} patients
                          </span>
                        </div>

                        <div className="relative">
                          <h3 className="text-xl font-bold text-white">{d.name}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{d.sub}</p>
                        </div>

                        <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04] text-xs font-mono space-y-1.5">
                          <div className="flex justify-between text-gray-500"><span>Features:</span><span className="text-gray-300">{d.qubits} Qubits</span></div>
                          <div className="flex justify-between text-gray-500"><span>Circuit:</span><span className="text-indigo-400">2-Layer VQC</span></div>
                          <div className="flex justify-between text-gray-500"><span>Backend:</span><span className="text-purple-400">default.qubit</span></div>
                        </div>

                        <div className="mt-auto pt-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/analyze')}
                            className={`btn-glow w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${d.color} shadow-lg hover:shadow-xl transition-shadow`}
                          >
                            Analyze <ArrowRight size={15} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════ CREDIBILITY ═══════════ */}
        <ScrollReveal direction="scale">
          <div className="gradient-border">
            <div className="relative bg-[#030712] rounded-[1.15rem] p-8 sm:p-10 space-y-5 overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 relative">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Shield size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Scientific Integrity</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed relative max-w-3xl">
                QuantumHealth AI operates in <strong className="text-white">Quantum Simulation Mode</strong> using PennyLane's <code className="bg-white/[0.04] px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs">default.qubit</code>. 
                We present honest, reproducible benchmarks — not unverified quantum supremacy claims.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 text-xs font-mono relative">
                {['PennyLane Simulator', 'Seeded Splits', 'SHAP Explainability', 'NISQ-Era Aware'].map((tag) => (
                  <motion.span key={tag} whileHover={{ scale: 1.05, y: -1 }}
                    className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06] text-gray-400 hover:border-indigo-500/30 hover:text-indigo-300 transition-all cursor-default"
                  >
                    <CheckCircle2 size={13} className="text-emerald-400" /> {tag}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
};
