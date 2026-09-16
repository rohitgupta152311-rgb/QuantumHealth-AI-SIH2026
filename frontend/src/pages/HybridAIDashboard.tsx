import React,{ useEffect,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { RiskGauge } from '../components/charts/RiskGauge';
import { ConsensusDisplay } from '../components/quantum/ConsensusDisplay';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import {
Activity,Cpu,ShieldCheck,AlertTriangle,ArrowRight,BarChart3,RefreshCw,AlertOctagon,HelpCircle,GitCommit,Printer,Award,BookOpen,Sparkles
} from 'lucide-react';
import type { PredictionResponse } from '../types';
import { ClinicalReportModal } from '../components/reports/ClinicalReportModal';
import { ClinicalEvidenceModal } from '../components/evidence/ClinicalEvidenceModal';
import { ProbabilityBreakdown } from '../components/charts/ProbabilityBreakdown';
import { StepIndicator } from '../components/ui/StepIndicator';
import { getDiseaseConfig } from '../features/disease/diseaseConfig';
import { predict } from '../services/api';

export const HybridAIDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [evidenceBiomarker, setEvidenceBiomarker] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('qhai_last_prediction');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.status === 'completed' || parsed.status === 'abstained')) {
          setData(parsed);
          return;
        }
      } catch {
        localStorage.removeItem('qhai_last_prediction');
      }
    }
  }, []);

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    setDemoError(null);
    try {
      const demoResult = await predict({
        disease: 'heart',
        features: {
          age: 58,
          sex: 1,
          cp: 2,
          trestbps: 140,
          chol: 245,
          fbs: 0,
          restecg: 1,
          thalach: 150,
          exang: 0,
          oldpeak: 1.6,
          slope: 1,
          ca: 1,
          thal: 2,
        },
        mode: 'hybrid',
      });
      if (demoResult) {
        setData(demoResult);
        localStorage.setItem('qhai_last_prediction', JSON.stringify(demoResult));
      }
    } catch (err: any) {
      setDemoError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to reach the prediction service. Please ensure the backend is running.'
      );
    } finally {
      setIsLoadingDemo(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-16 space-y-6 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <Activity size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Patient Diagnostic Assessment Ready</h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            No active patient evaluation found in this session. Configure clinical biomarkers in the intake module or execute an authenticated live demonstration run.
          </p>
        </div>

        {demoError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2.5 w-full">
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{demoError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="md"
            variant="primary"
            onClick={handleLoadDemo}
            isLoading={isLoadingDemo}
            leftIcon={<Sparkles size={16} />}
          >
            Load Live Demonstration Case
          </Button>
          <Button
            size="md"
            variant="secondary"
            onClick={() => navigate('/analyze')}
            leftIcon={<Activity size={16} />}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <AlertOctagon size={14} /> Safety Protocol Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Model Abstained from Prediction</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              Target Disease Module: <span className="text-teal-300 font-semibold font-mono uppercase">{data.disease}</span>
              {(data.is_mock || data.is_demo) && (
                <Badge variant="warning" className="px-2 py-0.5 font-mono uppercase text-[10px] tracking-wider">
                  Demo Mock Data
                </Badge>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={handleLoadDemo}
              isLoading={isLoadingDemo}
              leftIcon={<Sparkles size={16} />}
            >
              Load Verified Patient Case
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                localStorage.removeItem('qhai_last_prediction');
                navigate('/analyze');
              }}
              leftIcon={<RefreshCw size={16} />}
            >
              Adjust Biomarker Inputs
            </Button>
          </div>
        </div>

        {(data.is_mock || data.is_demo) && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span><strong>DEMO MODE:</strong> This abstention scenario was generated from demonstration mock data.</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-amber-400/80 font-bold">MOCK DATA</span>
          </div>
        )}

        <Card className="p-8 border-amber-500/30 bg-amber-500/[0.04]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-1 shrink-0">
              <AlertOctagon size={28} />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Unable to Provide a Defensible Risk Score</h2>
                <p className="text-sm text-slate-300 leading-relaxed font-mono">
                  {data.abstention_reason || "The input configuration exceeds validated empirical constraints or triggers safety boundaries."}
                </p>
              </div>

              {data.disagreement_range && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Internal Model Disagreement Range</div>
                  <div className="flex items-center gap-4 text-sm font-mono flex-wrap">
                    <span className="text-slate-300">Min Architecture Probability: <strong className="text-teal-300">{(data.disagreement_range.lower * 100).toFixed(1)}%</strong></span>
                    <span className="text-slate-300">Max Architecture Probability: <strong className="text-rose-300">{(data.disagreement_range.upper * 100).toFixed(1)}%</strong></span>
                    <span className="text-amber-400 font-bold">Spread: {(data.disagreement_range.spread * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {data.disagreement_range.label}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-teal-400" /> Scientific Rationale for Abstention
                </div>
                <p>
                  Rather than returning a false sense of certainty, QuantumHealth AI enforces algorithmic abstention when inputs represent missing sentinel values, fall outside empirical training ranges, or cause conflicting architectural signals.
                </p>
              </div>

              {data.model_manifest_hash && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <GitCommit size={14} /> Training Manifest Hash: <span className="text-slate-400 truncate">{data.model_manifest_hash}</span>
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


  const classicalDrivers = data.explanations?.classical?.top_drivers || [];
  const diseaseConfig = getDiseaseConfig(data.disease);
  const diseaseTitle = diseaseConfig?.name || data.disease;

  return (
    <div className="space-y-8 pb-16">
      {/* Step Indicator: 1. Select Cohort -> 2. Patient Biomarkers -> 3. Synthesized Diagnostic Assessment */}
      <StepIndicator
        currentStep={3}
        onStepClick={(step) => {
          if (step === 1) navigate('/');
          if (step === 2) navigate(`/analyze?disease=${data.disease}`);
        }}
      />

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> Synthesized Diagnostic Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Hybrid AI Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2 flex-wrap">
            Target Disease Module: <span className="text-teal-300 font-semibold font-mono uppercase">{diseaseTitle}</span>
            {(data.is_mock || data.is_demo) && (
              <Badge variant="warning" className="px-2.5 py-0.5 font-mono uppercase text-[11px] tracking-wider">
                Demo Mock Data
              </Badge>
            )}
            {data.model_manifest_hash && (
              <span className="ml-2 text-xs font-mono text-slate-500">
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
          >
            Export Clinical Report (PDF)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/analyze')}
            leftIcon={<RefreshCw size={16} />}
          >
            New Patient Analysis
          </Button>
        </div>
      </div>

      {/* Demo / Mock Warning Banner */}
      {(data.is_mock || data.is_demo) && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="font-bold uppercase tracking-wider text-amber-300 text-xs font-mono">
                DEMO MODE — SYNTHETIC / MOCK PREDICTION DATA
              </div>
              <div className="text-xs text-amber-200/90 mt-0.5">
                These scores and attributions are generated for illustrative UI demonstration purposes only and do not represent live backend inference.
              </div>
            </div>
          </div>
          <Badge variant="warning" className="px-3 py-1 font-mono uppercase text-[10px] tracking-wider self-end sm:self-auto">
            Mock Data
          </Badge>
        </div>
      )}

      {/* Executive Synthesis Card for Clinicians */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Award size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Executive Clinical Synthesis & Quantum Defense
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Evaluator Guideline: Primary Care Decision Context
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Saved Hybrid Ensemble
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              ICMR-INDIAB 2023
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
              1. Clinical Interpretation
            </span>
            <div className={`text-base font-bold ${isHighRisk ? 'text-rose-400' : 'text-teal-400'}`}>
              {isHighRisk ? 'Elevated Cardiometabolic Risk' : 'Low Baseline Risk Profile'}
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {isHighRisk
                ? 'Multi-variate biomarkers indicate high risk of chronic disease onset within 3-5 years per ICMR-INDIAB population benchmarks.'
                : 'Biomarkers fall within standard physiological ranges with zero immediate alarm thresholds triggered.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
              2. Why Quantum + Classical?
            </span>
            <div className="text-base font-bold text-teal-300 font-mono">
              Consensus Converged
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Classical ensemble evaluated linear/tree decision surfaces, while the 6-qubit VQC evaluated non-linear feature entanglements in a 64-dimensional Hilbert space.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
              3. Recommended Action
            </span>
            <div className="text-base font-bold text-amber-300">
              {isHighRisk ? 'Order Confirmatory Labs' : 'Routine Annual Screening'}
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
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
        <Card className="flex flex-col items-center justify-center p-6 bg-slate-900/80 border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Calibrated Risk Score
          </div>
          <RiskGauge percentage={riskPct} riskLevel={data.risk_level || (isHighRisk ? 'high' : 'low')} />
          <div className="mt-3 text-center space-y-1">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
              isHighRisk ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
            }`}>
              {isHighRisk ? 'Elevated Risk Level' : 'Low / Baseline Profile'}
            </span>
            {data.disagreement_range && (
              <div className="text-[11px] font-mono text-slate-400">
                Disagreement Spread: <span className="text-teal-300 font-bold">{(data.disagreement_range.spread * 100).toFixed(1)}%</span>
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
              <span className="text-slate-500 text-sm">Consensus data synthesized.</span>
            </Card>
          )}
        </div>
      </div>

      {/* Multi-Model Classical & Quantum Probability Breakdown */}
      <Card className="p-6 bg-slate-900/80 border-slate-800">
        <div className="pb-4 mb-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu size={18} className="text-teal-400" /> Architectural Probability & Confidence Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent calibration of classical classifiers, simulated variational quantum circuit (VQC), and the saved hybrid ensemble.
            </p>
          </div>
          <Badge variant="quantum" className="font-mono text-xs">Calibrated Ensemble</Badge>
        </div>
        <ProbabilityBreakdown
          classicalResults={data.classical_results || []}
          quantumResult={data.quantum_result}
          hybridResult={data.hybrid_result}
        />
      </Card>

      {/* Why this result? — Top Risk Drivers Panel */}
      {classicalDrivers.length > 0 && (
        <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-teal-400" /> Patient-Specific Key Risk Drivers ("Why This Result?")
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local perturbation analysis (±0.1σ shift around patient values) explaining this specific prediction.
              </p>
            </div>
            <Badge variant="default" className="font-mono text-xs">Local Perturbation</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {classicalDrivers.map((driver, idx) => {
              const isIncrease = driver.effect_on_model_score.includes('increase');
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 truncate">{driver.label || driver.feature}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isIncrease ? 'bg-rose-500/20 text-rose-300' : 'bg-teal-500/20 text-teal-300'
                    }`}>
                      {isIncrease ? '↑ Elevated' : '↓ Protective'}
                    </span>
                  </div>
                  <div className="text-lg font-mono font-extrabold text-white">
                    {driver.input_value} <span className="text-xs text-slate-400 font-normal">{driver.unit || ''}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Impact: <span className="text-teal-300 font-mono font-bold">+{(driver.contribution * 100).toFixed(1)}%</span> on risk score
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceBiomarker(driver.feature)}
                    className="w-full mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-teal-400 hover:text-teal-300 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <BookOpen size={11} className="text-teal-400 group-hover:scale-110 transition-transform" />
                      View ICMR/ADA Evidence
                    </span>
                    <span className="text-slate-500 group-hover:text-teal-300 font-bold">→</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 italic">
            * Explains internal model response behavior on this case. Does not establish clinical etiology or medical causality.
          </div>
        </Card>
      )}

      {/* Detailed Models Breakdown Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Classical Models Column */}
        <Card className="bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Classical ML Ensemble</h3>
                <span className="text-xs text-slate-400">Classical ensemble outputs</span>
              </div>
            </div>
            <Badge variant="default" className="font-mono text-xs">Classical</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-950 font-mono">
                <tr>
                  <th className="px-3.5 py-2.5 rounded-l-lg">Model</th>
                  <th className="px-3.5 py-2.5">Prediction</th>
                  <th className="px-3.5 py-2.5">Confidence (Certainty)</th>
                  <th className="px-3.5 py-2.5 rounded-r-lg">Risk Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(data.classical_results || []).map((res, idx) => {
                  const isPos = res.prediction === 'high_risk' || res.prediction === 1;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors font-mono">
                      <td className="px-3.5 py-3 font-semibold text-slate-200">{res.model || res.model_name}</td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          isPos ? 'bg-rose-500/20 text-rose-300' : 'bg-teal-500/20 text-teal-300'
                        }`}>
                          {isPos ? 'ELEVATED RISK' : 'LOW RISK'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-300">{(res.confidence * 100).toFixed(1)}%</td>
                      <td className="px-3.5 py-3 font-bold text-teal-300">{(res.risk_probability * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quantum ML Column */}
        <Card className="bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quantum VQC Simulator</h3>
                <span className="text-xs text-slate-400 font-mono">Simulated variational quantum circuit</span>
              </div>
            </div>
            <Badge variant="quantum" className="font-mono text-xs">Quantum</Badge>
          </div>

          {data.quantum_result && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 font-mono uppercase">VQC Classification</div>
                  <div className="text-xl font-bold font-mono text-teal-400">
                    {data.quantum_result.prediction === 'high_risk' || data.quantum_result.prediction === 1 ? 'ELEVATED RISK' : 'LOW RISK'}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 font-mono uppercase">Quantum Risk Probability</div>
                  <div className="text-xl font-bold font-mono text-teal-300">
                    {(data.quantum_result.risk_probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Quantum Circuit Spec Strip */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Quantum Simulator:</span>
                  <span className="text-slate-200">{data.quantum_result.backend || 'PennyLane default.qubit'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Qubits Allocated:</span>
                  <span className="text-teal-400 font-bold">{data.quantum_result.qubits_used || 6} Qubits</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ansatz Architecture:</span>
                  <span className="text-slate-200">Angle (RY) + Ring CNOT Entanglement</span>
                </div>
                <div className="flex justify-between text-slate-400">
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
                  className="text-xs text-teal-400 hover:text-teal-300"
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
        <Card className="bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-teal-400" /> Global Feature Importance (Random Forest Attribution)
            </h3>
            <span className="text-xs font-mono text-slate-400">Permutation Gini metric</span>
          </div>
          <FeatureImportanceChart features={data.feature_importance} />
          <div className="mt-2 text-[11px] text-slate-500 italic">
            * Feature importance reflects model parameter weights across the training set, not patient-specific etiology.
          </div>
        </Card>
      )}

      {/* ICMR-INDIAB Clinical Evidence Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-teal-500/20 text-xs space-y-2">
        <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
          <Award size={17} className="text-teal-400" />
          <span>ICMR-INDIAB South Asian Phenotypic Risk Calibration Note</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-xs">
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
