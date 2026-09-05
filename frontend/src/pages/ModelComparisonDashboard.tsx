import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { MetricsRadarChart } from '../components/charts/MetricsRadarChart';
import { ROCCurveChart } from '../components/charts/ROCCurveChart';
import { ConfusionMatrix } from '../components/charts/ConfusionMatrix';
import { getModelComparison, trainModels } from '../services/api';
import type { ModelComparisonResponse } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  BarChart3,
  Trophy,
  Sparkles,
  RefreshCw,
  Cpu,
  Activity,
  HeartPulse,
  ShieldAlert,
  CheckCircle2,
  Zap,
  AlertCircle,
  Play,
} from 'lucide-react';

export const ModelComparisonDashboard: React.FC = () => {
  const [data, setData] = useState<ModelComparisonResponse | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('heart');
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccess, setRetrainSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchComparison = async (disease: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const res = await getModelComparison(disease);
      setData(res);
    } catch (err: any) {
      setData(null);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          `No existing training metrics found for ${disease}. Train this model below.`
      );
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
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Training failed.');
    } finally {
      setIsRetraining(false);
    }
  };

  const topAcc = data?.models?.length ? Math.max(...data.models.map((m) => m.accuracy)) : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <BarChart3 size={14} /> Comparative Model Benchmarks
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Algorithm Benchmark & Validation</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Empirical evaluation comparing classical algorithms against hybrid quantum-classical classifiers.
          </p>
        </div>

        {/* Disease Selector Filter */}
        <div className="flex items-center gap-2">
          {[
            { id: 'heart', name: 'Heart Disease', icon: HeartPulse },
            { id: 'breast_cancer', name: 'Breast Cancer', icon: ShieldAlert },
            { id: 'diabetes', name: 'Diabetes', icon: Activity },
          ].map((d) => {
            const Icon = d.icon;
            const isSelected = selectedDisease === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDisease(d.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
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

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
          <div className="w-9 h-9 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
          <span className="text-xs text-slate-400">Loading benchmark metrics...</span>
        </div>
      ) : !data ? (
        <Card className="border-slate-800 bg-slate-900/90 text-center py-12 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto">
            <BarChart3 size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Benchmark Checkpoint Required</h2>
            <p className="max-w-md text-xs text-slate-400 mx-auto">{error}</p>
          </div>
          <Button
            size="md"
            onClick={handleRetrain}
            isLoading={isRetraining}
            leftIcon={<Play size={15} />}
          >
            Train {selectedDisease.toUpperCase()} Model Now
          </Button>
        </Card>
      ) : (
        <>
          {/* Scientific Verdict Banner */}
          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  <Badge variant="hybrid" className="font-mono text-xs uppercase tracking-wider">
                    VERDICT: {data.verdict.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                  {data.winner && (
                    <span className="text-xs text-slate-400 font-mono">
                      Top Performer: <strong className="text-teal-300">{data.winner}</strong>
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {data.explanation}
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetrain}
                isLoading={isRetraining}
                leftIcon={retrainSuccess ? <CheckCircle2 size={15} className="text-emerald-400" /> : <RefreshCw size={15} />}
                className="flex-shrink-0 font-mono text-xs"
              >
                {retrainSuccess ? 'Benchmark Updated!' : 'Retrain & Evaluate'}
              </Button>
            </div>
          </Card>

          {/* Visual Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <BarChart3 size={16} className="text-teal-400" /> Multi-Metric Performance Radar
              </h3>
              <p className="text-xs text-slate-400 mb-4">Normalized overlay across Accuracy, Precision, Recall, F1, and AUC.</p>
              <MetricsRadarChart metrics={data.models} />
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Zap size={16} className="text-teal-400" /> Held-out ROC-AUC Scores
              </h3>
              <p className="text-xs text-slate-400 mb-4">Actual ROC-AUC values returned by the latest held-out evaluation.</p>
              <ROCCurveChart models={data.models} />
            </Card>
          </div>

          {/* Detailed Benchmark Metrics Table */}
          <Card className="bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu size={16} className="text-teal-400" /> Comprehensive Model Evaluation Matrix
              </h3>
              <span className="text-xs font-mono text-slate-400">Dataset: {selectedDisease.toUpperCase()}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950 font-bold">
                  <tr>
                    <th className="px-3.5 py-2.5 rounded-l-lg">Architecture</th>
                    <th className="px-3.5 py-2.5">Accuracy</th>
                    <th className="px-3.5 py-2.5">Precision</th>
                    <th className="px-3.5 py-2.5">Recall</th>
                    <th className="px-3.5 py-2.5">F1 Score</th>
                    <th className="px-3.5 py-2.5">ROC-AUC</th>
                    <th className="px-3.5 py-2.5 rounded-r-lg">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.models.map((m, i) => {
                    const isWinner = m.accuracy === topAcc;
                    return (
                      <tr key={i} className={`hover:bg-slate-800/40 transition-colors ${isWinner ? 'bg-teal-950/20' : ''}`}>
                        <td className="px-3.5 py-3 font-bold text-slate-100 flex items-center gap-2">
                          <span>{m.name}</span>
                          {isWinner && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                              TOP ACC
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 font-bold text-teal-300">{(m.accuracy * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3 text-slate-300">{(m.precision * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3 text-slate-300">{(m.recall * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3 text-slate-300">{(m.f1 * 100).toFixed(1)}%</td>
                        <td className="px-3.5 py-3 font-bold text-teal-400">{m.auc.toFixed(3)}</td>
                        <td className="px-3.5 py-3 text-slate-400">
                          {m.inference_time ? `${m.inference_time.toFixed(2)} ms` : '< 1 ms'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Confusion Matrix Section */}
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1">
              <Card className="bg-slate-900 border-slate-800">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-teal-400" /> Hybrid Confusion Matrix
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Held-out test set classification matrix.
                </p>
                {data.confusion_matrix ? (
                  <ConfusionMatrix matrix={data.confusion_matrix} />
                ) : (
                  <p className="text-xs text-slate-400">No confusion matrix returned by the backend.</p>
                )}
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="bg-slate-900 border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-400" /> Experimental Methodology & Interpretation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Models are evaluated using 5-fold cross-validation and tested on an independent held-out patient cohort. Quantum VQC advantages are realized when biological biomarkers exhibit non-linear higher-order correlations that classical shallow models cannot easily separate.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block mb-1">Classical Model Attributes</span>
                    <span className="text-sky-300">Sub-millisecond inference, strong tabular baseline, robust on collinear linear data.</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block mb-1">Quantum VQC Attributes</span>
                    <span className="text-teal-300">Entangled multi-qubit feature mapping, parameterized rotation ansatz in Hilbert space.</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
