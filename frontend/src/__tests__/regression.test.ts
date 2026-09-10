import { describe,it,expect,vi,beforeEach } from 'vitest';
import { predict,getDemoMockPrediction,uploadDataset,getModelComparison,api } from '../services/api';
import { getDiseaseConfig } from '../features/disease/diseaseConfig';

describe('QuantumHealth AI Regression Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Prediction Fallback & Error Handling', () => {
    it('predict() rethrows backend errors (422/500/network) without fabricating mock results', async () => {
      const mockError = new Error('HTTP 422 Unprocessable Entity: Invalid features');
      vi.spyOn(api, 'post').mockRejectedValueOnce(mockError);

      await expect(
        predict({
          disease: 'diabetes',
          features: { Age: 45, FPG_mg_dL: 100 },
          mode: 'hybrid',
        })
      ).rejects.toThrow('HTTP 422 Unprocessable Entity: Invalid features');
    });

    it('predict() rethrows network failures and does not convert them into calibrated classical/PennyLane predictions', async () => {
      const networkError = new Error('Network Error: Connection refused');
      vi.spyOn(api, 'post').mockRejectedValueOnce(networkError);

      await expect(
        predict({
          disease: 'heart',
          features: { age: 50 },
          mode: 'quantum',
        })
      ).rejects.toThrow('Network Error: Connection refused');
    });

    it('getDemoMockPrediction() visibly labels mock data with is_mock and is_demo flags and clear disclaimers', () => {
      const mockDemo = getDemoMockPrediction('heart');

      expect(mockDemo.is_mock).toBe(true);
      expect(mockDemo.is_demo).toBe(true);
      expect(mockDemo.disease).toBe('heart');
      expect(mockDemo.hybrid_result).toBeDefined();
      expect(mockDemo.disclaimer).toContain('demonstration');
      expect(mockDemo.model_manifest_hash).toContain('mock-demo');
    });
  });

  describe('2. Diabetes Schema & Chinese Screening Cohort Alignment', () => {
    const diabetesConfig = getDiseaseConfig('diabetes');

    it('configures the Chinese Health-Screening Cohort (211k adults) instead of Pima Indians', () => {
      expect(diabetesConfig).toBeDefined();
      expect(diabetesConfig?.name).toContain('Diabetes');
      expect(diabetesConfig?.cohort).toContain('211,833');
    });

    it('uses strictly FPG_mg_dL and modern cohort biomarkers, with NO legacy Pima keys', () => {
      expect(diabetesConfig).toBeDefined();
      const continuousKeys = diabetesConfig!.continuousKeys;

      // Must include modern Chinese cohort features
      expect(continuousKeys).toContain('FPG_mg_dL');
      expect(continuousKeys).toContain('SBP_mmHg');
      expect(continuousKeys).toContain('DBP_mmHg');
      expect(continuousKeys).toContain('Cholesterol_mmol_L');
      expect(continuousKeys).toContain('Triglyceride_mmol_L');
      expect(continuousKeys).toContain('ALT_UL');
      expect(continuousKeys).toContain('CCR_umol_L');

      // Must NOT contain legacy Pima features
      expect(continuousKeys).not.toContain('Glucose');
      expect(continuousKeys).not.toContain('Pregnancies');
      expect(continuousKeys).not.toContain('BloodPressure');
      expect(continuousKeys).not.toContain('SkinThickness');
      expect(continuousKeys).not.toContain('Insulin');
      expect(continuousKeys).not.toContain('DiabetesPedigreeFunction');
    });

    it('presets define valid FPG_mg_dL values and zero legacy Pima keys', () => {
      expect(diabetesConfig).toBeDefined();
      const presets = diabetesConfig!.presets;
      expect(presets.length).toBeGreaterThanOrEqual(3);

      for (const preset of presets) {
        expect(preset.values).toHaveProperty('FPG_mg_dL');
        expect(preset.values).not.toHaveProperty('Glucose');
        expect(preset.values).not.toHaveProperty('Pregnancies');
        expect(preset.values).not.toHaveProperty('Insulin');
        expect(preset.values).toHaveProperty('BMI');
        expect(preset.values).toHaveProperty('SBP_mmHg');
      }
    });

    it('medians contain realistic physiological references for the Chinese screening cohort', () => {
      const medians = diabetesConfig!.medians;
      expect(medians.FPG_mg_dL).toBeCloseTo(95, -1);
      expect(medians.SBP_mmHg).toBe(120);
      expect(medians.DBP_mmHg).toBe(76);
      expect(medians.Glucose).toBeUndefined();
    });
  });

  describe('3. Dataset Upload API Contract', () => {
    it('uploadDataset() issues a POST request with multipart/form-data to /datasets/upload', async () => {
      const fakeFile = new File(['header1,header2\n1,2'], 'test_cohort.csv', { type: 'text/csv' });
      const mockResponse = {
        data: {
          dataset_id: 'ds_test_123',
          filename: 'test_cohort.csv',
          disease: 'diabetes',
          total_rows: 100,
          accepted_rows: 95,
          rejected_rows: 3,
          duplicate_rows: 2,
          validation_errors: [],
          uploaded_at: '2026-09-10T12:00:00Z',
        },
      };

      const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce(mockResponse);

      const result = await uploadDataset(fakeFile, 'diabetes');

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        '/datasets/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
        })
      );

      expect(result.dataset_id).toBe('ds_test_123');
      expect(result.accepted_rows).toBe(95);
      expect(result.rejected_rows).toBe(3);
      expect(result.duplicate_rows).toBe(2);
    });

    it('uploadDataset() propagates 422 schema validation errors from the backend', async () => {
      const fakeFile = new File(['bad_col1,bad_col2\n1,2'], 'invalid.csv', { type: 'text/csv' });
      const errorResponse = {
        response: {
          status: 422,
          data: {
            detail: 'Missing required columns: FPG_mg_dL, SBP_mmHg',
          },
        },
      };

      vi.spyOn(api, 'post').mockRejectedValueOnce(errorResponse);

      await expect(uploadDataset(fakeFile, 'diabetes')).rejects.toEqual(errorResponse);
    });
  });

  describe('4. Benchmark Integrity & Metric Provenance', () => {
    it('getModelComparison() preserves missing metrics as undefined rather than fabricating defaults', async () => {
      const rawBackendResponse = {
        data: {
          disease: 'diabetes',
          models: [
            {
              model_name: 'Classical Random Forest',
              model_type: 'classical',
              accuracy: 0.82,
              // Sensitivity, specificity, f1, auc intentionally missing from this checkpoint
            },
            {
              model_name: 'Hybrid VQC + Ensemble',
              model_type: 'hybrid',
              accuracy: 0.84,
              roc_auc: 0.89,
            },
          ],
          verdict: 'hybrid_superior',
          verdict_explanation: 'Hybrid demonstrates superior discriminative boundary.',
          dataset_split: { test_samples: 50 },
        },
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce(rawBackendResponse);

      const comparison = await getModelComparison('diabetes');

      const rf = comparison.models.find((m) => m.model_name === 'Classical Random Forest');
      expect(rf).toBeDefined();
      expect(rf?.accuracy).toBe(0.82);
      // Ensure missing metrics are undefined, NOT replaced with 0.85, 0.88, 0.84!
      expect(rf?.sensitivity).toBeUndefined();
      expect(rf?.specificity).toBeUndefined();
      expect(rf?.f1_score).toBeUndefined();
      expect(rf?.roc_auc).toBeUndefined();
      expect(rf?.brier_score).toBeUndefined();

      // Ensure provenance is tracked
      expect(comparison.provenance).toBeDefined();
      expect(comparison.provenance?.source).toBe('saved_checkpoint');
      expect(comparison.provenance?.experiment_id).toContain('diabetes');
    });

    it('getModelComparison() ignores undefined accuracies when computing winner', async () => {
      const rawBackendResponse = {
        data: {
          disease: 'kidney',
          models: [
            {
              model_name: 'Model A (Untrained)',
              model_type: 'quantum',
              accuracy: undefined as any,
            },
            {
              model_name: 'Model B',
              model_type: 'classical',
              accuracy: 0.79,
            },
          ],
          dataset_split: { test_samples: 30 },
        },
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce(rawBackendResponse);

      const comparison = await getModelComparison('kidney');
      expect(comparison.winner).toBe('Model B');
    });
  });
});
