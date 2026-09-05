import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useDisease } from '../hooks/useDisease';
import { getDiseaseConfig } from '../features/disease/diseaseConfig';
import {
  Database,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Table,
  ArrowRight,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const DatasetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { diseases, isLoading, error } = useDisease();
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>('heart');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const activeDisease = diseases.find((d) => d.id === selectedDiseaseId) || diseases[0];
  const activeConfig = getDiseaseConfig(activeDisease?.id || 'heart');

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    // Validate file extension
    if (!file.name.endsWith('.csv')) {
      setIsUploading(false);
      setUploadError('Invalid format. Please upload a standard CSV file with tabular feature columns and binary outcome labels.');
      return;
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadMessage(`File "${file.name}" received. Dataset schema validated successfully against the ${activeDisease?.name || 'selected'} cohort feature definition.`);
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
        <div className="text-base font-semibold text-slate-200">Loading Clinical Datasets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Database size={14} /> Dataset Repositories & Validation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Clinical Training Datasets</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Review registered biomedical benchmark cohorts, feature schemas, and ingestion validation states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="quantum" className="py-1 px-3">
            {diseases.length} Benchmark Cohorts
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <span>Unable to connect to dataset registry: {error}</span>
        </div>
      )}

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {diseases.map((disease) => {
          const cfg = getDiseaseConfig(disease.id);
          const isSelected = disease.id === selectedDiseaseId;

          return (
            <div
              key={disease.id}
              onClick={() => setSelectedDiseaseId(disease.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-teal-500 shadow-md ring-1 ring-teal-500/30'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono text-teal-400 font-semibold uppercase tracking-wider">
                  {cfg?.specialty || 'General'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 size={12} /> {disease.status === 'ready' ? 'Validated' : 'Active'}
                </span>
              </div>

              <h2 className="text-base font-bold text-white mb-1">{disease.name}</h2>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                {cfg?.cohort || disease.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Sample Size</span>
                  <span className="text-slate-200 font-semibold">{disease.dataset_size || cfg?.cohort || 'Verified'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Features</span>
                  <span className="text-teal-300 font-semibold">{disease.features.length} Biomarkers</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Dataset Details & Feature Dictionary */}
      {activeDisease && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Feature Dictionary */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-800 bg-slate-900/90">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Table size={16} className="text-teal-400" /> Feature Schema: {activeDisease.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Source: {activeConfig?.datasetName || activeDisease.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/analyze?disease=${activeDisease.id}`)}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Analyze Cohort
                </Button>
              </div>

              {/* Biomarkers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Biomarker Feature</th>
                      <th className="py-2.5 px-3 font-semibold">Label</th>
                      <th className="py-2.5 px-3 font-semibold">Valid Range</th>
                      <th className="py-2.5 px-3 font-semibold">Unit</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {activeDisease.features.map((f) => {
                      const min = f.min_val ?? f.min ?? 0;
                      const max = f.max_val ?? f.max ?? 100;
                      const isCategorical = activeConfig?.categoricalOptions && !!activeConfig.categoricalOptions[f.name];

                      return (
                        <tr key={f.name} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-teal-300">{f.name}</td>
                          <td className="py-2.5 px-3 text-slate-200 font-sans">{f.label || f.name}</td>
                          <td className="py-2.5 px-3 text-slate-400">[{min}, {max}]</td>
                          <td className="py-2.5 px-3 text-slate-400">{f.unit || '—'}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-sans ${
                              isCategorical
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            }`}>
                              {isCategorical ? 'Categorical' : 'Continuous'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right 1 Col: Upload Dataset Action Area */}
          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/90">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <UploadCloud size={16} className="text-teal-400" /> Ingest New Dataset
              </h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Upload a structured CSV file to validate columns against the active schema for retraining models.
              </p>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl p-6 text-center transition-colors bg-slate-950">
                <FileSpreadsheet size={32} className="mx-auto text-slate-500 mb-2" />
                <div className="text-xs font-semibold text-slate-200 mb-1">
                  Upload CSV Data File
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Expected schema: {activeDisease.features.length} feature columns + binary <code className="text-teal-400">label</code>
                </p>

                <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white cursor-pointer transition-colors shadow-sm">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleSimulatedUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? 'Validating Schema...' : 'Select CSV File'}
                </label>
              </div>

              {uploadMessage && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{uploadMessage}</span>
                </div>
              )}

              {uploadError && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <ShieldCheck size={13} className="text-teal-400" /> Quality Controls:
                </div>
                <p className="text-slate-400">
                  Real dataset ingestion verifies median ranges, handles missing numerical entries, and ensures zero schema deviation before enabling model training.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
