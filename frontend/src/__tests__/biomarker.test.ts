import { describe, it, expect } from 'vitest';

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
});
