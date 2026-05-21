import { useQuery } from "@tanstack/react-query";
import { getEmployerJobsDashboard } from "@/domains/jobs/repo/jobsRepo";

export interface EmployerJobRow {
  id: string;
  title: string;
  location: string | null;
  is_active: boolean;
  job_kind: string;
  created_at: string;
  deadline: string | null;
  vacancies: number | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string | null;
  applicant_count: number;
}

export const employerJobsQueryKey = (companyId: string | null | undefined) =>
  ["employer-jobs-dashboard", companyId] as const;

/**
 * Single-RPC employer jobs dashboard: jobs + applicant counts in one round-trip.
 * Replaces the old N+1 fan-out in Gro10xJobsList.
 */
export function useEmployerJobsDashboard(companyId: string | null | undefined) {
  return useQuery({
    queryKey: employerJobsQueryKey(companyId),
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async (): Promise<EmployerJobRow[]> => {
      const data = await getEmployerJobsDashboard(companyId!);
      return (data as any[]).map((r) => ({
        ...r,
        applicant_count: Number(r.applicant_count ?? 0),
      })) as EmployerJobRow[];
    },
  });
}
