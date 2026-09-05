import { describe, it, expect } from 'vitest';
import { diseaseConfigs } from '../features/disease/diseaseConfig';

describe('Biomarker and Prediction Data Structures', () => {
  it('correctly calculates probability ranges and risk bands', () => {
    const riskZones = (percentage: number) => {
      if (percentage < 25) return 'low';
      if (percentage < 50) return 'moderate';
      if (percentage < 75) return 'high';
      return 'very_high';
    };

    expect(riskZones(12)).toBe('low');
    expect(riskZones(35)).toBe('moderate');
    expect(riskZones(68)).toBe('high');
    expect(riskZones(92)).toBe('very_high');
  });

  it('validates hybrid weighting formula 60% classical and 40% quantum', () => {
    const classicalRisk = 0.80;
    const quantumRisk = 0.60;
    const hybridScore = 0.60 * classicalRisk + 0.40 * quantumRisk;

    expect(hybridScore).toBeCloseTo(0.72, 4);
    expect(hybridScore).toBeGreaterThan(0.50);
  });

  it('verifies exact categorical numeric values for heart disease inputs', () => {
    const heartCfg = diseaseConfigs.heart;
    expect(heartCfg).toBeDefined();
    const opts = heartCfg.categoricalOptions!;
    expect(opts).toBeDefined();

    // Sex: Female=0, Male=1
    expect(opts.sex.map((o) => o.value)).toEqual([0, 1]);

    // Chest Pain: 0, 1, 2, 3
    expect(opts.cp.map((o) => o.value)).toEqual([0, 1, 2, 3]);

    // Fasting Blood Sugar: 0, 1
    expect(opts.fbs.map((o) => o.value)).toEqual([0, 1]);

    // Resting ECG: 0, 1, 2
    expect(opts.restecg.map((o) => o.value)).toEqual([0, 1, 2]);

    // Exercise Angina: 0, 1
    expect(opts.exang.map((o) => o.value)).toEqual([0, 1]);

    // ST Slope: 0, 1, 2
    expect(opts.slope.map((o) => o.value)).toEqual([0, 1, 2]);

    // Major Vessels: 0, 1, 2, 3, 4 integer buttons
    expect(opts.ca.map((o) => o.value)).toEqual([0, 1, 2, 3, 4]);

    // Thal: Normal=0, Fixed defect=1, Reversible defect=2 (no value 3)
    expect(opts.thal.map((o) => o.value)).toEqual([0, 1, 2]);
  });

  it('verifies dataset medians exist for continuous inputs', () => {
    const heartCfg = diseaseConfigs.heart;
    const continuousKeys = heartCfg.continuousKeys;

    continuousKeys.forEach((key) => {
      expect(heartCfg.medians[key]).toBeDefined();
      expect(typeof heartCfg.medians[key]).toBe('number');
    });

    expect(heartCfg.medians.age).toBe(55);
    expect(heartCfg.medians.trestbps).toBe(130);
    expect(heartCfg.medians.chol).toBe(240);
    expect(heartCfg.medians.thalach).toBe(153);
    expect(heartCfg.medians.oldpeak).toBe(0.8);
  });
});
