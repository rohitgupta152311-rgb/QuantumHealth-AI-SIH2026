import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import type { ProcessingStep } from '../../types';

export const ProcessingPipeline: React.FC<{ steps: ProcessingStep[] }> = ({ steps }) => {
  return (
    <div className="w-full max-w-md mx-auto py-8">
      <h3 className="text-lg font-semibold text-gray-200 mb-6 text-center">Hybrid Processing Pipeline</h3>
      <div className="space-y-6 relative">
        <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-800" />
        
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-start gap-4 relative z-10"
          >

            <div className="bg-gray-950 rounded-full p-1">
              {step.status === 'completed' && <CheckCircle className="text-green-500" size={24} />}
              {step.status === 'in_progress' && <Loader2 className="text-quantum-500 animate-spin" size={24} />}
              {step.status === 'pending' && <Circle className="text-gray-600" size={24} />}
              {step.status === 'failed' && <Circle className="text-red-500" size={24} />}
            </div>
            <div className="pt-0.5">
              <div className={`font-medium ${step.status === 'in_progress' ? 'text-quantum-400' : step.status === 'completed' ? 'text-gray-200' : 'text-gray-500'}`}>
                {step.name}
              </div>
              {step.message && (
                <div className="text-sm text-gray-400 mt-1">{step.message}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
