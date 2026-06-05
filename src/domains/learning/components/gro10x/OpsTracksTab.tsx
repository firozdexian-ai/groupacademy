import { useState } from "react";
import { useActiveCompany } from "@/gro10x/hooks/useActiveCompany";
import {
  useCompanyTracks,
  useCreateTrack,
  useUpdateTrack,
  useTrackItems,
  useAddTrackItem,
  useRemoveTrackItem,
  type LearningTrack,
} from "@/domains/learning";
import { GRO10X_PANEL, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { Plus, BookOpen, Eye, EyeOff, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useB2BCatalog } from "@/gro10x/hooks/useCourseAssignments";
import { toast } from "sonner";

export function OpsTracksTab() {
  const { companyId, role } = useActiveCompany();
  const { data: tracks, isLoading } = useCompanyTracks(companyId);
  const createTrack = useCreateTrack();
  const updateTrack = useUpdateTrack();
  const [composing, setComposing] = useState(false);
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);

  const isAdmin = role === "owner" || role === "admin";

  if (!companyId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={`text-xs ${GRO10X_MUTED}`}>
          Bundle multiple courses into a sequenced track. Assign in bulk.
        </p>
        {isAdmin && (
          <Button size="sm" onClick={() => setComposing(true)} className="bg-[#33E1E4] text-[#0B1220] hover:bg-[#33E1E4]/90">
            <Plus className="h-3.5 w-3.5 mr-1" /> New track
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : !tracks || tracks.length === 0 ? (
        <div className={`${GRO10X_PANEL} border border-background/10 rounded-2xl p-6 text-center`}>
          <BookOpen className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-sm mt-2">No tracks yet.</p>
          <p className={`text-[11px] ${GRO10X_MUTED} mt-1`}>
            Create a track to bundle courses (e.g. "Sales onboarding").
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tracks.map((t) => (
            <TrackCard
              key={t.id}
              track={t}
              isOpen={openTrackId === t.id}
              onToggle={() => setOpenTrackId(openTrackId === t.id ? null : t.id)}
              isAdmin={isAdmin}
              onPublishToggle={() =>
                updateTrack.mutate({ id: t.id, is_published: !t.is_published })
              }
            />
          ))}
        </ul>
      )}

      {composing && companyId && (
        <NewTrackSheet
          companyId={companyId}
          onClose={() => setComposing(false)}
          onCreate={async (input) => {
            try {
              await createTrack.mutateAsync({ ...input, owner_kind: "company", company_id: companyId });
              toast.success("Track created");
              setComposing(false);
            } catch (e: any) {
              toast.error(e?.message ?? "Failed to create");
            }
          }}
        />
      )}
    </div>
  );
}

function TrackCard({
  track,
  isOpen,
  onToggle,
  isAdmin,
  onPublishToggle,
}: {
  track: LearningTrack;
  isOpen: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  onPublishToggle: () => void;
}) {
  const { data: items } = useTrackItems(isOpen ? track.id : undefined);
  const addItem = useAddTrackItem();
  const removeItem = useRemoveTrackItem();
  const { data: catalog } = useB2BCatalog();
  const used = new Set((items ?? []).map((i: any) => i.content_id));

  return (
    <li className={`${GRO10X_PANEL} border border-background/10 rounded-2xl overflow-hidden`}>
      <button onClick={onToggle} className="w-full p-3 flex items-center gap-3 text-left hover:bg-background/[0.03]">
        <div className="h-10 w-10 rounded-xl bg-[#0B1220] border border-background/10 grid place-items-center shrink-0">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {track.is_sequential ? "Sequential" : "Open"} · {track.is_published ? "Published" : "Draft"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPublishToggle();
            }}
            className="text-muted-foreground hover:text-primary-foreground p-1"
            title={track.is_published ? "Unpublish" : "Publish"}
          >
            {track.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-background/5 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Steps</p>
          {(items ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No courses yet.</p>
          ) : (
            <ul className="space-y-1">
              {(items as any[]).map((it, idx) => (
                <li key={it.id} className="flex items-center gap-2 text-xs bg-background/[0.02] rounded-lg px-2 py-1.5">
                  <span className="text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="flex-1 truncate">{it.content?.title ?? "Course"}</span>
                  {!it.is_required && <span className="text-[9px] text-muted-foreground">optional</span>}
                  {isAdmin && (
                    <button
                      onClick={() => removeItem.mutate({ id: it.id, track_id: track.id })}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isAdmin && (
            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Add a course</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {(catalog ?? [])
                  .filter((c: any) => !used.has(c.id))
                  .slice(0, 30)
                  .map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        addItem.mutate({
                          track_id: track.id,
                          content_id: c.id,
                          position: items?.length ?? 0,
                          is_required: true,
                        })
                      }
                      className="text-left text-[11px] px-2 py-1.5 rounded-lg bg-background/[0.02] hover:bg-background/[0.06] truncate"
                    >
                      + {c.title}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function NewTrackSheet({
  companyId: _companyId,
  onClose,
  onCreate,
}: {
  companyId: string;
  onClose: () => void;
  onCreate: (input: { title: string; slug: string; summary: string; is_sequential: boolean }) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [seq, setSeq] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 grid place-items-end md:place-items-center p-3" onClick={onClose}>
      <div
        className={`${GRO10X_PANEL} border border-background/10 rounded-2xl w-full max-w-md p-4 space-y-3`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">New track</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
            }}
          />
          <Input placeholder="Slug (URL-friendly)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Textarea placeholder="Short summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
          <label className="flex items-center justify-between text-xs">
            <span>Sequential unlock</span>
            <Switch checked={seq} onCheckedChange={setSeq} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!title || !slug}
            onClick={() => onCreate({ title, slug, summary, is_sequential: seq })}
            className="bg-[#33E1E4] text-[#0B1220] hover:bg-[#33E1E4]/90"
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
