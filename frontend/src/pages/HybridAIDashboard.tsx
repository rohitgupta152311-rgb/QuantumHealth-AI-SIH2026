import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StepIndicator } from '../components/ui/StepIndicator';
import { RiskGauge } from '../components/charts/RiskGauge';
import { ProbabilityBreakdown } from '../components/charts/ProbabilityBreakdown';
import { ConsensusDisplay } from '../components/quantum/ConsensusDisplay';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { getDiseaseConfig } from '../features/disease/diseaseConfig';
import {
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  BarChart3,
  RefreshCw,
  FileText,
  CheckCircle2,
  Stethoscope,
  Clock,
  Shield,
  HelpCircle,
  Binary,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { PredictionResponse } from '../types';

export const HybridAIDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const saved = localStorage.getItem('qhai_last_prediction');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        localStorage.removeItem('qhai_last_prediction');
      }
    }
    setIsLoading(false);
  }, []);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6 pb-16 animate-pulse">
        <div className="h-20 bg-slate-900 rounded-xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-64 bg-slate-900 rounded-xl border border-slate-800" />
          <div className="h-64 bg-slate-900 rounded-xl border border-slate-800 md:col-span-2" />
        </div>
        <div className="h-48 bg-slate-900 rounded-xl border border-slate-800" />
      </div>
    );
  }

  // Explicit empty state: No prediction performed yet
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <Activity size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1.5">No prediction performed yet</h2>
          <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
            Execute a patient biomarker analysis in the diagnostic intake section to generate decision-support model outputs.
          </p>
        </div>
        <Button
          size="md"
          onClick={() => navigate('/analyze')}
          leftIcon={<Activity size={16} />}
        >
          Open Diagnostic Intake
        </Button>
      </div>
    );
  }

  const riskPct = data.hybrid_result?.risk_percentage ?? ((data.hybrid_result?.risk_probability || 0) * 100);
  const isHighRisk = riskPct >= 50;

  const diseaseConfig = getDiseaseConfig(data.disease);
  const diseaseTitle = diseaseConfig?.name || data.disease;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> Model Assessment Complete
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Clinical AI Decision-Support Dashboard</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Evaluated Module: <span className="text-teal-300 font-semibold">{diseaseTitle}</span>
            {diseaseConfig?.specialty && (
              <span className="text-slate-400 ml-1.5">({diseaseConfig.specialty})</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<FileText size={15} />}
          >
            Print Summary
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/analyze?disease=${data.disease}`)}
            leftIcon={<RefreshCw size={15} />}
          >
            New Analysis
          </Button>
        </div>
      </div>

      {/* Step Indicator: Completed 1 & 2 -> Step 3 View Result Active */}
      <StepIndicator
        currentStep={3}
        onStepClick={(step) => {
          if (step === 1) navigate('/');
          if (step === 2) navigate(`/analyze?disease=${data.disease}`);
        }}
      />

      {/* Mandatory Regulatory & Medical Prototype Disclaimer */}
      <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck size={18} className="text-teal-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Research Notice:</strong> Research and educational prototype only. Not for clinical diagnosis or treatment decisions.
        </div>
      </div>

      {/* Primary KPI Row: Risk Gauge & Consensus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Risk Assessment Gauge Card */}
        <Card className="flex flex-col items-center justify-center p-5 bg-slate-900 border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Integrated Risk Score
          </div>
          <RiskGauge percentage={riskPct} riskLevel={data.risk_level || (isHighRisk ? 'high' : 'low')} />
          <div className="mt-2 text-center">
            <Badge
              variant={isHighRisk ? 'danger' : 'success'}
              className="text-xs uppercase font-mono tracking-wider font-bold"
            >
              {isHighRisk ? 'Elevated Risk Index' : 'Baseline / Low Risk'}
            </Badge>
          </div>
        </Card>

        {/* Quantum-Classical Consensus Engine Card */}
        <div className="md:col-span-2">
          {data.consensus ? (
            <ConsensusDisplay consensus={data.consensus} />
          ) : (
            <Card className="h-full flex items-center justify-center text-slate-400 text-xs">
              Consensus analysis not available for this run.
            </Card>
          )}
        </div>
      </div>

      {/* Separate Consistent Cards for Classical, Quantum, and Hybrid Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Classical Result Card */}
        <Card className="border-slate-800 bg-slate-900/90 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Layers size={16} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Classical Models</h3>
            </div>
            <Badge variant="classical" className="text-[10px]">
              {data.classical_results.length} Models
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            {data.classical_results.map((c, i) => (
              <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span className="font-semibold text-slate-200">{c.model_name || c.model}</span>
                <span className="font-mono text-sky-300 font-bold">
                  {(c.risk_probability * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quantum Result Card */}
        <Card className="border-slate-800 bg-slate-900/90 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Cpu size={16} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quantum VQC Circuit</h3>
            </div>
            <Badge variant="quantum" className="text-[10px]">
              {data.quantum_result?.qubits_used || 6} Qubits
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">VQC Risk Probability</span>
              <span className="font-mono text-teal-300 font-bold">
                {data.quantum_result ? `${(data.quantum_result.risk_probability * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Encoding / Depth</span>
              <span className="font-mono text-slate-200">
                {data.quantum_result?.encoding || 'Angle (RY)'} • D={data.quantum_result?.circuit_depth || 2}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Simulator Status</span>
              <span className="font-mono text-emerald-400 text-[11px]">PennyLane Statevector</span>
            </div>
          </div>
        </Card>

        {/* Hybrid Result Card */}
        <Card className="border-slate-800 bg-slate-900/90 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles size={16} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hybrid Synthesis</h3>
            </div>
            <Badge variant="hybrid" className="text-[10px]">60/40 Weighted</Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Combined Risk</span>
              <span className="font-mono text-cyan-300 font-bold">{riskPct.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Decision Support Level</span>
              <span className="font-bold text-slate-200 uppercase font-mono text-[11px]">
                {data.hybrid_result?.risk_level || (isHighRisk ? 'Elevated' : 'Moderate / Low')}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Suggested Review Priority</span>
              <span className="font-semibold text-teal-300">
                {isHighRisk ? 'Priority Review' : 'Routine Baseline'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Multi-Model Probability Breakdown */}
      <Card className="bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Multi-Model Probability Spectrum</h2>
              <p className="text-[11px] text-slate-400">
                Exact probability and confidence values calculated by the backend models.
              </p>
            </div>
          </div>
          <Badge variant="hybrid" className="font-mono text-xs">Calibrated Spectrum</Badge>
        </div>

        <ProbabilityBreakdown
          classicalResults={data.classical_results}
          quantumResult={data.quantum_result}
          hybridResult={data.hybrid_result}
        />
      </Card>

      {/* Feature Sensitivity & Explanatory Analysis */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Feature Importance Column */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-teal-400" /> Patient Biomarker Sensitivity Spectrum
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Relative biomarker attribution rankings computed for this patient record.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/explainability')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Full Explainer →
              </Button>
            </div>

            {data.feature_importance && data.feature_importance.length > 0 ? (
              <FeatureImportanceChart features={data.feature_importance} />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No explainability metrics returned for this model run.
              </div>
            )}
          </Card>
        </div>

        {/* Quick Analytical Navigation */}
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
              <FlaskConical size={15} className="text-teal-400" /> Analytical Modules
            </h3>
            <div className="space-y-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/comparison')}
                rightIcon={<ArrowRight size={14} />}
              >
                Model Benchmarks & ROC Scores
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/quantum-lab')}
                rightIcon={<ArrowRight size={14} />}
              >
                Inspect Quantum Circuit Architecture
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/explainability')}
                rightIcon={<ArrowRight size={14} />}
              >
                Permutation Feature Importance
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
