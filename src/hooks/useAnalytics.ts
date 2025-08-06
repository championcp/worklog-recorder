import { useState, useCallback } from 'react';
import { 
  DashboardDataRequest, 
  DashboardData,
  TimeAnalysisData,
  APIResponse 
} from '@/types/analytics';

interface UseAnalyticsReturn {
  loading: boolean;
  error: string | null;
  getDashboardData: (params: DashboardDataRequest) => Promise<DashboardData>;
  getTimeAnalysisData: (params: any) => Promise<TimeAnalysisData>;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T>(
    endpoint: string, 
    params?: Record<string, any>
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => searchParams.append(key, String(v)));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });
      }

      const url = `/api/analytics/${endpoint}${searchParams.toString() ? `?${searchParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: APIResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || result.message || '请求失败');
      }

      return result.data!;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDashboardData = useCallback(async (params: DashboardDataRequest): Promise<DashboardData> => {
    return apiCall<DashboardData>('dashboard', params);
  }, [apiCall]);

  const getTimeAnalysisData = useCallback(async (params: {
    type: 'heatmap' | 'trend' | 'distribution';
    timeRange: 'week' | 'month' | 'quarter' | 'custom';
    startDate?: string;
    endDate?: string;
    projectId?: number;
  }): Promise<TimeAnalysisData> => {
    return apiCall<TimeAnalysisData>('time-analysis', params);
  }, [apiCall]);

  return {
    loading,
    error,
    getDashboardData,
    getTimeAnalysisData
  };
};