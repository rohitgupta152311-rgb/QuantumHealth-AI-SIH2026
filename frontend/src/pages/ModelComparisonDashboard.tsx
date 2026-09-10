import React,{ useEffect,useState } from 'react';
import { Card } from '../components/ui/Card';
import { MetricsRadarChart } from '../components/charts/MetricsRadarChart';
import { ROCCurveChart } from '../components/charts/ROCCurveChart';
import { ConfusionMatrix } from '../components/charts/ConfusionMatrix';
import { CalibrationCurveChart } from '../components/charts/CalibrationCurveChart';
import { SkeletonCard,SkeletonChart } from '../components/ui/SkeletonLoader';
import { getModelComparison,trainModels } from '../services/api';
import type { ModelComparisonResponse } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
BarChart3,Trophy,Sparkles,RefreshCw,Cpu,Activity,
HeartPulse,ShieldAlert,CheckCircle2,Zap,Droplets,Sliders,AlertTriangle,ShieldCheck,GitCommit
} from 'lucide-react';

export const ModelComparisonDashboard: React.FC = () => {
  const [data, setData] = useState<ModelComparisonResponse | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('diabetes');
  const [thresholdMode, setThresholdMode] = useState<'screening' | 'balanced' | 'rule_in'>('balanced');
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccess, setRetrainSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async (disease: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await getModelComparison(disease);
      setData(res);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Unable to load real model metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison(selectedDisease);
  }, [selectedDisease]);

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainSuccess(false);
    try {
      await trainModels(selectedDisease);
      await fetchComparison(selectedDisease);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed.');
    } finally {
      setIsRetraining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-16">
        <SkeletonCard className="h-32" />
        <div className="grid lg:grid-cols-3 gap-8">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (!data && error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <BarChart3 size={22} />
        </div>
        <div className="text-lg font-semibold text-gray-200">Real Metrics Unavailable</div>
        <p className="max-w-md text-sm text-gray-400">{error || 'Train the selected model, then refresh this page.'}</p>
        <Button onClick={() => fetchComparison(selectedDisease)}>Refresh Real Metrics</Button>
      </div>
    );
  }

  if (!data) return null;

  // Determine top accuracy model safely filtering out undefined metrics
  const validAccuracies = data.models
    .map((m) => m.accuracy)
    .filter((acc): acc is number => typeof acc === 'number' && !isNaN(acc));
  const topAcc = validAccuracies.length > 0 ? Math.max(...validAccuracies) : -1;

  const thresholdMap = {
    screening: { cutoff: 0.35, label: 'Screening (High-Sensitivity)', desc: 'Cutoff = 0.35. Prioritizes capturing all high-risk patients to minimize False Negatives.' },
    balanced: { cutoff: 0.50, label: 'Balanced (Standard)', desc: 'Cutoff = 0.50. Maximizes harmonic F1 score under calibrated Platt probabilities.' },
    rule_in: { cutoff: 0.65, label: 'Rule-In (High-Specificity)', desc: 'Cutoff = 0.65. Minimizes False Positives before invasive follow-up procedures.' },
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Research Disclaimer Banner */}
      <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2 text-amber-300/90 font-medium">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          Research & Educational Prototype. Rigorous 60/20/20 evaluation protocol with Platt calibration on held-out test split.
        </span>
        <span className="font-mono text-slate-500 hidden md:inline">SIH 2026 Problem Statement #26139</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <BarChart3 size={14} /> Comparative Evaluation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Model Benchmark Comparison</h1>
          <p className="text-slate-400 text-sm mt-1">
            Rigorous held-out evaluation of Classical Ensembles, Quantum VQCs, and Hybrid Classifiers.
          </p>
        </div>

        {/* Disease Selector Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'diabetes', name: 'Diabetes (Chinese Cohort 211k)', icon: Activity },
            { id: 'heart', name: 'Heart Disease (Cleveland Clinic)', icon: HeartPulse },
            { id: 'breast_cancer', name: 'Breast Cancer (WDBC)', icon: ShieldAlert },
            { id: 'kidney', name: 'Kidney Disease (Apollo Hospital)', icon: Droplets },
          ].map((d) => {
            const Icon = d.icon;
            const isSelected = selectedDisease === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDisease(d.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-500 shadow-sm font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon size={14} />
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scientific Verdict Banner */}
      <Card className="bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Trophy size={20} className="text-amber-400" />
              <Badge variant="hybrid" className="font-mono text-xs uppercase tracking-wider">
                VERDICT: {data.verdict.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              {data.winner && (
                <span className="text-xs text-slate-400 font-mono">Top Performer: <strong className="text-teal-300">{data.winner}</strong></span>
              )}
              {data.provenance && (
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                  <GitCommit size={12} className="text-teal-400" />
                  Checkpoint: {data.provenance.experiment_id} ({data.provenance.source})
                </span>
              )}
            </div>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              {data.verdict_explanation || data.explanation}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetrain}
            isLoading={isRetraining}
            leftIcon={retrainSuccess ? <CheckCircle2 size={16} className="text-emerald-400" /> : <RefreshCw size={16} />}
            className="flex-shrink-0 font-mono text-xs"
          >
            {retrainSuccess ? 'Benchmark Updated!' : 'Retrain & Evaluate'}
          </Button>
        </div>
      </Card>

      {/* Decision Threshold Policy Switcher */}
      <Card className="bg-slate-900/90 border-slate-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Sliders size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Clinical Operating Point / Decision Threshold
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {thresholdMap[thresholdMode].desc}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['screening', 'balanced', 'rule_in'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setThresholdMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  thresholdMode === mode
                    ? 'bg-teal-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {thresholdMap[mode].label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Visual Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card title="Multi-Metric Performance Radar" className="bg-slate-900/90 border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <BarChart3 size={17} className="text-teal-400" /> Multi-Metric Radar
          </h3>
          <p className="text-xs text-slate-400 mb-4">Normalized overlay across Accuracy, Sensitivity, Specificity, F1, and AUC.</p>
          <MetricsRadarChart metrics={data.models} />
        </Card>

        <Card title="Comparative Receiver Operating Characteristic (ROC)" className="bg-slate-900/90 border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Zap size={17} className="text-cyan-400" /> Held-out ROC-AUC
          </h3>
          <p className="text-xs text-slate-400 mb-4">True discrimination power on the locked untouched test split.</p>
          <ROCCurveChart models={data.models} />
        </Card>

        <Card title="Probability Calibration Reliability" className="bg-slate-900/90 border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <ShieldCheck size={17} className="text-emerald-400" /> Calibration Reliability
          </h3>
          <p className="text-xs text-slate-400 mb-4">Observed vs predicted probabilities via Platt Sigmoid scaling.</p>
          <CalibrationCurveChart models={data.models} />
        </Card>
      </div>

      {/* Detailed Benchmark Metrics Table */}
      <Card className="bg-slate-900/90 border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu size={18} className="text-teal-400" /> Comprehensive Clinical Evaluation Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated on the locked untouched 20% test split. Preprocessing fitted strictly on train.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            Dataset: {selectedDisease.toUpperCase()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-mono">
            <thead className="text-[11px] text-slate-400 uppercase bg-slate-950 font-bold">
              <tr>
                <th className="px-3.5 py-3 rounded-l-lg">Architecture</th>
                <th className="px-3.5 py-3">Type</th>
                <th className="px-3.5 py-3">Accuracy</th>
                <th className="px-3.5 py-3">Sensitivity</th>
                <th className="px-3.5 py-3">Specificity</th>
                <th className="px-3.5 py-3">F1 Score</th>
                <th className="px-3.5 py-3">ROC-AUC</th>
                <th className="px-3.5 py-3">PR-AUC</th>
                <th className="px-3.5 py-3">Brier Score</th>
                <th className="px-3.5 py-3 rounded-r-lg">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.models.map((m, i) => {
                const name = m.model_name || m.name || 'Model';
                const isWinner = typeof m.accuracy === 'number' && m.accuracy === topAcc && topAcc > 0;
                const mType = m.model_type || (name.includes('Hybrid') ? 'hybrid' : name.includes('VQC') ? 'quantum' : 'classical');
                const sens = m.sensitivity ?? m.recall;
                const spec = m.specificity;
                const f1 = m.f1_score ?? m.f1;
                const auc = m.roc_auc ?? m.auc;

                return (
                  <tr key={i} className={`hover:bg-slate-800/40 transition-colors ${isWinner ? 'bg-teal-500/5' : ''}`}>
                    <td className="px-3.5 py-3.5 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{name}</span>
                        {isWinner && (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            TOP ACC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        mType === 'hybrid'
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                          : mType === 'quantum'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}>
                        {mType}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 font-bold text-teal-300">
                      {typeof m.accuracy === 'number' ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3.5 py-3.5 text-slate-300">
                      {typeof sens === 'number' ? `${(sens * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3.5 py-3.5 text-slate-300">
                      {typeof spec === 'number' ? `${(spec * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3.5 py-3.5 text-slate-300">
                      {typeof f1 === 'number' ? f1.toFixed(3) : '—'}
                    </td>
                    <td className="px-3.5 py-3.5 font-bold text-teal-300">
                      {typeof auc === 'number' ? auc.toFixed(3) : '—'}
                    </td>
                    <td className="px-3.5 py-3.5 text-emerald-400">
                      {typeof m.pr_auc === 'number' ? m.pr_auc.toFixed(3) : '—'}
                    </td>
                    <td className="px-3.5 py-3.5 text-amber-300 font-mono text-xs">
                      {typeof m.brier_score === 'number' ? m.brier_score.toFixed(3) : '—'}
                    </td>
                    <td className="px-3.5 py-3.5 text-slate-400 text-xs">
                      {typeof m.inference_time_ms === 'number'
                        ? `${m.inference_time_ms.toFixed(1)} ms`
                        : typeof m.inference_time === 'number'
                          ? `${m.inference_time.toFixed(1)} ms`
                          : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Confusion Matrix Section */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card className="bg-slate-900/90 border-slate-800">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert size={18} className="text-teal-400" /> Hybrid Confusion Matrix
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Held-out test set distribution [[TN, FP], [FN, TP]].
            </p>
            {data.confusion_matrix ? (
              <ConfusionMatrix matrix={data.confusion_matrix} />
            ) : (
              <p className="text-sm text-slate-500">No confusion matrix was returned by the backend.</p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-slate-900/90 border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" /> Scientific Evaluation Protocol (SIH 2026)
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Compare the returned held-out metrics and cross-validation results directly. A hybrid or quantum model is never assumed to be superior to classical algorithms; empirical validation requires equal test sets, identical scaling transformations, and leak-free cross-validation.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1 font-sans">Classical Ensembles</span>
                <span className="text-sky-300">Fast inference (&lt;1ms), robust tabular baseline, high specificity on linear features.</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1 font-sans">Quantum VQC (Simulator)</span>
                <span className="text-teal-300">Simulated 6-qubit angle encoding capturing non-linear cross-correlations via CNOT entanglements.</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1 font-sans">Platt Calibration</span>
                <span className="text-emerald-300">Sigmoid probability scaling fitted on unaugmented validation fold for true risk realism.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

