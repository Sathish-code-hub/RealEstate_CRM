import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../lib/api';

// GET helper with loading 
export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});

 const MIN_LOADING_MS = 600; 

const load = useCallback(async () => {
  if (!url) return setLoading(false);
  setLoading(true);
  setError('');
  const started = Date.now();
  try {
    const res = await api.get(url, { params });
    setData(res.data);
  } catch (e) {
    setError(errMsg(e));
  } finally {
    const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - started));
    setTimeout(() => setLoading(false), wait);
  }
}, [url, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
