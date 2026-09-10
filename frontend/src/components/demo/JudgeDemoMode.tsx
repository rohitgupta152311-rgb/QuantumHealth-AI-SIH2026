import React,{ useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion,AnimatePresence } from 'framer-motion';
import {
Award,ChevronRight,X,
Activity,BarChart3,FlaskConical,Users,FileText,Sparkles
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
      desc: 'Inspect 99.88% parameter compression (24 vs 18,000 params), saved ensemble fusion, ICMR ethnic recalibration, and ZNE noise mitigation.',
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
      <div className="fixed bottom-6 left-6 z-40">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 shadow-md transition-all"
        >
          <Award size={16} className="text-teal-400" />
          <span>Evaluation Rubric Tour</span>
        </motion.button>
      </div>

      {/* Slide-out Interactive Guide Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-6 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl z-50 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">SIH 2026 Evaluation Tour</h3>
                  <p className="text-[10px] text-slate-400 font-mono">100-Mark Rubric Walkthrough</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
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
                        ? 'bg-teal-500/10 border-teal-500/30 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-teal-400 font-semibold tracking-wider">{m.tag}</span>
                          {isCurrent && <span className="text-[10px] font-bold text-teal-300">ACTIVE</span>}
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 mt-0.5">{m.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{m.desc}</p>

                        {isCurrent && (
                          <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                m.action();
                                setIsOpen(false);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
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

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Problem #SIH26139</span>
              <span className="text-teal-400 font-mono font-bold">Test results require a dated report</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
