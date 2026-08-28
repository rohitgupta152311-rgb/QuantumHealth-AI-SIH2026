import { useState, useEffect } from 'react';
import { getDiseases } from '../services/api';
import type { DiseaseInfo } from '../types';

export const useDisease = () => {
  const [diseases, setDiseases] = useState<DiseaseInfo[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<string>('diabetes');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        setIsLoading(true);
        const data = await getDiseases();
        setDiseases(data);
        if (data.length > 0 && !selectedDisease) {
          setSelectedDisease(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch diseases');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  return { diseases, selectedDisease, selectDisease: setSelectedDisease, isLoading, error };
};
