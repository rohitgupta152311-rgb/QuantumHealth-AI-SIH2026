import { useState, useEffect } from 'react';
import { getDiseases } from '../services/api';
import { diseaseConfigs } from '../features/disease/diseaseConfig';
import type { DiseaseInfo } from '../types';

const FALLBACK_REGISTRY: DiseaseInfo[] = Object.values(diseaseConfigs).map((cfg) => ({
  id: cfg.id,
  name: cfg.name,
  description: cfg.description,
  features: cfg.featureGroups.flatMap((group) =>
    group.featureKeys.map((key) => {
      const median = cfg.medians[key] ?? 50;
      return {
        name: key,
        label: key.replace(/_/g, ' '),
        min_val: 0,
        max_val: Math.max(100, median * 2.5),
        unit: '',
        description: `Biomarker parameter ${key}`,
        required: true,
      };
    })
  ),
  status: 'ready',
}));

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
        if (data.length > 0) {
          setSelectedDisease(current => current || data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch diseases');
        setDiseases(FALLBACK_REGISTRY);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  return { diseases, selectedDisease, selectDisease: setSelectedDisease, isLoading, error };
};
