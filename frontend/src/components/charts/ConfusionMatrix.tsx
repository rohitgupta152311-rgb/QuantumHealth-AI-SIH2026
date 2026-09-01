import React from 'react';

interface ConfusionMatrixProps {
  matrix: number[][];
  labels?: string[];
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  matrix,
  labels = ['Negative (0)', 'Positive (1)']
}) => {
  const tn = matrix[0]?.[0] ?? 0;
  const fp = matrix[0]?.[1] ?? 0;
  const fn = matrix[1]?.[0] ?? 0;
  const tp = matrix[1]?.[1] ?? 0;

  const total = tn + fp + fn + tp || 1;
  const accuracy = ((tp + tn) / total) * 100;
  const sensitivity = (tp / (tp + fn || 1)) * 100;
  const specificity = (tn / (tn + fp || 1)) * 100;

  const cellDetails = [
    [
      { label: 'True Negative (TN)', count: tn, color: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' },
      { label: 'False Positive (FP)', count: fp, color: 'bg-rose-950/40 border-rose-500/30 text-rose-300' }
    ],
    [
      { label: 'False Negative (FN)', count: fn, color: 'bg-rose-950/40 border-rose-500/30 text-rose-300' },
      { label: 'True Positive (TP)', count: tp, color: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300' }
    ]
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center p-2">
        <div className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
          ← Predicted Class →
        </div>
        <div className="flex items-center gap-3">
          <div
            className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider text-center"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Actual Class
          </div>

          <div className="grid grid-cols-2 gap-2.5 bg-gray-950 p-3 rounded-2xl border border-gray-800">
            {cellDetails.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${cell.color} min-w-[100px] min-h-[75px]`}
                >
                  <span className="text-[10px] opacity-75 font-mono">{cell.label.split(' ')[0]}</span>
                  <span className="text-2xl font-bold font-mono my-0.5">{cell.count}</span>
                  <span className="text-[9px] opacity-60 font-mono">{((cell.count / total) * 100).toFixed(1)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Calculated held-out evaluation metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
          <span className="text-gray-500 text-[10px] block">Accuracy</span>
          <span className="text-indigo-300 font-bold">{accuracy.toFixed(1)}%</span>
        </div>
        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
          <span className="text-gray-500 text-[10px] block">Sensitivity (Recall)</span>
          <span className="text-emerald-400 font-bold">{sensitivity.toFixed(1)}%</span>
        </div>
        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
          <span className="text-gray-500 text-[10px] block">Specificity</span>
          <span className="text-purple-300 font-bold">{specificity.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
