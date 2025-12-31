import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';

export interface ApplicationHistoryItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  deliveryStatus: string;
  appliedAt: string;
  isPaid: boolean;
}

export function useApplicationHistory() {
  const { talent } = useTalent();
  const [applications, setApplications] = useState<ApplicationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      if (!talent?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('job_applications')
          .select(`
            id,
            job_id,
            application_status,
            delivery_status,
            created_at,
            is_paid,
            jobs:job_id (
              title,
              company_name
            )
          `)
          .eq('talent_id', talent.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;

        const formattedApplications: ApplicationHistoryItem[] = (data || []).map((app: any) => ({
          id: app.id,
          jobId: app.job_id,
          jobTitle: app.jobs?.title || 'Unknown Job',
          companyName: app.jobs?.company_name || 'Unknown Company',
          applicationStatus: app.application_status || 'submitted',
          deliveryStatus: app.delivery_status || 'pending',
          appliedAt: app.created_at,
          isPaid: app.is_paid || false,
        }));

        setApplications(formattedApplications);
        setError(null);
      } catch (err) {
        console.error('Error fetching application history:', err);
        setError('Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplications();
  }, [talent?.id]);

  return { applications, isLoading, error };
}
