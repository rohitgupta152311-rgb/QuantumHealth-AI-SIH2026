import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ClinicalCopilotChat } from './components/chat/ClinicalCopilotChat';

// Lazy-loaded route components for faster initial page load
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DiseaseAnalysisPage = React.lazy(() => import('./pages/DiseaseAnalysisPage').then(m => ({ default: m.DiseaseAnalysisPage })));
const HybridAIDashboard = React.lazy(() => import('./pages/HybridAIDashboard').then(m => ({ default: m.HybridAIDashboard })));
const QuantumLaboratory = React.lazy(() => import('./pages/QuantumLaboratory').then(m => ({ default: m.QuantumLaboratory })));
const ModelComparisonDashboard = React.lazy(() => import('./pages/ModelComparisonDashboard').then(m => ({ default: m.ModelComparisonDashboard })));
const ExplainabilityDashboard = React.lazy(() => import('./pages/ExplainabilityDashboard').then(m => ({ default: m.ExplainabilityDashboard })));
const LimitationsPage = React.lazy(() => import('./pages/LimitationsPage').then(m => ({ default: m.LimitationsPage })));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const DatasetsPage = React.lazy(() => import('./pages/DatasetsPage').then(m => ({ default: m.DatasetsPage })));
const TrainingHistoryPage = React.lazy(() => import('./pages/TrainingHistoryPage').then(m => ({ default: m.TrainingHistoryPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm font-medium">Loading module...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="analyze" element={<DiseaseAnalysisPage />} />
            <Route path="analyze/:diseaseId" element={<DiseaseAnalysisPage />} />
            <Route path="analysis" element={<DiseaseAnalysisPage />} />
            <Route path="analysis/:diseaseId" element={<DiseaseAnalysisPage />} />
            <Route path="batch" element={<DiseaseAnalysisPage defaultMode="batch" />} />
            <Route path="dashboard" element={<HybridAIDashboard />} />
            <Route path="quantum-lab" element={<QuantumLaboratory />} />
            <Route path="quantum" element={<QuantumLaboratory />} />
            <Route path="comparison" element={<ModelComparisonDashboard />} />
            <Route path="models" element={<ModelComparisonDashboard />} />
            <Route path="explainability" element={<ExplainabilityDashboard />} />
            <Route path="limitations" element={<LimitationsPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="training" element={<TrainingHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <ClinicalCopilotChat />
    </BrowserRouter>
  );
}

export default App;
