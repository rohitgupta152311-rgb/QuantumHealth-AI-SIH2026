// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DiseaseAnalysisPage } from '../pages/DiseaseAnalysisPage';
import * as api from '../services/api';

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>();
  return {
    ...actual,
    getDiseases: vi.fn(),
    predict: vi.fn(),
    getSplitInsights: vi.fn(),
  };
});

describe('Execute button in DiseaseAnalysisPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getDiseases).mockResolvedValue([
      {
        id: 'diabetes',
        name: 'Type 2 Diabetes',
        description: 'Diabetes cohort',
        features: [
          { name: 'Age', label: 'Age', min_val: 20, max_val: 95, required: true },
          { name: 'Gender', label: 'Gender', min_val: 1, max_val: 2, required: true },
          { name: 'BMI', label: 'BMI', min_val: 12, max_val: 50, required: true },
          { name: 'SBP_mmHg', label: 'SBP', min_val: 70, max_val: 240, required: true },
          { name: 'DBP_mmHg', label: 'DBP', min_val: 40, max_val: 140, required: true },
          { name: 'FPG_mg_dL', label: 'FPG', min_val: 44, max_val: 250, required: true },
          { name: 'Cholesterol_mmol_L', label: 'Cholesterol', min_val: 2, max_val: 12, required: true },
          { name: 'Triglyceride_mmol_L', label: 'Triglycerides', min_val: 0.3, max_val: 10, required: true },
          { name: 'ALT_UL', label: 'ALT', min_val: 5, max_val: 150, required: true },
          { name: 'CCR_umol_L', label: 'CCR', min_val: 30, max_val: 150, required: true },
          { name: 'family_history_of_diabetes', label: 'Family History', min_val: 0, max_val: 1, required: true },
        ],
        status: 'ready',
      },
    ]);

    vi.mocked(api.getSplitInsights).mockResolvedValue({
      disease: 'diabetes',
      disease_name: 'Type 2 Diabetes',
      total_samples: 8348,
      prevalence_pct: 50.0,
      requested_test_pct: 20.0,
      split_breakdown: {
        train: { count: 5008, percentage: 60.0, role: 'Train' },
        validation: { count: 1670, percentage: 20.0, role: 'Validation' },
        test: { count: 1670, percentage: 20.0, role: 'Test' },
      },
      class_distribution_in_test: {
        estimated_positive_cases: 835,
        estimated_negative_cases: 835,
        stratification_maintained: true,
      },
      statistical_insights: {
        confidence_interval_95_margin_pct: 2.4,
        power_rating: 'High Statistical Power (p < 0.005)',
        power_level: 'high',
        split_recommendation: 'Gold Standard',
        split_rating: 'optimal',
        grouping_protocol: 'GroupShuffleSplit',
        cohort_insight: 'Longitudinal cohort',
        clinical_takeaway: 'Accurate evaluation',
      },
    });
  });

  it('calls predict with complete features when clicking execute', async () => {
    vi.mocked(api.predict).mockResolvedValue({
      disease: 'diabetes',
      status: 'completed',
      model_manifest_hash: 'test-hash',
      risk_level: 'low',
      classical_results: [],
      consensus: {
        agreement: 'strong_agreement',
        agreement_level: 'high',
        clinical_review_advised: false,
        classical_votes: 0,
        quantum_votes: 0,
        quantum_vote: 'low_risk',
        final_vote: 0,
        recommendation: 'consistent_prediction',
        disagreement_detected: false,
      },
      feature_importance: [],
      processing_steps: [],
      disclaimer: 'test disclaimer',
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/analyze/diabetes']}>
        <Routes>
          <Route path="/analyze/:diseaseId?" element={<DiseaseAnalysisPage />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Find the execute button
    const executeBtn = await screen.findByText('Execute Disease Analysis');
    expect(executeBtn).toBeTruthy();

    await user.click(executeBtn);

    await waitFor(() => {
      expect(api.predict).toHaveBeenCalled();
    });

    const predictCall = vi.mocked(api.predict).mock.calls[0][0];
    expect(predictCall.disease).toBe('diabetes');
    expect(Object.keys(predictCall.features).length).toBe(11);
  });
});
