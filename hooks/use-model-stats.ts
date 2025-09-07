// hooks/use-model-stats.ts

import { useState, useEffect } from 'react';

interface ModelStats {
  model: string;
  usage: {
    modelName: string;
    dailyCount: number;
    minuteCount: number;
    lastMinuteReset: number;
    lastDailyReset: string;
  };
  limits: {
    perMinute: number;
    perDay: number;
  };
  available: boolean;
}

export function useModelStats(refreshInterval = 5000) {
  const [stats, setStats] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai/model-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data.models);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetStats = async (modelName?: string) => {
    try {
      const response = await fetch('/api/ai/model-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelName }),
      });
      
      if (!response.ok) throw new Error('Failed to reset stats');
      
      await fetchStats(); // 再取得
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { 
    stats, 
    loading, 
    error, 
    refresh: fetchStats,
    resetStats 
  };
}