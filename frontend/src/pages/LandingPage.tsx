import React,{ useState,useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion,useInView,AnimatePresence } from 'framer-motion';
import {
ArrowRight,Activity,Brain,Cpu,Zap,Shield,
Sparkles,CheckCircle2,Binary,HeartPulse,ShieldAlert,Droplets,
Terminal,Award
} from 'lucide-react';
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

const AnimatedCount: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
  const { count, ref } = useCounter(value, 2000);
  return <span ref={ref as React.RefObject<HTMLSpanElement>}>{count}{suffix}</span>;
};

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
    { id: '06', title: 'Consensus Engine', sub: 'Saved Hybrid Fusion', desc: 'Fuses RF + SVM + LR + XGBoost + GBM + VQC with weighted voting and disagreement detection.', icon: Shield, layer: 'Hybrid', tech: 'Consensus', trace: '→ P_hybrid = 0.60·P_classical + 0.40·P_quantum' },
  ];

  const diseases = [
    { id: 'diabetes', name: 'Incident Diabetes Risk', sub: 'Dryad/BMJ Open Chinese Cohort', samples: 211833, qubits: '11→6', isSynthetic: false, icon: Activity },
    { id: 'heart', name: 'Heart Disease Risk', sub: 'UCI Cleveland Clinical Cohort', samples: 303, qubits: '13→6', isSynthetic: false, icon: HeartPulse },
    { id: 'breast_cancer', name: 'Breast Tumor Cytopathology', sub: 'UCI Wisconsin Diagnostic (WDBC)', samples: 569, qubits: '30→6', isSynthetic: false, icon: ShieldAlert },
    { id: 'kidney', name: 'Chronic Kidney Disease Risk', sub: 'Apollo Hospitals India / UCI', samples: 400, qubits: '12→6', isSynthetic: false, icon: Droplets },
  ];

  const stats = [
    { value: 211833, label: 'Patients Across Cohorts', suffix: '+' },
    { value: 6, label: 'Total Models (5 Classical + 1 VQC)', suffix: '' },
    { value: 50, label: 'Automated Tests Passing', suffix: '/50' },
    { value: 99.88, label: 'Quantum Param Compression', suffix: '%' },
  ];

  const layerColor: Record<string, string> = {
    Classical: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    Quantum: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    Hybrid: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 space-y-24">

        {/* ═══════════ HERO ═══════════ */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Research Disclaimer Header Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-medium text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Research & Educational Decision-Support Prototype — Not for Clinical Diagnosis
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
              <Sparkles size={13} className="text-teal-400" />
              Smart India Hackathon 2026 — Problem Statement #SIH26139
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-medium text-teal-300">
              <Award size={13} className="text-teal-400" />
              Team Code 404 • NIT Nagaland
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-slate-100"
          >
            <span><TypingText text="Hybrid Quantum" delay={200} /></span>
            <br />
            <span className="text-teal-400">Intelligence</span>
            <br />
            <span className="text-slate-400 text-2xl sm:text-4xl lg:text-5xl font-semibold">
              for Clinical Disease-Risk Prediction
            </span>
          </motion.h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Combining 5 classical ML architectures with PennyLane Variational Quantum Circuits
            to assess multi-variate biomedical risk patterns with leak-free splits, 99.88% parameter compression, and calibrated probabilities.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors"
            >
              <Activity size={16} /> Start Disease Analysis
            </button>
            <button
              onClick={() => navigate('/about')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            >
              <Award size={16} /> Architecture & Methodology <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/quantum-lab')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            >
              <Cpu size={16} /> Quantum Lab
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-4xl mx-auto">
            {stats.map((s, i) => {
              return (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
                    <AnimatedCount value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════ WORKFLOW ═══════════ */}
        <ScrollReveal>
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                The <span className="text-teal-400">Hybrid</span> Workflow
              </h2>
              <p className="text-slate-400 text-sm">Six-stage pipeline from raw clinical data to consensus diagnosis.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6 items-start">
              {/* Steps List */}
              <div className="lg:col-span-2 space-y-2">
                {steps.map((s, idx) => {
                  const isCurrent = activeStep === idx;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setActiveStep(idx)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-slate-800/90 border-teal-500/40 text-slate-100 shadow-sm'
                          : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 transition-colors ${
                        isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {s.id}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${isCurrent ? 'text-slate-100' : 'text-slate-300'}`}>{s.title}</div>
                        <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded inline-block mt-0.5 border ${layerColor[s.layer]}`}>{s.layer}</div>
                      </div>
                      <Icon size={16} className={`ml-auto shrink-0 ${isCurrent ? 'text-teal-400' : 'text-slate-500'}`} />
                    </div>
                  );
                })}
              </div>

              {/* Detail Card */}
              <div className="lg:col-span-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 space-y-5 shadow-sm min-h-[300px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-3xl font-bold font-mono text-teal-400">
                            {steps[activeStep].id}
                          </div>
                          <h3 className="text-lg font-bold text-slate-100 mt-1">{steps[activeStep].title}</h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{steps[activeStep].sub}</p>
                        </div>
                        <span className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-md bg-slate-950/60 border border-slate-800 text-slate-300">
                          {steps[activeStep].tech}
                        </span>
                      </div>

                      <p className="text-slate-300 text-sm leading-relaxed">{steps[activeStep].desc}</p>

                      <div className="bg-slate-950/80 rounded-lg p-3.5 border border-slate-800 font-mono text-xs space-y-1.5">
                        <div className="text-teal-400 font-semibold flex items-center gap-2"><Terminal size={13} /> Execution Trace</div>
                        <div className="text-emerald-300">{steps[activeStep].trace}</div>
                      </div>

                      {/* Progress dots */}
                      <div className="flex gap-2 pt-2">
                        {steps.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveStep(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              i === activeStep ? 'w-8 bg-teal-500' :
                              i < activeStep ? 'w-3 bg-teal-800' : 'w-3 bg-slate-800'
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
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">Disease Modules</h2>
              <p className="text-slate-400 text-sm">Plug-and-play architecture across diverse biomedical domains.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {diseases.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 h-full flex flex-col shadow-sm hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <Icon size={20} />
                      </div>
                      <span
                        className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                          d.isSynthetic
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <AnimatedCount value={d.samples} /> {d.isSynthetic ? 'demo rows' : 'cohort records'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-100">
                        {d.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{d.sub}</p>
                      {d.isSynthetic && (
                        <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Synthetic Demonstration
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono space-y-1.5">
                      <div className="flex justify-between text-slate-400"><span>Features:</span><span className="text-slate-200">{d.qubits} Qubits</span></div>
                      <div className="flex justify-between text-slate-400"><span>Circuit:</span><span className="text-teal-400">2-Layer VQC</span></div>
                      <div className="flex justify-between text-slate-400"><span>Backend:</span><span className="text-slate-300">default.qubit</span></div>
                    </div>

                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => navigate('/analyze')}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors shadow-sm"
                      >
                        Analyze <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════ CREDIBILITY ═══════════ */}
        <ScrollReveal>
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Shield size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Scientific Integrity</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              QuantumHealth AI operates in <strong className="text-slate-100">Quantum Simulation Mode</strong> using PennyLane's <code className="bg-slate-950/80 px-1.5 py-0.5 rounded text-teal-300 font-mono text-xs border border-slate-800">default.qubit</code>.
              We present honest, reproducible benchmarks — not unverified quantum supremacy claims.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-mono">
              {['PennyLane Simulator', 'Seeded Splits', 'SHAP Explainability', 'NISQ-Era Aware'].map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400"
                >
                  <CheckCircle2 size={13} className="text-teal-400" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
};
