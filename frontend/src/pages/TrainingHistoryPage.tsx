import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getModelComparison, trainModels } from '../services/api';
import { useDisease } from '../hooks/useDisease';
import { getDiseaseConfig } from '../features/disease/diseaseConfig';
import type { ModelComparisonResponse } from '../types';
import {
  History,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const TrainingHistoryPage: React.FC = () => {
  const { diseases } = useDisease();
  const [selectedDisease, setSelectedDisease] = useState<string>('heart');
  const [data, setData] = useState<ModelComparisonResponse | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainSuccess, setTrainSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);

  const activeConfig = getDiseaseConfig(selectedDisease);

  const fetchTrainingData = async (diseaseId: string) => {
    setIsLoadingMetrics(true);
    setError(null);
    try {
      const res = await getModelComparison(diseaseId);
      setData(res);
    } catch (err: any) {
      setData(null);
      // Clean human-readable error message without raw stack traces
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          `No existing training checkpoints found for ${diseaseId}. Execute training below to generate benchmarks.`
      );
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchTrainingData(selectedDisease);
  }, [selectedDisease]);

  const handleTrain = async () => {
    setIsTraining(true);
    setError(null);
    setTrainSuccess(null);
    try {
      const res = await trainModels(selectedDisease);
      setTrainSuccess(`Training completed successfully (Experiment #${res.experiment_id}, Model Version #${res.model_version_id}).`);
      await fetchTrainingData(selectedDisease);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Training execution failed. Please verify that the backend simulation service is running.'
      );
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <History size={14} /> Model Versioning & Pipeline Runs
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Training History & Checkpoints</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Audit saved classical and quantum VQC training experiments, evaluation metrics, and model versions.
          </p>
        </div>

        {/* Retrain Action Button */}
        <Button
          size="md"
          onClick={handleTrain}
          isLoading={isTraining}
          leftIcon={<Play size={15} />}
        >
          {isTraining ? 'Training (5-Fold CV)...' : 'Train Model'}
        </Button>
      </div>

      {/* Cohort Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {diseases.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedDisease(d.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedDisease === d.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {trainSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{trainSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleTrain} isLoading={isTraining}>
            Train Now
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Experiment Details & Models Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-800 bg-slate-900/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-teal-400" /> Model Checkpoint Metrics
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cohort: <span className="text-teal-300 font-semibold">{activeConfig?.name || selectedDisease}</span>
                </p>
              </div>

              {data && (
                <Badge variant="quantum" className="text-xs">
                  Evaluation: Held-out Test Set
                </Badge>
              )}
            </div>

            {isLoadingMetrics ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                <span className="text-xs text-slate-400">Loading benchmark logs...</span>
              </div>
            ) : data && data.models && data.models.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-sans">
                      <th className="py-2.5 px-3 font-semibold">Model Architecture</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Accuracy</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Precision</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Recall</th>
                      <th className="py-2.5 px-3 font-semibold text-right">F1-Score</th>
                      <th className="py-2.5 px-3 font-semibold text-right">ROC-AUC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {data.models.map((model) => (
                      <tr key={model.name} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-3 font-sans font-semibold text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            model.name.includes('Hybrid')
                              ? 'bg-cyan-400'
                              : model.name.includes('Quantum')
                              ? 'bg-teal-400'
                              : 'bg-sky-400'
                          }`} />
                          {model.name}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-teal-300">
                          {model.accuracy !== undefined ? `${(model.accuracy * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {model.precision !== undefined ? `${(model.precision * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {model.recall !== undefined ? `${(model.recall * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {model.f1 !== undefined ? (model.f1).toFixed(3) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          {model.auc !== undefined ? (model.auc).toFixed(3) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs">
                No active training checkpoints found for this cohort.
              </div>
            )}

            {data?.explanation && (
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong>Experiment Note:</strong> {data.explanation}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Architecture & Training Specs */}
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/90 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-teal-400" /> Quantum-Classical Pipeline Specs
            </h2>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-sans">Classical Ensemble</span>
                <span className="font-semibold text-slate-200">Random Forest + Support Vector Classifier</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-sans">Quantum Classifier (VQC)</span>
                <span className="font-semibold text-teal-300">PennyLane default.qubit (Angle Encoding RY)</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-sans">Fusion Strategy</span>
                <span className="font-semibold text-cyan-300">60% Classical + 40% Quantum Consensus</span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 italic">
              Research prototype: metrics represent held-out cross-validation sets and are not clinical claims.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
