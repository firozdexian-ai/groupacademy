import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ---- Discussions ----
export function useDiscussionThreads(cohortId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!cohortId) return;
    const ch = supabase.channel(`threads:${cohortId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "discussion_posts" },
        () => qc.invalidateQueries({ queryKey: ["threads", cohortId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cohortId, qc]);
  return useQuery({
    queryKey: ["threads", cohortId],
    enabled: !!cohortId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discussion_threads").select("*").eq("cohort_id", cohortId!)
        .order("is_pinned", { ascending: false })
        .order("last_post_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useThread(threadId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!threadId) return;
    const ch = supabase.channel(`thread:${threadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "discussion_posts", filter: `thread_id=eq.${threadId}` },
        () => qc.invalidateQueries({ queryKey: ["thread", threadId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId, qc]);
  return useQuery({
    queryKey: ["thread", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const [{ data: thread }, { data: posts }] = await Promise.all([
        supabase.from("discussion_threads").select("*").eq("id", threadId!).maybeSingle(),
        supabase.from("discussion_posts").select("*").eq("thread_id", threadId!).order("created_at"),
      ]);
      return { thread, posts: posts ?? [] };
    },
  });
}

export function useCreateThread() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { cohort_id: string; title: string; body?: string }) => {
      const { data, error } = await supabase.from("discussion_threads").insert({ ...input, author_id: user!.id }).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["threads", v.cohort_id] }),
  });
}

export function useReplyToThread() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { thread_id: string; body: string; parent_post_id?: string }) => {
      const { error } = await supabase.from("discussion_posts").insert({ ...input, author_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["thread", v.thread_id] }),
  });
}

// ---- Lesson Q&A ----
export function useLessonQuestions(contentId?: string, itemId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!contentId) return;
    const ch = supabase.channel(`qna:${contentId}:${itemId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lesson_answers" },
        () => qc.invalidateQueries({ queryKey: ["qna", contentId, itemId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [contentId, itemId, qc]);
  return useQuery({
    queryKey: ["qna", contentId, itemId],
    enabled: !!contentId,
    queryFn: async () => {
      let q = supabase.from("lesson_questions").select("*, answers:lesson_answers(*)").eq("content_id", contentId!);
      if (itemId) q = q.eq("item_id", itemId);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAskQuestion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { content_id: string; item_id?: string; module_id?: string; cohort_id?: string; body: string }) => {
      const { error } = await supabase.from("lesson_questions").insert({ ...input, author_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["qna", v.content_id, v.item_id] }),
  });
}

export function useAnswerQuestion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { question_id: string; body: string; content_id?: string; item_id?: string }) => {
      const { error } = await supabase.from("lesson_answers").insert({ question_id: input.question_id, body: input.body, author_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["qna", v.content_id, v.item_id] }),
  });
}

export function useAcceptAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { question_id: string; answer_id: string }) => {
      const { error } = await supabase.rpc("accept_lesson_answer", { _question_id: input.question_id, _answer_id: input.answer_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qna"] }),
  });
}

// ---- Submissions + reviews ----
export function useReviewQueue() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["review-queue", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_assignments")
        .select("*, submission:submission_id(id,title,kind,content_id,author_id)")
        .eq("reviewer_id", user!.id).eq("status", "pending")
        .order("due_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubmission(id?: string) {
  return useQuery({
    queryKey: ["submission", id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: sub }, { data: reviews }, { data: assigns }] = await Promise.all([
        supabase.from("submissions").select("*").eq("id", id!).maybeSingle(),
        supabase.from("submission_reviews").select("*").eq("submission_id", id!),
        supabase.from("review_assignments").select("*").eq("submission_id", id!),
      ]);
      return { submission: sub, reviews: reviews ?? [], assignments: assigns ?? [] };
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { submission_id: string; rubric: any[]; score: number; comments?: string }) => {
      const { error } = await supabase.from("submission_reviews").upsert({
        submission_id: input.submission_id, reviewer_id: user!.id,
        rubric: input.rubric, score: input.score, comments: input.comments ?? null,
      }, { onConflict: "submission_id,reviewer_id" });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["submission", v.submission_id] });
      qc.invalidateQueries({ queryKey: ["review-queue"] });
    },
  });
}

export function useReportContent() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { scope: string; scope_id: string; reason: string }) => {
      const { error } = await supabase.from("content_reports").insert({ ...input, reporter_id: user!.id });
      if (error) throw error;
    },
  });
}
