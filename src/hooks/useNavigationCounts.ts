'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface NavigationCounts {
  workers: number;
  nationalities: number;
  skills: number;
  languages: number;
  loading: boolean;
  error: string | null;
}

export function useNavigationCounts(): NavigationCounts {
  const [counts, setCounts] = useState<NavigationCounts>({
    workers: 0,
    nationalities: 0,
    skills: 0,
    languages: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchCounts() {
      try {
        // Fetch counts in parallel for better performance
        const [workersResponse, referenceResponse] = await Promise.all([
          api.getWorkers({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
          api.getReferenceData().catch(() => ({ nationalities: [], skills: [], languages: [] })),
        ]);

        setCounts({
          workers: workersResponse.pagination?.total || 0,
          nationalities: referenceResponse.nationalities?.length || 0,
          skills: referenceResponse.skills?.length || 0,
          languages: referenceResponse.languages?.length || 0,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch navigation counts:', error);
        setCounts(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load counts',
        }));
      }
    }

    fetchCounts();
  }, []);

  return counts;
}