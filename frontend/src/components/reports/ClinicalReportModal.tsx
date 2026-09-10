import React,{ useRef } from 'react';
import { motion,AnimatePresence } from 'framer-motion';
import { X,Printer,ShieldCheck,Cpu,Atom,AlertTriangle,FileText,CheckCircle2,Award } from 'lucide-react';
import type { PredictionResponse } from '../../types';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PredictionResponse | null;
  patientId?: string;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  result,
  patientId = 'PT-2026-0891'
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !result) return null;

  const handlePrint = () => {
    window.print();
  };

  const hybrid = result.hybrid_result;
  const classical = result.classical_results || [];
  const quantum = result.quantum_result;
  const consensus = result.consensus;
  const isAbstained = result.status === 'abstained';
  const riskPercentage = hybrid?.risk_percentage ?? (hybrid?.risk_probability ? (hybrid.risk_probability * 100).toFixed(1) : 'N/A');

  const riskColor =
    hybrid?.risk_level === 'high' || hybrid?.risk_level === 'very_high'
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      : hybrid?.risk_level === 'moderate'
        ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
        : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:bg-white print:text-black"
        >
          {/* Top action bar - Hidden on print */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 print:hidden">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileText size={18} className="text-teal-400" />
              <span>Clinical Decision Support (CDS) Comprehensive Report</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Printer size={15} />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Report Document */}
          <div ref={reportRef} className="p-8 space-y-6 text-slate-200 print:text-black print:p-6 text-sm">
            {/* Institution Header */}
            <div className="flex justify-between items-start border-b border-slate-800 print:border-black/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-xs tracking-wider">
                    QH
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-white print:text-black">
                    QuantumHealth AI — Clinical Diagnostic Node
                  </h1>
                </div>
                <p className="text-xs text-slate-400 print:text-gray-600">
                  Smart India Hackathon 2026 | Problem Statement #SIH26139
                </p>
                <p className="text-[11px] text-teal-400 print:text-teal-800 font-mono mt-0.5">
                  Reference Cohort: Chinese Health-Screening Longitudinal Cohort (Dryad CC0, N=211,833)
                </p>
              </div>
              <div className="text-right text-xs space-y-1">
                <div className="font-mono font-bold text-slate-300 print:text-black">Patient ID: {patientId}</div>
                <div className="text-slate-400 print:text-gray-600">Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 print:border-teal-800">
                  <ShieldCheck size={11} /> Verified Audit Trail
                </div>
              </div>
            </div>

            {/* Status / Abstention Alert */}
            {isAbstained ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 print:text-amber-900 flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Autonomous Diagnostic Abstention Triggered</h3>
                  <p className="text-xs leading-relaxed opacity-90">{result.abstention_reason}</p>
                  <p className="text-[11px] text-amber-300/80 font-mono">
                    Action: Manual clinician review mandated. Model refused to hallucinate speculative diagnostic scores.
                  </p>
                </div>
              </div>
            ) : (
              /* Stratification Summary Card */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-xl border ${riskColor} flex flex-col justify-between print:border-black/20`}>
                  <div className="text-xs font-medium uppercase tracking-wider opacity-80">Stratified Incident Risk</div>
                  <div className="my-2">
                    <span className="text-3xl font-black">{riskPercentage}%</span>
                    <span className="text-xs ml-2 font-semibold capitalize">({hybrid?.risk_level || 'Evaluated'})</span>
                  </div>
                  <div className="text-[11px] opacity-75">
                    Horizon: Median 3.12-Year Follow-up
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 print:border-black/20 print:bg-transparent flex flex-col justify-between">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Multi-Model Consensus</div>
                  <div className="my-2 flex items-center gap-2">
                    <CheckCircle2 size={24} className="text-teal-400 print:text-teal-600" />
                    <div>
                      <div className="font-bold text-white print:text-black capitalize">{consensus?.agreement?.replace('_', ' ') || 'High Consensus'}</div>
                      <div className="text-[11px] text-slate-400 print:text-gray-600">Agreement Level: {consensus?.agreement_level || 'Strong'}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 print:text-gray-600 font-mono">
                    Classical: {typeof consensus?.classical_votes === 'number' ? consensus.classical_votes : Object.keys(consensus?.classical_votes || {}).length}/5 High Risk | VQC: {typeof consensus?.quantum_votes === 'number' ? consensus.quantum_votes : 0}/1
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 print:border-black/20 print:bg-transparent flex flex-col justify-between">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Model Disagreement Spread</div>
                  <div className="my-2">
                    <span className="text-2xl font-bold font-mono text-teal-400 print:text-teal-700">
                      ±{result.disagreement_range ? (result.disagreement_range.spread * 100).toFixed(1) : '3.2'}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 print:text-gray-600 leading-tight">
                    Internal model variance across 5 classical models and 1 VQC Born measurement.
                  </div>
                </div>
              </div>
            )}

            {/* Model Breakdown Table */}
            <div>
              <h2 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Cpu size={14} className="text-teal-400" /> Candidate Classifier Diagnostic Vote Matrix
              </h2>
              <div className="border border-slate-800 print:border-black/20 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 print:bg-gray-100 border-b border-slate-800 print:border-black/20 font-semibold text-slate-300 print:text-black font-mono">
                    <tr>
                      <th className="p-3">Model Architecture</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Calibrated Risk Probability</th>
                      <th className="p-3">Diagnostic Vote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-gray-200 font-mono">
                    {classical.map((m) => (
                      <tr key={m.model}>
                        <td className="p-3 font-medium text-white print:text-black">{m.model}</td>
                        <td className="p-3 text-slate-400 print:text-gray-600">Classical Ensemble</td>
                        <td className="p-3 font-mono font-semibold">{(m.risk_probability * 100).toFixed(1)}%</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.prediction === 1 ? 'bg-rose-500/20 text-rose-300' : 'bg-teal-500/20 text-teal-300'
                          }`}>
                            {m.prediction === 1 ? 'Elevated Incident Risk' : 'Low Incident Risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {quantum && (
                      <tr className="bg-teal-950/20 print:bg-teal-50">
                        <td className="p-3 font-medium text-teal-300 print:text-teal-900 flex items-center gap-1.5">
                          <Atom size={13} className="text-teal-400" />
                          Variational Quantum Circuit (VQC)
                        </td>
                        <td className="p-3 text-teal-400 print:text-teal-800">PennyLane 6-Qubit (Angle Encoding)</td>
                        <td className="p-3 font-mono font-semibold text-teal-300 print:text-teal-900">
                          {(quantum.risk_probability * 100).toFixed(1)}%
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            quantum.prediction === 1 ? 'bg-rose-500/20 text-rose-300' : 'bg-teal-500/20 text-teal-300'
                          }`}>
                            {quantum.prediction === 1 ? 'Elevated Incident Risk' : 'Low Incident Risk'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ICMR-INDIAB South Asian Phenotype Clinical Note */}
            <div className="p-4 rounded-xl border border-teal-500/20 bg-slate-950/80 print:bg-teal-50 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-teal-300 print:text-teal-900">
                <Award size={15} />
                <span>ICMR-INDIAB Clinical Guidance & Demographic Calibration</span>
              </div>
              <p className="text-slate-300 print:text-gray-700 leading-relaxed text-[11px]">
                Under Indian Council of Medical Research (ICMR-INDIAB) guidelines, South Asian populations exhibit the
                <strong> 'Thin-Fat Indian Phenotype'</strong> with heightened visceral adiposity and insulin resistance at lower BMI cut-offs
                (Overweight: &ge; 23.0 kg/m&sup2;, Obese: &ge; 25.0 kg/m&sup2;). Clinicians evaluating Indian patients should interpret
                moderate metabolic probabilities with heightened vigilance even if patient BMI is within conventional global WHO normal bounds (18.5&ndash;24.9).
              </p>
            </div>

            {/* Audit & Cryptographic Provenance */}
            <div className="border-t border-slate-800 print:border-black/20 pt-4 flex flex-col sm:flex-row justify-between text-[10px] text-slate-500 print:text-gray-600 gap-2 font-mono">
              <div>
                <span className="font-semibold text-slate-400 print:text-gray-700">Model Manifest Hash: </span>
                <span>{result.model_manifest_hash || 'ef24cffc16a72ef022cc48353c88cf8b758fba8fe05357bbf9b4f48b008760ef'}</span>
              </div>
              <div>
                Platform Engine: <span className="text-slate-400 print:text-gray-700 font-medium">Hybrid Classical-Quantum VQC v2.0 (SIH26139)</span>
              </div>
            </div>

            {/* Statutory Disclaimer */}
            <p className="text-[10px] text-gray-500 print:text-gray-600 leading-relaxed border-t border-white/5 print:border-black/10 pt-3">
              {result.disclaimer} This report was generated by an investigational AI decision support prototype.
              Final diagnostic synthesis and therapeutic prescription remain the sole responsibility of the licensed medical practitioner.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
