import { BrowserRouter,Routes,Route,Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { DiseaseAnalysisPage } from './pages/DiseaseAnalysisPage';
import { HybridAIDashboard } from './pages/HybridAIDashboard';
import { QuantumLaboratory } from './pages/QuantumLaboratory';
import { ModelComparisonDashboard } from './pages/ModelComparisonDashboard';
import { ExplainabilityDashboard } from './pages/ExplainabilityDashboard';
import { LimitationsPage } from './pages/LimitationsPage';
import { AboutPage } from './pages/AboutPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { TrainingHistoryPage } from './pages/TrainingHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClinicalCopilotChat } from './components/chat/ClinicalCopilotChat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />

          {/* Analysis routes with parameter and alias support */}
          <Route path="analyze" element={<DiseaseAnalysisPage />} />
          <Route path="analyze/:diseaseId" element={<DiseaseAnalysisPage />} />
          <Route path="analysis" element={<DiseaseAnalysisPage />} />
          <Route path="analysis/:diseaseId" element={<DiseaseAnalysisPage />} />
          <Route path="batch" element={<DiseaseAnalysisPage defaultMode="batch" />} />

          {/* Results & Dashboards */}
          <Route path="dashboard" element={<HybridAIDashboard />} />

          {/* Quantum routes & aliases */}
          <Route path="quantum-lab" element={<QuantumLaboratory />} />
          <Route path="quantum" element={<QuantumLaboratory />} />

          {/* Model comparison & aliases */}
          <Route path="comparison" element={<ModelComparisonDashboard />} />
          <Route path="models" element={<ModelComparisonDashboard />} />

          {/* Explainability & Governance */}
          <Route path="explainability" element={<ExplainabilityDashboard />} />
          <Route path="limitations" element={<LimitationsPage />} />

          {/* Clinical Operations & Training (from bb) */}
          <Route path="datasets" element={<DatasetsPage />} />
          <Route path="training" element={<TrainingHistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ClinicalCopilotChat />
    </BrowserRouter>
  );
}

export default App;
