import React,{ useEffect,useState } from 'react';
import { motion,AnimatePresence } from 'framer-motion';
import {
BookOpen,ShieldCheck,ExternalLink,CheckCircle2,X,Stethoscope,ChevronRight,Loader2
} from 'lucide-react';
import { getClinicalEvidence } from '../../services/api';
import type { BiomarkerEvidenceResponse } from '../../types';

interface ClinicalEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  biomarker: string;
  disease?: string;
}

export const ClinicalEvidenceModal: React.FC<ClinicalEvidenceModalProps> = ({
  isOpen,
  onClose,
  biomarker,
  disease = 'diabetes',
}) => {
  const [evidence, setEvidence] = useState<BiomarkerEvidenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !biomarker) return;

    const fetchEvidence = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getClinicalEvidence(biomarker, disease);
        setEvidence(data);
      } catch (err: any) {
        console.error('Failed to fetch clinical evidence:', err);
        setError(err?.message || 'Failed to retrieve authoritative guidelines');
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [isOpen, biomarker, disease]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-teal-400 font-bold tracking-wider">
                  Authoritative Clinical Evidence
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {evidence?.biomarker || biomarker}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 size={32} className="animate-spin text-teal-400" />
                <p className="text-xs font-mono text-slate-400">
                  Retrieving ICMR-INDIAB & ADA clinical consensus guidelines...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {error}
              </div>
            ) : evidence ? (
              <>
                {/* Physiological Benchmarks Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Normal Physiological Benchmark
                    </span>
                    <div className="text-emerald-400 font-mono font-bold text-base">
                      {evidence.normal_physiological_range}
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Clinical Risk Thresholds
                    </span>
                    <div className="text-rose-400 font-mono font-bold text-xs space-y-0.5">
                      <div>Warn: {evidence.warning_threshold}</div>
                      <div>Crit: {evidence.critical_threshold}</div>
                    </div>
                  </div>
                </div>

                {/* Pathophysiological Significance */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Stethoscope size={14} className="text-teal-400" /> Clinical Interpretation & Pathophysiology
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {evidence.clinical_interpretation}
                  </p>
                </div>

                {/* Published Guidelines List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Published Consensus Guidelines ({evidence.guidelines.length})
                  </div>

                  <div className="space-y-2.5">
                    {evidence.guidelines.map((g, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {g.guideline_name} ({g.year})
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{g.guideline_body}</div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">
                            {g.recommendation_tier}
                          </span>
                        </div>

                        {/* Thresholds Table */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px] font-mono">
                          {Object.entries(g.clinical_thresholds).map(([k, v]) => (
                            <div key={k} className="bg-slate-900 p-1.5 rounded border border-slate-800/80">
                              <span className="text-slate-500 text-[10px] capitalize block">{k.replace(/_/g, ' ')}:</span>
                              <span className="text-slate-200 font-semibold">{v}</span>
                            </div>
                          ))}
                        </div>

                        {g.south_asian_relevance && (
                          <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800 italic">
                            {g.south_asian_relevance}
                          </div>
                        )}

                        {g.citation_url && (
                          <div className="pt-1">
                            <a
                              href={g.citation_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink size={11} /> View Official Citation / Source
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provider Action Checklist */}
                {evidence.recommended_clinical_actions && evidence.recommended_clinical_actions.length > 0 && (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" /> Recommended Clinical Actions
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                      {evidence.recommended_clinical_actions.map((act: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight size={13} className="text-teal-400 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck size={14} className="text-teal-400" />
              Grounded in ICMR-INDIAB (2023), ADA Standards of Care (2024), AHA/ACC (2022)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              Close Evidence View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
