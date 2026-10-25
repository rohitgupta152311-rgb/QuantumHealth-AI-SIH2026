// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HybridAIDashboard } from '../pages/HybridAIDashboard';
import { safeStorage } from '../utils/safeStorage';

// Mock recharts responsive container for jsdom
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
  };
});

describe('HybridAIDashboard rendering', () => {
  beforeEach(() => {
    safeStorage.removeItem('qhai_last_prediction');
  });

  it('renders empty assessment notice when no prediction is stored', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<HybridAIDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Patient Diagnostic Assessment Ready/i)).toBeTruthy();
  });

  it('renders completed diabetes prediction correctly', () => {
    const mockPrediction = {
      disease: 'diabetes',
      status: 'completed',
      model_manifest_hash: 'abc123hash',
      risk_level: 'low',
      classical_results: [
        { model: 'RandomForest', model_name: 'RandomForest', risk_probability: 0.24, prediction: 0, confidence: 0.85, is_calibrated: true },
        { model: 'SVM', model_name: 'SVM', risk_probability: 0.21, prediction: 0, confidence: 0.88, is_calibrated: true },
      ],
      quantum_result: {
        backend: 'pennylane:default.qubit',
        risk_probability: 0.28,
        prediction: 0,
        confidence: 0.75,
        circuit_depth: 17,
        qubits_used: 6,
        encoding: 'Angle RY',
        simulation_mode: true,
        execution_time_ms: 2.1,
      },
      hybrid_result: {
        risk_probability: 0.249,
        risk_percentage: 24.9,
        prediction: 0,
        confidence: 0.86,
        risk_level: 'low',
        blend_ratio_label: '95% Classical / 5% Quantum',
      },
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
      feature_importance: [
        { feature: 'FPG_mg_dL', label: 'Fasting Glucose', importance: 0.35, rank: 1 },
      ],
      explanations: {
        classical: {
          top_drivers: [
            { feature: 'FPG_mg_dL', label: 'Fasting Glucose', unit: 'mg/dL', input_value: 94, effect_on_model_score: 'decreases risk score', contribution: 0.12 }
          ]
        }
      },
      processing_steps: [],
      disclaimer: 'Research prototype',
    };

    safeStorage.setItem('qhai_last_prediction', JSON.stringify(mockPrediction));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<HybridAIDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Synthesized Diagnostic Assessment/i)).toBeTruthy();
    expect(screen.getByText(/RandomForest/i)).toBeTruthy();
    expect(screen.getByText(/PennyLane default\.qubit/i)).toBeTruthy();
  });

  it('renders abstained view correctly on sentinel or OOD', () => {
    const mockAbstained = {
      disease: 'diabetes',
      status: 'abstained',
      abstention_reason: "Required biomarker entered as missing sentinel value (0.0).",
      model_manifest_hash: 'abc123hash',
      risk_level: 'moderate',
      disclaimer: 'Safety abstention active',
    };

    safeStorage.setItem('qhai_last_prediction', JSON.stringify(mockAbstained));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<HybridAIDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Model Abstained from Prediction/i)).toBeTruthy();
    expect(screen.getByText(/Required biomarker entered as missing sentinel value/i)).toBeTruthy();
  });
});
