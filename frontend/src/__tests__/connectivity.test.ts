import { afterEach,describe,expect,it,vi } from 'vitest';
import { AxiosError } from 'axios';
import { api,getDiseases,trainModels } from '../services/api';

afterEach(() => vi.restoreAllMocks());

describe('Connection failures remain actionable', () => {
  it('does not disguise a disconnected registry as an empty registry', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Connection refused'));
    await expect(getDiseases()).rejects.toThrow('Connection refused');
  });

  it('rejects a malformed registry response', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { message: 'unavailable' } });
    await expect(getDiseases()).rejects.toThrow('invalid disease registry');
  });

  it('does not retry a training request after a server failure', async () => {
    const post = vi.spyOn(api, 'post').mockRejectedValue(new Error('Training failed'));
    await expect(trainModels('heart')).rejects.toThrow('Training failed');
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/models/train', { disease: 'heart', force_retrain: true });
  });

  it('does not retry a timed-out POST through the Axios interceptor', async () => {
    const adapter = vi.fn(async (config) => {
      throw new AxiosError('Timed out', 'ECONNABORTED', config);
    });
    await expect(api.post('/models/train', {}, { adapter })).rejects.toThrow('Timed out');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('preserves errors without Axios request configuration', async () => {
    const error = new Error('Adapter failed before request initialization');
    await expect(api.get('/health', { adapter: async () => { throw error; } })).rejects.toBe(error);
  });
});
