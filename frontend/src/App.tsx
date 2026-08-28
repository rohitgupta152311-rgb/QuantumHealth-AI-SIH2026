import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { DiseaseAnalysisPage } from './pages/DiseaseAnalysisPage';
import { HybridAIDashboard } from './pages/HybridAIDashboard';
import { QuantumLaboratory } from './pages/QuantumLaboratory';
import { ModelComparisonDashboard } from './pages/ModelComparisonDashboard';
import { ExplainabilityDashboard } from './pages/ExplainabilityDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="analyze" element={<DiseaseAnalysisPage />} />
          <Route path="dashboard" element={<HybridAIDashboard />} />
          <Route path="quantum-lab" element={<QuantumLaboratory />} />
          <Route path="comparison" element={<ModelComparisonDashboard />} />
          <Route path="explainability" element={<ExplainabilityDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
