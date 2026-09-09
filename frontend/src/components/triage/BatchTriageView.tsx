import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UploadCloud, FileSpreadsheet, Play, CheckCircle2, AlertTriangle,
  AlertOctagon, ShieldAlert, ArrowUpDown, Download, RefreshCw, Award, Search
} from 'lucide-react';
import { predictBatch } from '../../services/api';
import type { BatchPredictionResponse, BatchPatientResult, BatchPatientItem } from '../../types';

interface BatchTriageViewProps {
  disease: string;
}

const SAMPLE_DIABETES_COHORT: BatchPatientItem[] = [
  { patient_id: 'PT-0101', features: { Age: 62, Gender: 1, BMI: 29.8, SBP_mmHg: 150, DBP_mmHg: 92, FPG_mg_dL: 124, Cholesterol_mmol_L: 6.3, Triglyceride_mmol_L: 3.6, ALT_UL: 58, CCR_umol_L: 88, family_history_of_diabetes: 1 } },
  { patient_id: 'PT-0102', features: { Age: 34, Gender: 2, BMI: 20.5, SBP_mmHg: 105, DBP_mmHg: 68, FPG_mg_dL: 88, Cholesterol_mmol_L: 4.2, Triglyceride_mmol_L: 0.95, ALT_UL: 14, CCR_umol_L: 52, family_history_of_diabetes: 0 } },
  { patient_id: 'PT-0103', features: { Age: 53, Gender: 1, BMI: 26.4, SBP_mmHg: 132, DBP_mmHg: 84, FPG_mg_dL: 112, Cholesterol_mmol_L: 5.4, Triglyceride_mmol_L: 2.2, ALT_UL: 32, CCR_umol_L: 74, family_history_of_diabetes: 0 } },
  { patient_id: 'PT-0104', features: { Age: 48, Gender: 2, BMI: 24.2, SBP_mmHg: 122, DBP_mmHg: 78, FPG_mg_dL: 94, Cholesterol_mmol_L: 4.8, Triglyceride_mmol_L: 1.4, ALT_UL: 22, CCR_umol_L: 64, family_history_of_diabetes: 0 } },
  { patient_id: 'PT-0105', features: { Age: 68, Gender: 1, BMI: 31.5, SBP_mmHg: 165, DBP_mmHg: 98, FPG_mg_dL: 145, Cholesterol_mmol_L: 6.8, Triglyceride_mmol_L: 4.1, ALT_UL: 65, CCR_umol_L: 95, family_history_of_diabetes: 1 } },
  { patient_id: 'PT-0106', features: { Age: 29, Gender: 2, BMI: 19.8, SBP_mmHg: 102, DBP_mmHg: 65, FPG_mg_dL: 82, Cholesterol_mmol_L: 3.9, Triglyceride_mmol_L: 0.8, ALT_UL: 12, CCR_umol_L: 48, family_history_of_diabetes: 0 } },
  { patient_id: 'PT-0107', features: { Age: 50, Gender: 1, BMI: 27.5, SBP_mmHg: 135, DBP_mmHg: 85, FPG_mg_dL: 0, Cholesterol_mmol_L: 5.1, Triglyceride_mmol_L: 2.0, ALT_UL: 28, CCR_umol_L: 70, family_history_of_diabetes: 0 } }, // Sentinel 0 error test
  { patient_id: 'PT-0108', features: { Age: 58, Gender: 2, BMI: 28.1, SBP_mmHg: 142, DBP_mmHg: 88, FPG_mg_dL: 118, Cholesterol_mmol_L: 5.8, Triglyceride_mmol_L: 2.8, ALT_UL: 40, CCR_umol_L: 78, family_history_of_diabetes: 1 } },
];

