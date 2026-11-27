import { useEffect, useState } from 'react';

export interface AppStatus {
  configured: boolean;
  storageWebId?: string;
  name?: string;
  description?: string;
  thumbnail?: string;
}

const useAppStatus = () => {
  const [status, setStatus] = useState<AppStatus>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    fetch('/api/status')
      .then(res => {
        if (!res.ok) throw new Error(`Status request failed (${res.status})`);
        return res.json();
      })
      .then(setStatus)
      .catch(setError);
  }, []);

  return { status, error };
};

export default useAppStatus;
