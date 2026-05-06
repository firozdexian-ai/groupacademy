import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTalentLists, useAddToList, useCreateTalentList } from "@/hooks/useTalentLists";
import { Plus, Bookmark } from "lucide-react";
import { toast } from "sonner";

interface Props {
  companyId: string;
  talentId: string;
  talentName: string;
  onClose: () => void;
}

export function SaveToListSheet({ companyId, talentId, talentName, onClose }: Props) {
  const { data: lists } = useTalentLists(companyId);
  const addToList = useAddToList();
  const createList = useCreateTalentList();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const save = async (listId: string) => {
    await addToList.mutateAsync({ listId, talentId, note: note || undefined });
    toast.success("Saved to list");
    onClose();
  };

  const create = async () => {
    if (!name.trim()) return;
    const list = await createList.mutateAsync({ companyId, name: name.trim() });
    await save(list.id);
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Save {talentName}</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-4">
          <Textarea
            placeholder="Optional note (why this talent)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[60px]"
          />
          <div className="space-y-1">
            {(lists ?? []).map((l) => (
              <button
                key={l.id}
                onClick={() => save(l.id)}
                className="w-full flex items-center justify-between rounded-lg p-3 border border-border hover:bg-accent text-left"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Bookmark className="h-4 w-4 text-muted-foreground" /> {l.name}
                </span>
                <span className="text-xs text-muted-foreground">{l.member_count} members</span>
              </button>
            ))}
          </div>

          {showCreate ? (
            <div className="space-y-2">
              <Input
                placeholder="New list name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={create} disabled={createList.isPending} className="flex-1">
                  Create & Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" /> New list
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
