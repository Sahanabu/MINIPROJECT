import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { useToast } from './use-toast';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
  } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiCall(...args);
        
        if (showSuccessToast) {
          toast({
            title: 'Success',
            description: successMessage,
            variant: 'default',
          });
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof AxiosError 
          ? err.response?.data?.message || err.message 
          : 'An unexpected error occurred';
        
        setError(errorMessage);
        
        if (showErrorToast) {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, showSuccessToast, showErrorToast, successMessage, toast]
  );

  return { execute, loading, error };
}