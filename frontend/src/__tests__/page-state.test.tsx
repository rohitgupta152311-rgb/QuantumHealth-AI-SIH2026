// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act,cleanup,render,screen,waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { MemoryRouter,Route,Routes,useLocation,useNavigate } from 'react-router-dom';
import { DiseaseAnalysisPage } from '../pages/DiseaseAnalysisPage';
import { SettingsPage } from '../pages/SettingsPage';
import { getDiseases,healthCheck } from '../services/api';

vi.mock('../services/api', async importOriginal => ({
  ...await importOriginal<typeof import('../services/api')>(),
  getDiseases: vi.fn(), healthCheck: vi.fn(),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getDiseases).mockResolvedValue([
    { id: 'heart', name: 'Heart disease', description: 'Heart cohort', features: [{name: 'age', label: 'Age', min: 1, max: 100}] },
    { id: 'diabetes', name: 'Diabetes', description: 'Diabetes cohort', features: [{name: 'Age', label: 'Age', min: 1, max: 100}] },
  ]);
});

function RouterControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output aria-label="Current URL">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Back</button></>;
}

describe('Disease analysis rendered navigation', () => {
  it.each(['/analyze/heart', '/analyze?disease=heart', '/analyze/heart?disease=diabetes'])(
    'changes disease and restores history from %s', async initialUrl => {
      const user = userEvent.setup();
      render(<MemoryRouter initialEntries={[initialUrl]}><RouterControls /><Routes>
        <Route path="/analyze/:diseaseId?" element={<DiseaseAnalysisPage />} />
      </Routes></MemoryRouter>);
      const heart = await screen.findByRole('button', {name: 'Heart disease'});
      await waitFor(() => expect(heart.getAttribute('aria-pressed')).toBe('true'));
      await user.click(screen.getByRole('button', {name: 'Diabetes'}));
      await waitFor(() => expect(screen.getByRole('button', {name: 'Diabetes'}).getAttribute('aria-pressed')).toBe('true'));
      expect(screen.getByLabelText('Current URL').textContent).toBe('/analyze/diabetes');
      await user.click(screen.getByRole('button', {name: 'Back'}));
      await waitFor(() => expect(heart.getAttribute('aria-pressed')).toBe('true'));
      expect(screen.getByLabelText('Current URL').textContent).toBe(initialUrl);
    },
  );
});

describe('Settings current health state', () => {
  it('clears a previously connected service on failed refresh and recovers', async () => {
    vi.mocked(healthCheck).mockResolvedValueOnce({status: 'ok', quantum_backend: 'test-simulator'})
      .mockRejectedValueOnce(new Error('Backend unavailable')).mockResolvedValueOnce({status: 'ok'});
    const user = userEvent.setup();
    render(<SettingsPage />);
    expect(await screen.findByText('Connected')).toBeTruthy();
    await user.click(screen.getByRole('button', {name: 'Check Connectivity'}));
    expect(await screen.findByText('Offline')).toBeTruthy();
    expect(screen.queryByText('Connected')).toBeNull();
    expect(screen.queryByText('test-simulator')).toBeNull();
    expect(screen.getAllByText('Backend unavailable').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', {name: 'Check Connectivity'}));
    expect(await screen.findByText('Connected')).toBeTruthy();
  });

  it('ignores an obsolete success arriving after a newer failure', async () => {
    let resolveOld!: (value: {status: string}) => void;
    vi.mocked(healthCheck).mockImplementationOnce(() => new Promise(resolve => {resolveOld = resolve;}))
      .mockRejectedValueOnce(new Error('Latest request failed'));
    render(<StrictMode><SettingsPage /></StrictMode>);
    expect(await screen.findByText('Offline')).toBeTruthy();
    await act(async () => resolveOld({status: 'ok'}));
    expect(screen.queryByText('Connected')).toBeNull();
    expect(screen.getAllByText('Latest request failed').length).toBeGreaterThan(0);
  });
});
