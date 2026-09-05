import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { RiskGauge } from '../components/charts/RiskGauge';
import { ProbabilityBreakdown } from '../components/charts/ProbabilityBreakdown';
import { ConsensusDisplay } from '../components/quantum/ConsensusDisplay';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { diseaseConfigs, getDiseaseConfig } from '../features/disease/diseaseConfig';
import {
  Activity, Cpu, ShieldCheck, AlertTriangle, ArrowRight,
  FlaskConical, BarChart3, RefreshCw, FileText, CheckCircle2,
  Stethoscope, Clock, Shield, HelpCircle
} from 'lucide-react';
import type { PredictionResponse } from '../types';

export const HybridAIDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PredictionResponse | null>(null);

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

  // Explicit empty state 1: No prediction performed yet
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
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> Model Assessment Complete
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Clinical AI Decision-Support Dashboard</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Evaluated Module: <span className="text-teal-300 font-semibold">{diseaseTitle}</span>
            {diseaseConfig?.specialty && (
              <span className="text-slate-500 ml-1.5">({diseaseConfig.specialty})</span>
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
            Print Assessment Summary
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/analyze?disease=${data.disease}`)}
            leftIcon={<RefreshCw size={15} />}
          >
            New Patient Evaluation
          </Button>
        </div>
      </div>

      {/* Primary KPI Row */}
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
              {isHighRisk ? 'Elevated Model Risk Index' : 'Baseline / Low Model Risk'}
            </Badge>
          </div>
        </Card>

        {/* Quantum-Classical Consensus Engine Card */}
        <div className="md:col-span-2">
          {data.consensus ? (
            <ConsensusDisplay consensus={data.consensus} />
          ) : (
            <Card className="h-full flex items-center justify-center text-slate-500 text-xs">
              Consensus analysis not available for this run.
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Multi-Model Probability Breakdown */}
      <Card className="bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Multi-Model Probability & Confidence Spectrum</h2>
              <p className="text-[11px] text-slate-400">
                Comparative classification across classical machine learning and PennyLane variational quantum circuits.
              </p>
            </div>
          </div>
          <Badge variant="hybrid" className="font-mono text-xs">60/40 Fusion</Badge>
        </div>

        <ProbabilityBreakdown
          classicalResults={data.classical_results}
          quantumResult={data.quantum_result}
          hybridResult={data.hybrid_result}
        />
      </Card>

      {/* Feature Sensitivity & Next Analytical Steps Row */}
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

            {/* Explicit empty state for feature importance */}
            {data.feature_importance && data.feature_importance.length > 0 ? (
              <FeatureImportanceChart features={data.feature_importance} />
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No explainability data returned for this model run.
              </div>
            )}
          </Card>
        </div>

        {/* Suggested Review Priority & Clinical Disclaimer */}
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

          {/* Medical Decision Support Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-xs text-amber-300/90 leading-relaxed space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-200 text-xs">
              <AlertTriangle size={14} /> Decision-Support Notice:
            </div>
            <p className="text-[11px]">
              {data.disclaimer || 'This platform is an experimental decision-support research tool. Predictions do not constitute verified clinical diagnoses and must be reviewed by certified medical personnel before clinical action.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