export const BatchTriageView: React.FC<BatchTriageViewProps> = ({ disease }) => {
  const [patients, setPatients] = useState<BatchPatientItem[]>(SAMPLE_DIABETES_COHORT);
  const [applyIcmr, setApplyIcmr] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BatchPredictionResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const handleLoadSample = () => {
    setPatients(SAMPLE_DIABETES_COHORT);
    setResults(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim());
      const parsed = lines.slice(1).map((line, idx) => {
        const vals = line.split(',').map((v) => v.trim());
        const features: Record<string, number> = {};
        headers.forEach((h, i) => {
          if (h.toLowerCase() !== 'patient_id' && h.toLowerCase() !== 'id') {
            features[h] = parseFloat(vals[i]) || 0;
          }
        });
        const idCol = headers.findIndex((h) => h.toLowerCase() === 'patient_id' || h.toLowerCase() === 'id');
        return {
          patient_id: idCol !== -1 ? vals[idCol] : `PT-${String(idx + 1).padStart(4, '0')}`,
          features,
        };
      });

      setPatients(parsed);
      setResults(null);
    };
    reader.readAsText(file);
  };

  const handleRunTriage = async () => {
    if (patients.length === 0) return;
    setIsLoading(true);
    try {
      const data = await predictBatch({
        disease,
        patients,
        mode: 'hybrid',
        apply_icmr_calibration: applyIcmr,
      });
      setResults(data);
    } catch (err) {
      console.error('Batch triage error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results) return;
    const headers = ['Patient ID', 'Status', 'Triage Priority', 'Risk Level', 'Risk Probability %', 'Top Driver', 'Reason / Action'];
    const rows = results.patients.map((p) => [
      p.patient_id,
      p.status,
      p.triage_priority,
      p.risk_level || 'N/A',
      p.risk_percentage !== null && p.risk_percentage !== undefined ? `${p.risk_percentage}%` : 'N/A',
      `"${p.top_driver || 'None'}"`,
      `"${p.abstention_reason || 'Eligible for routine protocol'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clinical_triage_batch_${disease}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPatients = (results?.patients || []).filter((p) => {
    const matchesSearch = p.patient_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || p.triage_priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
            <Users size={15} /> Hospital Cohort Screening Node
          </div>
          <h2 className="text-xl font-bold text-white">Batch Patient Triage & Automated Stratification</h2>
          <p className="text-xs text-gray-400">
            Process bulk outpatient records through the hybrid classical-quantum pipeline with instant risk categorisation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-colors"
          >
            <RefreshCw size={13} /> Load Sample Cohort (8 Cases)
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl cursor-pointer transition-colors">
            <UploadCloud size={14} className="text-indigo-400" />
            <span>Upload CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            disabled={isLoading || patients.length === 0}
            onClick={handleRunTriage}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Triage...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Execute Batch Triage ({patients.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ICMR-INDIAB Calibration Toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs">
        <div className="flex items-center gap-3">
          <Award size={18} className="text-indigo-400 shrink-0" />
          <div>
            <div className="font-bold text-indigo-300">Apply ICMR-INDIAB South Asian Phenotype Recalibration</div>
            <div className="text-[11px] text-gray-400">
              Applies Indian Council of Medical Research guidelines for Asian Indian phenotype (Overweight: BMI &ge; 23 kg/m&sup2;).
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setApplyIcmr(!applyIcmr)}
          className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
            applyIcmr ? 'bg-indigo-600' : 'bg-gray-700'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
              applyIcmr ? 'translate-x-6' : 'translate-x-1'
            } top-1 absolute`}
          />
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">Urgent Follow-Up</div>
                <div className="text-2xl font-black">{results.summary.urgent_followup}</div>
              </div>
              <ShieldAlert size={26} className="text-rose-400 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">Moderate Monitoring</div>
                <div className="text-2xl font-black">{results.summary.moderate_monitoring}</div>
              </div>
              <AlertTriangle size={26} className="text-amber-400 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">Routine Screening</div>
                <div className="text-2xl font-black">{results.summary.routine_screening}</div>
              </div>
              <CheckCircle2 size={26} className="text-emerald-400 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">Data Quality Alerts</div>
                <div className="text-2xl font-black">{results.summary.data_quality_alert}</div>
              </div>
              <AlertOctagon size={26} className="text-purple-400 opacity-80" />
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search patient ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Triage Categories</option>
                <option value="urgent_followup">Urgent Follow-Up</option>
                <option value="moderate_monitoring">Moderate Monitoring</option>
                <option value="routine_screening">Routine Screening</option>
                <option value="data_quality_alert">Data Quality Alerts</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors ml-auto"
            >
              <Download size={13} /> Export Triage Report (CSV)
            </button>
          </div>

          {/* Triage Priority Table */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-900/60 backdrop-blur-xl text-xs">
            <table className="w-full text-left">
              <thead className="bg-white/[0.04] border-b border-white/10 font-semibold text-gray-300">
                <tr>
                  <th className="p-3.5">Patient ID</th>
                  <th className="p-3.5">Triage Category</th>
                  <th className="p-3.5">Calibrated Probability</th>
                  <th className="p-3.5">Key Driver</th>
                  <th className="p-3.5">Consensus</th>
                  <th className="p-3.5">Clinical Note / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPatients.map((p) => {
                  const badgeClass =
                    p.triage_priority === 'urgent_followup'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : p.triage_priority === 'moderate_monitoring'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : p.triage_priority === 'routine_screening'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

                  return (
                    <tr key={p.patient_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white">{p.patient_id}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                          {p.triage_priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {p.risk_percentage !== null && p.risk_percentage !== undefined ? (
                          <span className="font-bold text-white">{p.risk_percentage}%</span>
                        ) : (
                          <span className="text-gray-500 italic">Abstained</span>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-300">{p.top_driver || <span className="text-gray-600">—</span>}</td>
                      <td className="p-3.5 capitalize text-gray-400">{p.consensus_agreement?.replace('_', ' ') || '—'}</td>
                      <td className="p-3.5 text-gray-400 max-w-xs truncate" title={p.abstention_reason || ''}>
                        {p.abstention_reason ? (
                          <span className="text-amber-400/90 font-mono text-[11px]">{p.abstention_reason}</span>
                        ) : (
                          <span className="text-gray-500">Standard outpatient follow-up</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};
