import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ShieldCheck, ExternalLink, CheckCircle2,
  AlertTriangle, X, Award, Stethoscope, ChevronRight, Loader2
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
          className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">
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
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
                <p className="text-xs font-mono text-gray-400">
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
                  <div className="bg-black/60 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                      Normal Physiological Benchmark
                    </span>
                    <div className="text-emerald-400 font-mono font-bold text-base">
                      {evidence.normal_physiological_range}
                    </div>
                  </div>
                  <div className="bg-black/60 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1">
                      Clinical Risk Thresholds
                    </span>
                    <div className="text-rose-400 font-mono font-bold text-xs space-y-0.5">
                      <div>Warn: {evidence.warning_threshold}</div>
                      <div>Crit: {evidence.critical_threshold}</div>
                    </div>
                  </div>
                </div>

                {/* Pathophysiological Significance */}
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Stethoscope size={14} className="text-indigo-400" /> Clinical Interpretation & Pathophysiology
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
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
                        className="bg-black/40 border border-white/[0.08] p-3.5 rounded-xl space-y-2 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {g.guideline_name} ({g.year})
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">{g.guideline_body}</div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                            {g.recommendation_tier}
                          </span>
                        </div>

                        {/* Thresholds Table */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px] font-mono">
                          {Object.entries(g.clinical_thresholds).map(([k, v]) => (
                            <div key={k} className="bg-black/60 p-1.5 rounded border border-white/[0.04]">
                              <span className="text-gray-500 text-[10px] capitalize block">{k.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-200 font-semibold">{v}</span>
                            </div>
                          ))}
                        </div>

                        {g.south_asian_relevance && (
                          <div className="text-[11px] text-gray-400 bg-white/[0.02] p-2 rounded border border-white/[0.04] italic">
                            {g.south_asian_relevance}
                          </div>
                        )}

                        {g.citation_url && (
                          <div className="pt-1">
                            <a
                              href={g.citation_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
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
                  <div className="bg-black/40 p-4 rounded-xl border border-white/[0.06] space-y-2">
                    <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" /> Recommended Clinical Actions
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-300 font-mono">
                      {evidence.recommended_clinical_actions.map((act: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight size={13} className="text-indigo-400 shrink-0 mt-0.5" />
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
          <div className="px-6 py-3.5 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck size={14} className="text-indigo-400" />
              Grounded in ICMR-INDIAB (2023), ADA Standards of Care (2024), AHA/ACC (2022)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono font-semibold text-gray-200 transition-colors"
            >
              Close Evidence View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
