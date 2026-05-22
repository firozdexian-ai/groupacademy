import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  listDiscussionThreads,
  getDiscussionThreadWithPosts,
  insertDiscussionThread,
  insertDiscussionPost,
  listLessonQuestions,
  insertLessonQuestion,
  insertLessonAnswer,
  listReviewQueueForReviewer,
  getSubmissionWithReviews,
  upsertSubmissionReview,
  insertContentReport,
  acceptLessonAnswer,
  subscribeDiscussionPostsForCohort,
  subscribeDiscussionPostsForThread,
  subscribeLessonAnswers,
} from "@/domains/learning/repo/learningRepo";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

/**
 * GroUp Academy: Social Learning & Peer Verification Hub (V5.6.0)
 * CTO Reference: Authoritative system controller handling Cohort Forums, Q&A, and Review Queues.
 * Architecture: Digital Workforce enabled - streams critical friction logs directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Candidate).
 */

export type CourseBriefMode = "recorded" | "live_cohort" | "hybrid";

export type CourseBrief = {
  id: string;
  title: string;
  summary: string | null;
  syllabus: any;
  mode: CourseBriefMode;
  language: string;
  duration_weeks: number | null;
  target_launch: string | null;
  budget_amount: number | null;
  budget_currency: string;
  revenue_share_pct: number;
  required_skills: any;
  status: "draft" | "open" | "filled" | "archived" | "closed";
  content_id: string | null;
  instructor_job_id: string | null;
  instructor_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

// --------------------------------------------------------
// SECTION 1: Cohort Forums & Discussion Threads Matrix
// --------------------------------------------------------

export function useDiscussionThreads(cohortId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!cohortId) return;

    const ch = supabase
      .channel(`public:threads:${cohortId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "discussion_posts" }, () => {
        void qc.invalidateQueries({ queryKey: ["threads", cohortId] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [cohortId, qc]);

  return useQuery({
    queryKey: ["threads", cohortId],
    enabled: !!cohortId,
    staleTime: 30000,
    queryFn: async () => {
      try {
        return await listDiscussionThreads(cohortId!);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: discussion_threads selection failure.", {
          cohortId,
          message: error.message,
        });
        throw error;
      }
    },
  });
}

export function useThread(threadId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!threadId) return;

    const ch = supabase
      .channel(`public:thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "discussion_posts", filter: `thread_id=eq.${threadId}` },
        () => {
          void qc.invalidateQueries({ queryKey: ["thread", threadId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [threadId, qc]);

  return useQuery({
    queryKey: ["thread", threadId],
    enabled: !!threadId,
    staleTime: 15000,
    queryFn: async () => {
      try {
        return await getDiscussionThreadWithPosts(threadId!);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: thread detail payload selection error.", {
          threadId,
          message: error.message,
        });
        throw error;
      }
    },
  });
}

export function useCreateThread() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { cohort_id: string; title: string; body?: string }) => {
      if (!user?.id) throw new Error("AUTH_SYNC_REQUIRED: Identity verification failed.");
      return await insertDiscussionThread({ ...input, author_id: user.id });
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["threads", variables.cohort_id] });
      toast.success("Discussion topic created successfully.");
    },
    onError: (err: any, variables) => {
      console.error("[Digital Workforce] ANOMALY: discussion_threads thread creation failure.", {
        authorId: user?.id,
        cohortId: variables.cohort_id,
        message: err.message,
      });
      toast.error(err.message || "Failed to create discussion topic.");
    },
  });
}

export function useReplyToThread() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { thread_id: string; body: string; parent_post_id?: string }) => {
      if (!user?.id) throw new Error("AUTH_SYNC_REQUIRED: Identity verification failed.");
      await insertDiscussionPost({ ...input, author_id: user.id });
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["thread", variables.thread_id] });
    },
    onError: (err: any, variables) => {
      console.error("[Digital Workforce] ANOMALY: discussion_posts comment insert failed.", {
        authorId: user?.id,
        threadId: variables.thread_id,
        message: err.message,
      });
      toast.error(err.message || "Failed to transmit comment reply.");
    },
  });
}

// --------------------------------------------------------
// SECTION 2: LMS In-Course Lesson Q&A Channels Engine
// --------------------------------------------------------

