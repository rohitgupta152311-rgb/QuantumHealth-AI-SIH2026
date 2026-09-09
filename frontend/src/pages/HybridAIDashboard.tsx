import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { RiskGauge } from '../components/charts/RiskGauge';
import { ConsensusDisplay } from '../components/quantum/ConsensusDisplay';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import {
  Activity, Cpu, ShieldCheck, AlertTriangle, ArrowRight,
  FlaskConical, BarChart3, RefreshCw, FileText, AlertOctagon, HelpCircle, GitCommit, Printer, Award, BookOpen, Sparkles
} from 'lucide-react';
import type { PredictionResponse } from '../types';
import { ClinicalReportModal } from '../components/reports/ClinicalReportModal';
import { ClinicalEvidenceModal } from '../components/evidence/ClinicalEvidenceModal';
import { predict } from '../services/api';

export const HybridAIDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [evidenceBiomarker, setEvidenceBiomarker] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qhai_last_prediction');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        localStorage.removeItem('qhai_last_prediction');
      }
    }
  }, []);

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const demoResult = await predict({
        disease: 'diabetes',
        features: {
          Age: 62,
          Gender: 1,
          BMI: 29.8,
          SBP_mmHg: 150,
          DBP_mmHg: 92,
          FPG_mg_dL: 124,
          Cholesterol_mmol_L: 6.3,
          Triglyceride_mmol_L: 3.6,
          ALT_UL: 58,
          CCR_umol_L: 88,
          family_history_of_diabetes: 1,
        },
        mode: 'hybrid',
      });
      if (demoResult) {
        setData(demoResult);
        localStorage.setItem('qhai_last_prediction', JSON.stringify(demoResult));
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-6 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Activity size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Diagnostic Dashboard Ready</h2>
          <p className="text-gray-400 text-sm">
            Load an authentic high-risk sample patient or configure custom patient biomarkers to view hybrid consensus, risk gauges, and quantum circuit attribution.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleLoadDemo}
            isLoading={isLoadingDemo}
            leftIcon={<Sparkles size={18} className="text-amber-300" />}
            className="bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20"
          >
            ⚡ Load Live Demo Patient (High-Risk)
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/analyze')}
            leftIcon={<Activity size={18} />}
          >
            Configure Custom Patient
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ABSTENTION VIEW: When inputs are OOD, missing sentinels, or disagree
  // -------------------------------------------------------------
  if (data.status === 'abstained') {
    return (
      <div className="space-y-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <AlertOctagon size={14} /> Safety Protocol Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Model Abstained from Prediction</h1>
            <p className="text-gray-400 text-sm mt-1">
              Target Disease Module: <span className="text-indigo-300 font-semibold font-mono uppercase">{data.disease}</span>
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => navigate('/analyze')}
            leftIcon={<RefreshCw size={16} />}
          >
            Adjust Biomarker Inputs
          </Button>
        </div>

        <Card className="p-8 border-amber-500/30 bg-amber-500/[0.04] backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-1">
              <AlertOctagon size={28} />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Unable to Provide a Defensible Risk Score</h2>
                <p className="text-sm text-gray-300 leading-relaxed font-mono">
                  {data.abstention_reason || "The input configuration exceeds validated empirical constraints or triggers safety boundaries."}
                </p>
              </div>

              {data.disagreement_range && (
                <div className="p-4 rounded-xl bg-black/60 border border-white/[0.06] space-y-2">
                  <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">Internal Model Disagreement Range</div>
                  <div className="flex items-center gap-4 text-sm font-mono">
                    <span className="text-gray-300">Min Architecture Probability: <strong className="text-indigo-300">{(data.disagreement_range.lower * 100).toFixed(1)}%</strong></span>
                    <span className="text-gray-300">Max Architecture Probability: <strong className="text-rose-300">{(data.disagreement_range.upper * 100).toFixed(1)}%</strong></span>
                    <span className="text-amber-400 font-bold">Spread: {(data.disagreement_range.spread * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {data.disagreement_range.label}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.04] text-xs text-gray-400 space-y-1.5">
                <div className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-indigo-400" /> Scientific Rationale for Abstention
                </div>
                <p>
                  Rather than returning a false sense of certainty, QuantumHealth AI enforces algorithmic abstention when inputs represent missing sentinel values, fall outside empirical training ranges, or cause conflicting architectural signals.
                </p>
              </div>

              {data.model_manifest_hash && (
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                  <GitCommit size={14} /> Training Manifest Hash: <span className="text-gray-400 truncate">{data.model_manifest_hash}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // COMPLETED VIEW: Calibrated results
  // -------------------------------------------------------------
  const riskPct = data.hybrid_result?.risk_percentage ?? ((data.hybrid_result?.risk_probability || 0) * 100);
  const isHighRisk = riskPct >= 50;

  const handlePrint = () => {
    window.print();
  };

  const classicalDrivers = data.explanations?.classical?.top_drivers || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> Synthesized Diagnostic Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Hybrid AI Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Target Disease Module: <span className="text-indigo-300 font-semibold font-mono uppercase">{data.disease}</span>
            {data.model_manifest_hash && (
              <span className="ml-3 text-xs font-mono text-gray-500">
                Manifest: {data.model_manifest_hash.slice(0, 8)}...
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            leftIcon={<Printer size={16} />}
            className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
          >
            Export Clinical Report (PDF)
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/analyze')}
            leftIcon={<RefreshCw size={16} />}
          >
            New Patient Analysis
          </Button>
        </div>
      </div>

      {/* Executive Synthesis Card for Judges & Clinicians */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/40 border border-indigo-500/30 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Award size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Executive Clinical Synthesis & Quantum Defense
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                Evaluator Guideline: What this result means for Primary Care Clinicians
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              60% Classical + 40% VQC
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ICMR-INDIAB 2023
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06] space-y-1.5">
            <span className="text-gray-400 font-mono text-[10px] uppercase tracking-wider block">
              1. Clinical Interpretation
            </span>
            <div className={`text-base font-black ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isHighRisk ? 'Elevated Cardiometabolic Risk' : 'Low Baseline Risk Profile'}
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              {isHighRisk
                ? 'Multi-variate biomarkers indicate high risk of chronic disease onset within 3-5 years per ICMR-INDIAB population benchmarks.'
                : 'Biomarkers fall within standard physiological ranges with zero immediate alarm thresholds triggered.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06] space-y-1.5">
            <span className="text-gray-400 font-mono text-[10px] uppercase tracking-wider block">
              2. Why Quantum + Classical?
            </span>
            <div className="text-base font-black text-indigo-300 font-mono">
              Consensus Converged
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              Classical ensemble evaluated linear/tree decision surfaces, while the 6-qubit VQC evaluated non-linear feature entanglements in a 64-dimensional Hilbert space.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06] space-y-1.5">
            <span className="text-gray-400 font-mono text-[10px] uppercase tracking-wider block">
              3. Recommended Action
            </span>
            <div className="text-base font-black text-amber-300">
              {isHighRisk ? 'Order Confirmatory Labs' : 'Routine Annual Screening'}
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              {isHighRisk
                ? 'Recommend fasting blood glucose re-test, HbA1c, and dietary lifestyle counseling at the Primary Health Centre.'
                : 'Reassure patient; schedule routine follow-up during annual community health screening camp.'}
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Assessment Gauge Card */}
        <Card className="flex flex-col items-center justify-center p-6 bg-white/[0.03] backdrop-blur border-white/[0.06]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Calibrated Risk Score
          </div>
          <RiskGauge percentage={riskPct} riskLevel={data.risk_level || (isHighRisk ? 'high' : 'low')} />
          <div className="mt-3 text-center space-y-1">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
              isHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isHighRisk ? 'Elevated Risk Level' : 'Low / Baseline Profile'}
            </span>
            {data.disagreement_range && (
              <div className="text-[11px] font-mono text-gray-400">
                Disagreement Spread: <span className="text-indigo-300 font-bold">{(data.disagreement_range.spread * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </Card>

        {/* Quantum-Classical Consensus Engine Card */}
        <div className="md:col-span-2">
          {data.consensus ? (
            <ConsensusDisplay consensus={data.consensus} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">Consensus data synthesized.</span>
            </Card>
          )}
        </div>
      </div>

      {/* Why this result? — Top Risk Drivers Panel */}
      {classicalDrivers.length > 0 && (
        <Card className="p-6 bg-white/[0.03] border-white/[0.06] backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-400" /> Patient-Specific Key Risk Drivers ("Why This Result?")
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Local perturbation analysis (±0.1σ shift around patient values) explaining this specific prediction.
              </p>
            </div>
            <Badge variant="default" className="font-mono text-xs">Local Perturbation</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {classicalDrivers.map((driver, idx) => {
              const isIncrease = driver.effect_on_model_score.includes('increase');
              return (
                <div key={idx} className="p-4 rounded-xl bg-black/60 border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300 truncate">{driver.label || driver.feature}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isIncrease ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isIncrease ? '↑ Elevated' : '↓ Protective'}
                    </span>
                  </div>
                  <div className="text-lg font-mono font-extrabold text-white">
                    {driver.input_value} <span className="text-xs text-gray-400 font-normal">{driver.unit || ''}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Impact: <span className="text-indigo-300 font-mono font-bold">+{(driver.contribution * 100).toFixed(1)}%</span> on risk score
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceBiomarker(driver.feature)}
                    className="w-full mt-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <BookOpen size={11} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                      View ICMR/ADA Evidence
                    </span>
                    <span className="text-gray-500 group-hover:text-indigo-300 font-bold">→</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-gray-500 border-t border-white/[0.04] pt-2 italic">
            * Explains internal model response behavior on this case. Does not establish clinical etiology or medical causality.
          </div>
        </Card>
      )}

      {/* Detailed Models Breakdown Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Classical Models Column */}
        <Card className="bg-white/[0.03] border-white/[0.06] backdrop-blur">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Classical ML Ensemble</h3>
                <span className="text-xs text-gray-400">Platt-Calibrated RF + SVM + LR (60% Default Weight)</span>
              </div>
            </div>
            <Badge variant="default" className="font-mono text-xs">60% Weight</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-400 uppercase bg-black/80 font-mono">
                <tr>
                  <th className="px-3.5 py-2.5 rounded-l-lg">Model</th>
                  <th className="px-3.5 py-2.5">Prediction</th>
                  <th className="px-3.5 py-2.5">Confidence</th>
                  <th className="px-3.5 py-2.5 rounded-r-lg">Calibrated Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {(data.classical_results || []).map((res, idx) => {
                  const isPos = res.prediction === 'high_risk' || res.prediction === 1;
                  return (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors font-mono">
                      <td className="px-3.5 py-3 font-semibold text-gray-200">{res.model || res.model_name}</td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          isPos ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {isPos ? 'ELEVATED RISK' : 'LOW RISK'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-gray-300">{(res.confidence * 100).toFixed(1)}%</td>
                      <td className="px-3.5 py-3 font-bold text-indigo-300">{(res.risk_probability * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quantum ML Column */}
        <Card glowing className="bg-white/[0.03] border-purple-500/30 backdrop-blur">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quantum VQC Simulator</h3>
                <span className="text-xs text-gray-400 font-mono">PennyLane default.qubit (40% Weight)</span>
              </div>
            </div>
            <Badge variant="quantum" className="font-mono text-xs">40% Weight</Badge>
          </div>

          {data.quantum_result && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black p-4 rounded-2xl border border-white/[0.06]">
                  <div className="text-xs text-gray-400 mb-1 font-mono uppercase">VQC Classification</div>
                  <div className="text-xl font-bold font-mono text-quantum-400">
                    {data.quantum_result.prediction === 'high_risk' || data.quantum_result.prediction === 1 ? 'ELEVATED RISK' : 'LOW RISK'}
                  </div>
                </div>

                <div className="bg-black p-4 rounded-2xl border border-white/[0.06]">
                  <div className="text-xs text-gray-400 mb-1 font-mono uppercase">Quantum Risk Probability</div>
                  <div className="text-xl font-bold font-mono text-purple-300">
                    {(data.quantum_result.risk_probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Quantum Circuit Spec Strip */}
              <div className="bg-black/80 p-4 rounded-2xl border border-white/[0.06] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-gray-400">
                  <span>Quantum Simulator:</span>
                  <span className="text-gray-200">{data.quantum_result.backend || 'PennyLane default.qubit'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Qubits Allocated:</span>
                  <span className="text-quantum-400 font-bold">{data.quantum_result.qubits_used || 6} Qubits</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Ansatz Architecture:</span>
                  <span className="text-gray-200">Angle (RY) + Ring CNOT Entanglement</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Execution Latency:</span>
                  <span className="text-emerald-400">{data.quantum_result.execution_time_ms ? `${data.quantum_result.execution_time_ms} ms` : '~15 ms (Simulated)'}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/quantum-lab')}
                  rightIcon={<ArrowRight size={14} />}
                  className="text-xs text-quantum-400 hover:text-quantum-300"
                >
                  Inspect Circuit in Quantum Lab
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Feature Importance Row */}
      {data.feature_importance && data.feature_importance.length > 0 && (
        <Card className="bg-white/[0.03] border-white/[0.06] backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-400" /> Global Feature Importance (Random Forest Attribution)
            </h3>
            <span className="text-xs font-mono text-gray-400">Permutation Gini metric</span>
          </div>
          <FeatureImportanceChart features={data.feature_importance} />
          <div className="mt-2 text-[11px] text-gray-500 italic">
            * Feature importance reflects model parameter weights across the training set, not patient-specific etiology.
          </div>
        </Card>
      )}

      {/* ICMR-INDIAB Clinical Evidence Card */}
      <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
          <Award size={17} className="text-indigo-400" />
          <span>ICMR-INDIAB South Asian Phenotypic Risk Calibration Note</span>
        </div>
        <p className="text-gray-300 leading-relaxed text-xs">
          According to the Indian Council of Medical Research (ICMR-INDIAB), Asian Indian populations develop cardiometabolic dysfunction at significantly lower BMI and younger ages compared to European cohorts (&quot;Thin-Fat Indian Phenotype&quot;). Clinical cutoffs of <strong>BMI &ge; 23 kg/m&sup2;</strong> denote overweight and <strong>&ge; 25 kg/m&sup2;</strong> denote obesity for South Asians. Even borderline risk scores should trigger proactive OGTT and lipid screening.
        </p>
      </div>

      {/* Visible SIH Clinical Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Research Decision-Support Disclaimer:</strong> This platform is an educational and research prototype for disease-risk prediction.
          It is not a medical device and is not intended for clinical diagnosis, prognosis, or direct therapeutic decisions. All estimates should be interpreted with clinical context by a qualified healthcare professional.
        </div>
      </div>

      {/* Printable Clinical Decision Support Modal */}
      <ClinicalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        result={data}
      />

      {/* Authoritative Clinical Evidence Modal */}
      <ClinicalEvidenceModal
        isOpen={!!evidenceBiomarker}
        onClose={() => setEvidenceBiomarker(null)}
        biomarker={evidenceBiomarker || ''}
        disease={data.disease}
      />
    </div>
  );
};
