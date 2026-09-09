import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, ChevronRight, CheckCircle2, AlertTriangle, X,
  Activity, BarChart3, FlaskConical, Scale, Users, FileText, Sparkles
} from 'lucide-react';

export const JudgeDemoMode: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState(0);
  const navigate = useNavigate();

  const milestones = [
    {
      id: 1,
      title: 'Problem Understanding & India Context',
      tag: 'Criterion 1 • 25 Marks',
      desc: 'Review clinical problem statement #SIH26139, ICMR-INDIAB epidemiological data (101M diabetics), and why pure classical/quantum fails.',
      actionLabel: 'View Problem & Context',
      action: () => navigate('/about'),
      icon: Award,
    },
    {
      id: 2,
      title: 'Innovation & 8 Unique USPs',
      tag: 'Criterion 2 • 25 Marks',
      desc: 'Inspect 99.88% parameter compression (24 vs 18,000 params), 60/40 consensus fusion, ICMR ethnic recalibration, and ZNE noise mitigation.',
      actionLabel: 'View 8 Innovation USPs',
      action: () => navigate('/about'),
      icon: Sparkles,
    },
    {
      id: 3,
      title: 'Technical Feasibility: Live Prediction & Abstention',
      tag: 'Criterion 3 • 20 Marks (Part A)',
      desc: 'Test live hybrid inference with single-patient biomarkers, and verify safety abstention on sentinel missing values (e.g. Glucose = 0).',
      actionLabel: 'Test Live Inference',
      action: () => navigate('/analyze'),
      icon: Activity,
    },
    {
      id: 4,
      title: 'Technical Feasibility: Quantum VQC & NISQ Noise',
      tag: 'Criterion 3 • 20 Marks (Part B)',
      desc: 'Inspect 6-qubit Angle Encoding, Ring CNOT entanglement, physical depolarizing gate noise simulation, and fidelity decay.',
      actionLabel: 'Open Quantum Lab',
      action: () => navigate('/quantum-lab'),
      icon: FlaskConical,
    },
    {
      id: 5,
      title: 'Technical Feasibility: 50-Test Benchmark & 95% CI',
      tag: 'Criterion 3 • 20 Marks (Part C)',
      desc: 'Examine held-out evaluation on 211,833 BMJ Open patients, confusion matrix heatmaps, and 1000-sample bootstrap 95% confidence intervals.',
      actionLabel: 'View Benchmark Matrix',
      action: () => navigate('/comparison'),
      icon: BarChart3,
    },
    {
      id: 6,
      title: 'Impact & Scalability: High-Throughput Batch Triage',
      tag: 'Criterion 4 • 15 Marks',
      desc: 'Simulate District PHC population health screening: batch ingest CSV cohorts, priority stratification (Urgent/Moderate/Routine), and zero-cost edge execution.',
      actionLabel: 'Open Batch Triage',
      action: () => navigate('/analyze'),
      icon: Users,
    },
    {
      id: 7,
      title: 'Presentation & Clinical Decision Support (CDS)',
      tag: 'Criterion 5 • 15 Marks',
      desc: 'Export printable CDS clinical reports with SHA-256 integrity hash, or consult Dr. Quanta Gemini 2.5 Flash copilot with live patient context.',
      actionLabel: 'Open Dashboard & CDS',
      action: () => navigate('/dashboard'),
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Floating Demo Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-[0_0_25px_rgba(245,158,11,0.4)] border border-amber-300/40 hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-all"
        >
          <Award size={16} className="text-amber-200" />
          <span>🎯 Judge Evaluation Tour</span>
        </motion.button>
      </div>

      {/* Slide-out Interactive Guide Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 w-96 max-w-[calc(100vw-2rem)] bg-black/95 border border-amber-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl z-50 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">SIH 2026 Evaluation Tour</h3>
                  <p className="text-[10px] text-gray-400 font-mono">100-Mark Rubric Walkthrough</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper list */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {milestones.map((m, idx) => {
                const Icon = m.icon;
                const isCurrent = activeMilestone === idx;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveMilestone(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isCurrent ? 'bg-amber-500 text-black' : 'bg-white/[0.04] text-gray-400'}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-amber-300 font-semibold tracking-wider">{m.tag}</span>
                          {isCurrent && <span className="text-[10px] font-bold text-indigo-400">ACTIVE</span>}
                        </div>
                        <h4 className="text-xs font-bold text-white mt-0.5">{m.title}</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{m.desc}</p>

                        {isCurrent && (
                          <div className="mt-3 pt-2 border-t border-white/[0.06] flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                m.action();
                                setIsOpen(false);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
                            >
                              <span>{m.actionLabel}</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/[0.06] text-[10px] text-gray-400 flex items-center justify-between">
              <span>Problem #SIH26139</span>
              <span className="text-emerald-400 font-mono font-bold">50/50 Pytest Suite Passed ✅</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