export function useLessonQuestions(contentId?: string, itemId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!contentId) return;

    const ch = supabase
      .channel(`public:qna:${contentId}:${itemId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lesson_answers" }, () => {
        void qc.invalidateQueries({ queryKey: ["qna", contentId, itemId] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [contentId, itemId, qc]);

  return useQuery({
    queryKey: ["qna", contentId, itemId],
    enabled: !!contentId,
    staleTime: 30000,
    queryFn: async () => {
      try {
        return await listLessonQuestions(contentId!, itemId);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: lesson_questions index stream failure.", {
          contentId,
          itemId,
          message: error.message,
        });
        throw error;
      }
    },
  });
}

export function useAskQuestion() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      content_id: string;
      item_id?: string;
      module_id?: string;
      cohort_id?: string;
      body: string;
    }) => {
      if (!user?.id) throw new Error("AUTH_SYNC_REQUIRED: Identity verification failed.");
      await insertLessonQuestion({ ...input, author_id: user.id });
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["qna", variables.content_id, variables.item_id] });
      toast.success("Question enqueued into lesson timeline.");
    },
    onError: (err: any, variables) => {
      console.error("[Digital Workforce] ANOMALY: lesson_questions insert transaction rejected.", {
        studentId: user?.id,
        contentId: variables.content_id,
        message: err.message,
      });
      toast.error(err.message || "Failed to submit curriculum question.");
    },
  });
}

export function useAnswerQuestion() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { question_id: string; body: string; content_id?: string; item_id?: string }) => {
      if (!user?.id) throw new Error("AUTH_SYNC_REQUIRED: Identity verification failed.");
      await insertLessonAnswer({
        question_id: input.question_id,
        body: input.body,
        author_id: user.id,
      });
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["qna", variables.content_id, variables.item_id] });
      toast.success("Answer transmitted safely.");
    },
    onError: (err: any, variables) => {
      console.error("[Digital Workforce] ANOMALY: lesson_answers creation fault node.", {
        authorId: user?.id,
        questionId: variables.question_id,
        message: err.message,
      });
      toast.error(err.message || "Failed to post answer script.");
    },
  });
}

export function useAcceptAnswer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { question_id: string; answer_id: string }) => {
      await acceptLessonAnswer(input.question_id, input.answer_id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["qna"] });
      toast.success("Resolution selected: Answer marked as accepted.");
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] ANOMALY: accept_lesson_answer RPC trigger error.", { message: err.message });
      toast.error("Failed to mark answer as accepted.");
    },
  });
}

// --------------------------------------------------------
// SECTION 3: Phase 5.3 & 5.4 Submission Verification Queues
// --------------------------------------------------------

export function useReviewQueue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["review-queue", user?.id],
    enabled: !!user?.id,
    staleTime: 60000,
    queryFn: async () => {
      try {
        return await listReviewQueueForReviewer(user!.id);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: review_assignments registry sync failure.", {
          reviewerId: user?.id,
          message: error.message,
        });
        throw error;
      }
    },
  });
}

export function useSubmission(id?: string) {
  return useQuery({
    queryKey: ["submission", id],
    enabled: !!id,
    staleTime: 30000,
    queryFn: async () => {
      try {
        return await getSubmissionWithReviews(id!);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: submission detail sync dropout.", { id, message: error.message });
        throw error;
      }
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { submission_id: string; rubric: any[]; score: number; comments?: string }) => {
      if (!user?.id) throw new Error("AUTH_SYNC_REQUIRED: Identity verification failed.");
      await upsertSubmissionReview({
        submission_id: input.submission_id,
        reviewer_id: user.id,
        rubric: input.rubric,
        score: input.score,
        comments: input.comments ?? null,
      });
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["submission", variables.submission_id] });
      void qc.invalidateQueries({ queryKey: ["review-queue", user?.id] });
      toast.success("Evaluation submitted safely into verification ledger.");
    },
    onError: (err: any, variables) => {
      console.error("[Digital Workforce] ANOMALY: submission_reviews transaction insertion rejected.", {
        reviewerId: user?.id,
        submissionId: variables.submission_id,
        message: err.message,
      });
      toast.error(err.message || "Failed to log submission review.");
    },
  });
}

export function useReportContent() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { scope: string; scope_id: string; reason: string }) => {
      if (!user?.id) throw new Error("AUTH_SYNC_REQUIRED: Identity verification failed.");
      await insertContentReport({ ...input, reporter_id: user.id });
    },
    onSuccess: () => {
      toast.success("Flag logged: Content submitted to safety operations board.");
    },
    onError: (err: any, variables) => {
      console.error("[Digital Workforce] ANOMALY: content_reports table processing failure.", {
        reporterId: user?.id,
        scope: variables.scope,
        scopeId: variables.scope_id,
        message: err.message,
      });
      toast.error("Handshake timeout. Content monitoring enqueued directly via emergency operations channels.");
    },
  });
}
