import React from 'react';
import { Card } from '../components/ui/Card';
import { ShieldAlert,CheckCircle2,AlertTriangle,Cpu,Scale,FileText,Database,Layers } from 'lucide-react';

export const LimitationsPage: React.FC = () => {
  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
          <Scale size={14} /> Clinical Governance & Ethics
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Responsible Use & Limitations</h1>
        <p className="text-slate-400 text-sm mt-1">
          Transparent clinical decision-support boundaries, evaluation protocols, and data provenance.
        </p>
      </div>

      {/* Primary Clinical Notice */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <AlertTriangle size={18} />
          <span>Research & Educational Prototype Notice</span>
        </div>
        <p className="leading-relaxed text-amber-200/90 text-xs sm:text-sm">
          QuantumHealth AI is developed as an educational and research decision-support prototype for Smart India Hackathon (SIH) 2026. It is <strong>not a medical device</strong> and is not cleared by regulatory authorities (such as CDSCO or US FDA) for primary clinical diagnosis or prescription. All risk assessments, feature attributions, and consensus decisions must be interpreted by licensed healthcare clinicians in conjunction with standard diagnostic workflows.
        </p>
      </div>

      {/* Grid: 4 Core Governance Pillars */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pillar 1: Abstention Protocol */}
        <Card className="bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Model Abstention Policy</h3>
              <p className="text-xs text-slate-400">Zero fabricated certainty on unsafe inputs.</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unlike traditional black-box classifiers that force a prediction on every input, QuantumHealth AI enforces automated model abstention (HTTP 200 with <code className="text-teal-300 font-mono">status: "abstained"</code> and zero risk score returned) when:
          </p>
          <ul className="space-y-2 text-xs text-slate-400 font-mono">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>Missing Sentinels:</strong> Physiologically impossible values used as missing-data codes in training cohorts (e.g., Glucose = 0 or Blood Pressure = 0 in Pima).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400">•</span>
              <span><strong>Out-of-Distribution:</strong> Inputs exceeding documented biological ranges (e.g. Glucose &gt; 250 mg/dL).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400">•</span>
              <span><strong>Excessive Model Disagreement:</strong> Classical spread &gt; 0.45 or overall architectural disagreement &gt; 0.65.</span>
            </li>
          </ul>
        </Card>

        {/* Pillar 2: Data Leakage Prevention */}
        <Card className="bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Leak-Free Evaluation Protocol</h3>
              <p className="text-xs text-slate-400">Strict 60% Train / 20% Val / 20% Test splits.</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            To prevent optimistic evaluation bias that often plagues student ML hackathons:
          </p>
          <ul className="space-y-2 text-xs text-slate-400 font-mono">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Untouched Test Split:</strong> A stratified 20% test fold is locked prior to any feature transformation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Train-Only Fitting:</strong> Preprocessing pipelines (median imputers, scalers, SelectKBest) are fitted strictly on the 60% training partition.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Validation Calibration:</strong> Platt Sigmoid calibration is fitted on the separate 20% unaugmented validation set.</span>
            </li>
          </ul>
        </Card>

        {/* Pillar 3: Quantum Simulator Bounds */}
        <Card className="bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quantum Simulation Reality</h3>
              <p className="text-xs text-slate-400">PennyLane statevector simulator (default.qubit).</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All quantum circuits in QuantumHealth AI are executed in <strong>Simulation Mode</strong> using PennyLane's <code className="text-teal-300 font-mono">default.qubit</code> simulator on classical CPUs.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            While parameterized circuits (RY angle encoding with Ring CNOT entanglement) demonstrate how quantum Hilbert-space embeddings can be evaluated, we do <strong>not</strong> claim quantum supremacy on tabular medical datasets. Real QPU deployment in the NISQ era will require error mitigation and fault-tolerant hardware.
          </p>
        </Card>

        {/* Pillar 4: Explainability vs Causality */}
        <Card className="bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Attribution vs Causality</h3>
              <p className="text-xs text-slate-400">Explaining model sensitivity, not pathophysiology.</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Local drivers and feature importances indicate which input features most influenced the mathematical prediction of the ensemble and quantum circuits.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Attribution does <strong>not</strong> imply medical causality. Lowering a model's simulated score by adjusting a biomarker slider does not constitute treatment recommendations.
          </p>
        </Card>
      </div>

      {/* Provenance Table */}
      <Card className="bg-slate-900/90 border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={18} className="text-teal-400" /> Biomedical Dataset Provenance
          </h3>
          <span className="text-xs font-mono text-slate-400">Public Repositories & Demonstration Modules</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-[11px] text-slate-400 uppercase bg-slate-950 font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Disease Module</th>
                <th className="px-4 py-3">Source Citation / Repository</th>
                <th className="px-4 py-3">Source Rows</th>
                <th className="px-4 py-3">Validation Protocol</th>
                <th className="px-4 py-3 rounded-r-lg">Data Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-bold text-white">Incident Type 2 Diabetes</td>
                <td className="px-4 py-3.5 text-slate-300">Dryad / BMJ Open (Chen et al., 2018; DOI: 10.1136/bmjopen-2018-021768)</td>
                <td className="px-4 py-3.5 text-teal-300 font-bold">211,833 rows</td>
                <td className="px-4 py-3.5 text-slate-400">Multi-center grouped hospital split</td>
                <td className="px-4 py-3.5 text-emerald-400">Authentic Hospital Cohort</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-bold text-white">Heart Disease Risk</td>
                <td className="px-4 py-3.5 text-slate-300">UCI Cleveland Clinic Foundation (Detrano et al., 1989; DOI: 10.24432/C52P4X)</td>
                <td className="px-4 py-3.5 text-teal-300">303 rows</td>
                <td className="px-4 py-3.5 text-slate-400">Stratified 5-Fold Cross-Validation</td>
                <td className="px-4 py-3.5 text-emerald-400">Authentic Clinical Records</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-bold text-white">Breast Tumor Cytology</td>
                <td className="px-4 py-3.5 text-slate-300">UCI Wisconsin Diagnostic (WDBC; Street et al., 1993; DOI: 10.24432/C5DW2B)</td>
                <td className="px-4 py-3.5 text-teal-300">569 rows</td>
                <td className="px-4 py-3.5 text-slate-400">Stratified 5-Fold Cross-Validation</td>
                <td className="px-4 py-3.5 text-emerald-400">Authentic Biopsy FNA</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-bold text-white">Chronic Kidney Disease</td>
                <td className="px-4 py-3.5 text-slate-300">Apollo Hospitals Tamil Nadu / UCI (Rubini et al., 2015; DOI: 10.24432/C5G020)</td>
                <td className="px-4 py-3.5 text-teal-300">400 rows</td>
                <td className="px-4 py-3.5 text-slate-400">Stratified 5-Fold Cross-Validation</td>
                <td className="px-4 py-3.5 text-emerald-400">Authentic Hospital Cases</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Verification Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold">
            <CheckCircle2 size={16} />
            <span>Automated tests: see the dated verification report</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Statistical Reliability: 1,000-Iteration Bootstrap 95% Confidence Intervals
          </span>
        </div>
      </Card>
    </div>
  );
};
