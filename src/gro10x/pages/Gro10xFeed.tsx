import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { CheckCircle2, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeedPost {
  id: string;
  author_name: string;
  author_avatar: string | null;
  author_title: string | null;
  text_content: string;
  tags: string[] | null;
  created_at: string;
  author_type: string;
  author_company_id: string | null;
}

interface Draft {
  id: string;
  text_content: string;
  tags: string[] | null;
  agent_key: string | null;
  created_at: string;
}

export default function Gro10xFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState("");
  const [posting, setPosting] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [audience, setAudience] = useState<"network" | "internal">("network");
  const [postAsCompany, setPostAsCompany] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    let cid: string | null = null;
    let r: string | null = null;
    let cname: string | null = null;
    if (user?.id) {
      const { data: m } = await supabase
        .from("company_members")
        .select("company_id, role, companies:company_id (name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      cid = m?.company_id ?? null;
      r = m?.role ?? null;
      cname = (m as any)?.companies?.name ?? null;
    }
    setCompanyId(cid);
    setRole(r);
    setCompanyName(cname);

    if (cid) {
      const { data: d } = await supabase
        .from("company_post_drafts")
        .select("id, text_content, tags, agent_key, created_at")
        .eq("company_id", cid)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);
      setDrafts((d ?? []) as Draft[]);
    } else {
      setDrafts([]);
    }

    // Audience-aware feed
    let query = supabase
      .from("feed_posts")
      .select("id, author_name, author_avatar, author_title, text_content, tags, created_at, author_type, author_company_id")
      .eq("is_active", true)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30);
    if (audience === "internal" && cid) {
      query = query.eq("audience", "internal").eq("author_company_id", cid);
    } else {
      query = query.eq("audience", "network");
    }
    const { data: p } = await query;
    setPosts((p ?? []) as FeedPost[]);
    setLoading(false);
  }, [user?.id, audience]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: refresh when drafts or feed posts change for the active company
  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`gro10x-feed-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_post_drafts", filter: `company_id=eq.${companyId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_posts" },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [companyId, load]);

  // Only the company POC (owner) can publish company posts and post-as-company.
  const isOwner = role === "owner";

  const handlePublish = async (draftId: string) => {
    setWorking(draftId);
    try {
      const { data, error } = await supabase.functions.invoke("company-agent-tools", {
        body: { tool_key: "publish_company_post", args: { draft_id: draftId } },
      });
      if (error || !data?.ok) {
        toast.error(data?.error ?? error?.message ?? "Could not publish");
        return;
      }
      toast.success("Published to your company feed");
      await load();
    } finally {
      setWorking(null);
    }
  };

  const handleDiscard = async (draftId: string) => {
    setWorking(draftId);
    try {
      const { data, error } = await supabase.functions.invoke("company-agent-tools", {
        body: { tool_key: "discard_company_draft", args: { draft_id: draftId } },
      });
      if (error || !data?.ok) {
        toast.error(data?.error ?? error?.message ?? "Could not discard");
        return;
      }
      toast.success("Draft discarded");
      await load();
    } finally {
      setWorking(null);
    }
  };

  const handleComposerSubmit = async () => {
    const text = composer.trim();
    if (text.length < 20) {
      toast.error("Post is a bit short — at least 20 characters please");
      return;
    }
    if (!companyId) {
      toast.error("You need a company workspace first");
      return;
    }
    setPosting(true);
    try {
      if (postAsCompany && isOwner) {
        // Owner posting as the company — publish directly via the agent tool path.
        const { data: draftRes, error: draftErr } = await supabase.functions.invoke("company-agent-tools", {
          body: { tool_key: "draft_company_post", args: { text_content: text, agent_key: null } },
        });
        if (draftErr || !draftRes?.ok) {
          toast.error(draftRes?.error ?? draftErr?.message ?? "Could not save");
          return;
        }
        if (draftRes.draft_id) {
          await supabase.functions.invoke("company-agent-tools", {
            body: { tool_key: "publish_company_post", args: { draft_id: draftRes.draft_id, audience } },
          });
        }
        setComposer("");
        toast.success(`Posted as ${companyName ?? "company"}`);
      } else {
        // Personal post — write directly to feed_posts with the chosen audience.
        const { data: t } = await supabase
          .from("talents")
          .select("id, full_name, profile_photo_url, custom_profession")
          .eq("user_id", user!.id)
          .maybeSingle();
        const { error } = await supabase.from("feed_posts").insert({
          text_content: text,
          author_name: t?.full_name || "Member",
          author_avatar: t?.profile_photo_url || null,
          author_title: t?.custom_profession || "Gro10x member",
          talent_id: t?.id,
          author_type: "talent",
          author_company_id: audience === "internal" ? companyId : null,
          audience,
          content_type: "text",
          status: "published",
          is_active: true,
        } as any);
        if (error) {
          toast.error(error.message ?? "Could not post");
          return;
        }
        setComposer("");
        toast.success(audience === "internal" ? "Posted to internal feed" : "Posted to network feed");
      }
      await load();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Feed</h1>
          <p className={`text-xs ${GRO10X_MUTED} truncate`}>What your network is up to</p>
        </div>
        {companyId && (
          <div className="inline-flex rounded-full bg-white/5 border border-white/10 p-0.5 text-[11px] shrink-0" role="tablist" aria-label="Feed audience">
            <button
              role="tab"
              aria-selected={audience === "network"}
              onClick={() => setAudience("network")}
              className={`px-3 py-1 rounded-full ${audience === "network" ? "bg-[#33E1E4] text-[#06121A] font-semibold" : "text-slate-300"}`}
            >
              Network
            </button>
            <button
              role="tab"
              aria-selected={audience === "internal"}
              onClick={() => setAudience("internal")}
              className={`px-3 py-1 rounded-full ${audience === "internal" ? "bg-[#33E1E4] text-[#06121A] font-semibold" : "text-slate-300"}`}
            >
              Internal
            </button>
          </div>
        )}
      </header>

      {/* Composer */}
      {user && companyId && (
        <div className="px-4 pt-3">
          <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3`}>
            <textarea
              aria-label="Write a post"
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder={
                postAsCompany
                  ? `Posting as ${companyName ?? "your company"}…`
                  : audience === "internal"
                  ? "Share with your team only…"
                  : "Share an update with the network…"
              }
              className="w-full bg-transparent text-sm placeholder:text-slate-500 focus:outline-none resize-none"
              rows={2}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Link
                  to="/gro10x/c/growth"
                  className="text-[11px] text-[#33E1E4] inline-flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="h-3 w-3" /> Ask Growth
                </Link>
                {isOwner && (
                  <label className="text-[11px] text-slate-300 inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postAsCompany}
                      onChange={(e) => setPostAsCompany(e.target.checked)}
                      className="accent-[#33E1E4]"
                    />
                    Post as {companyName ?? "company"}
                  </label>
                )}
              </div>
              <button
                onClick={() => void handleComposerSubmit()}
                disabled={posting || composer.trim().length < 20}
                className="rounded-full bg-[#33E1E4] text-[#06121A] px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                {posting ? "Saving…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts awaiting approval (visible to all company members; only owners can publish) */}
      {drafts.length > 0 && (
        <section className="px-4 mt-4">
          <p className={`text-[11px] uppercase tracking-wider ${GRO10X_MUTED} mb-2`}>
            Drafts {isOwner ? "awaiting your approval" : "pending owner approval"}
          </p>
          <div className="space-y-2">
            {drafts.map((d) => (
              <div key={d.id} className={`${GRO10X_PANEL} border border-[#33E1E4]/20 rounded-2xl p-3`}>
                <div className="flex items-start gap-2 mb-2">
                  {d.agent_key && (
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                      drafted by {d.agent_key}
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{d.text_content}</p>
                {isOwner && (
                  <div className="mt-3 flex gap-2 justify-end">
                    <button
                      onClick={() => void handleDiscard(d.id)}
                      disabled={working === d.id}
                      className="rounded-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Discard
                    </button>
                    <button
                      onClick={() => void handlePublish(d.id)}
                      disabled={working === d.id}
                      className="rounded-full px-3 py-1.5 text-xs bg-[#33E1E4] text-[#06121A] font-semibold hover:opacity-90 inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {working === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Publish
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feed */}
      <section className="px-4 mt-4 pb-6">
        {loading && <p className="text-center text-sm text-slate-400 py-6">Loading feed…</p>}
        {!loading && posts.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">
            No posts yet.{" "}
            <Link to="/gro10x/c/growth" className="text-[#33E1E4] hover:underline">
              Ask Growth Agent to draft one →
            </Link>
          </div>
        )}
        {posts.map((p) => (
          <article key={p.id} className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 mb-3`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-full bg-[#0B1220] border border-white/10 grid place-items-center text-sm font-semibold overflow-hidden">
                {p.author_avatar ? (
                  <img src={p.author_avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  p.author_name?.charAt(0)?.toUpperCase() ?? "?"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.author_name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {p.author_type === "company" ? "Company" : p.author_title ?? "Member"} ·{" "}
                  {new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{p.text_content}</p>
            {p.tags && p.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.tags.slice(0, 4).map((t) => (
                  <span key={t} className="text-[10px] text-[#33E1E4] bg-[#33E1E4]/10 px-2 py-0.5 rounded-full">
                    #{t.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
