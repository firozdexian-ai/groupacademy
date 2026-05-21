/**
 * Loads B2B-tagged courses + the current user's company assignments.
 * Single source of truth for the Gro10x Learn tab.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCompany } from "./useActiveCompany";
import {
  listB2BCatalog,
  listMyCompanyCourseAssignments,
  listCompanyCourseAssignmentsByCompany,
  type B2BCatalogCourse,
} from "@/domains/learning/repo/learningRepo";

export type B2BCourse = B2BCatalogCourse;

export interface CourseAssignment {
  id: string;
  company_id: string;
  content_id: string;
  assigned_to: string | null;
  due_at: string | null;
  sponsorship_mode: "free" | "company_credits" | "employee_credits";
  credit_cost: number;
  note: string | null;
  created_at: string;
  content?: B2BCourse | null;
  company_name?: string | null;
}

export function useB2BCatalog() {
  return useQuery({
    queryKey: ["gro10x-b2b-catalog"],
    staleTime: 60_000,
    queryFn: async (): Promise<B2BCourse[]> => listB2BCatalog(),
  });
}

export function useMyAssignments() {
  const { user } = useAuth();
  const { companyId } = useActiveCompany();
  return useQuery({
    queryKey: ["gro10x-my-assignments", user?.id, companyId],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<CourseAssignment[]> =>
      (await listMyCompanyCourseAssignments(user!.id, companyId)) as CourseAssignment[],
  });
}

export function useCompanyAssignments(companyId: string | null) {
  return useQuery({
    queryKey: ["gro10x-company-assignments", companyId],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => listCompanyCourseAssignmentsByCompany(companyId!),
  });
}
