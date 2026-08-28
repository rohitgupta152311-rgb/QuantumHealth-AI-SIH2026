import { useState, useCallback } from 'react';
import { predict as predictApi } from '../services/api';
import type { PredictionRequest, PredictionResponse } from '../types';

export const usePrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (request: PredictionRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await predictApi(request);
      setResult(data);
      localStorage.setItem('qhai_last_prediction', JSON.stringify(data));
      return data;
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { predict, isLoading, result, error, reset };
};
