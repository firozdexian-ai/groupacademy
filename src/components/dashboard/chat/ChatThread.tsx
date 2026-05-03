import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, FileText, Image as ImageIcon, Loader2, Paperclip, RefreshCw, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";
import { useAdminChatThread, type ChatAttachment } from "@/hooks/useAdminChatThread";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  agentKey: string;
  onAfterSend?: () => void;
}

const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentChip({
  att,
  onRemove,
}: {
  att: ChatAttachment;
  onRemove?: () => void;
}) {
  const isImage = att.mime?.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  const inner = (
    <div className="flex items-center gap-2 max-w-[220px]">
      {isImage && att.url ? (
        <img
          src={att.url}
          alt={att.name}
          className="h-9 w-9 rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{att.name}</div>
        <div className="text-[10px] text-muted-foreground">{formatBytes(att.size)}</div>
      </div>
    </div>
  );
  return (
    <div className="relative inline-flex items-center gap-2 px-2 py-1.5 rounded-xl border border-border/50 bg-background/60">
      {att.url ? (
        <a href={att.url} target="_blank" rel="noreferrer" className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"
          aria-label="Remove attachment"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function ChatThread({ agentKey, onAfterSend }: ChatThreadProps) {
  const agent = ADMIN_AGENTS_BY_KEY[agentKey];
  const { messages, loading, sending, send, clear, uploadAttachment, regenerate } =
    useAdminChatThread(agentKey);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // reset composer when switching agents
  useEffect(() => {
    setPending([]);
    setInput("");
  }, [agentKey]);

  if (!agent) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Unknown agent
      </div>
    );
  }

  const Icon = agent.icon;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    if (pending.length + list.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can attach up to ${MAX_FILES} files per message.`,
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    for (const f of list) {
      if (f.size > MAX_BYTES) {
        toast({
          title: "File too large",
          description: `${f.name} exceeds 20 MB.`,
          variant: "destructive",
        });
        continue;
      }
      const att = await uploadAttachment(f);
      if (att) setPending((p) => [...p, att]);
      else
        toast({
          title: "Upload failed",
          description: f.name,
          variant: "destructive",
        });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (text: string) => {
    if (!text.trim() && pending.length === 0) return;
    const atts = pending;
    setInput("");
    setPending([]);
    await send(text, atts);
    onAfterSend?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-card/40 backdrop-blur">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            agent.accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{agent.name}</div>
          <div className="text-xs text-muted-foreground truncate">{agent.tagline}</div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-background/30">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="space-y-3 max-w-xl mx-auto py-8">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 text-center">
              Start the conversation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agent.suggestions.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 rounded-2xl border-2 whitespace-normal"
                  onClick={() => submit(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLastAssistant =
            m.role === "assistant" && i === messages.length - 1 && !sending;
          return (
            <div
              key={m.id ?? i}
              className={cn(
                "flex flex-col",
                m.role === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm space-y-2",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border/40 rounded-bl-md",
                )}
              >
                {!!m.attachments?.length && (
                  <div className="flex flex-wrap gap-2">
                    {m.attachments.map((a) => (
                      <AttachmentChip key={a.path} att={a} />
                    ))}
                  </div>
                )}
                {m.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {m.role === "assistant" && m.content && (
                <div className="flex gap-1 mt-1 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      toast({ title: "Copied" });
                    }}
                    className="p-1 rounded hover:bg-muted"
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {isLastAssistant && (
                    <button
                      onClick={() => regenerate()}
                      className="p-1 rounded hover:bg-muted"
                      title="Regenerate"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> {agent.name} is typing…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="border-t border-border/30 p-3 bg-card/40 backdrop-blur space-y-2">
        {(pending.length > 0 || uploading) && (
          <div className="flex flex-wrap gap-2">
            {pending.map((a, i) => (
              <AttachmentChip
                key={a.path}
                att={a}
                onRemove={() =>
                  setPending((p) => p.filter((_, idx) => idx !== i))
                }
              />
            ))}
            {uploading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-2xl border-2 flex-shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || sending}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={`Message ${agent.name}…`}
            className="rounded-2xl resize-none min-h-[48px] max-h-40 border-2"
          />
          <Button
            onClick={() => submit(input)}
            disabled={sending || uploading || (!input.trim() && pending.length === 0)}
            className="h-12 rounded-2xl px-5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
