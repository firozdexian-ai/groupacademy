import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Check, X, MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ConnRow = {
  id: string;
  sender_talent_id: string;
  recipient_talent_id: string;
  status: string;
  fee_paid: number;
  expires_at: string;
  created_at: string;
  responded_at: string | null;
  other: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    custom_profession: string | null;
  };
  direction: "incoming" | "outgoing";
};

export default function Connections() {
  const { talent } = useTalent();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ConnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!talent?.id) return;
    setLoading(true);
    const { data: conns } = await supabase
      .from("talent_connections")
      .select("*")
      .or(`sender_talent_id.eq.${talent.id},recipient_talent_id.eq.${talent.id}`)
      .order("created_at", { ascending: false });
    const otherIds = Array.from(
      new Set((conns ?? []).map((c: any) => (c.sender_talent_id === talent.id ? c.recipient_talent_id : c.sender_talent_id))),
    );
    const { data: talents } = otherIds.length
      ? await supabase.from("talents").select("id, full_name, profile_photo_url, custom_profession").in("id", otherIds)
      : { data: [] as any[] };
    const tMap = new Map((talents ?? []).map((t: any) => [t.id, t]));
    setRows(
      (conns ?? []).map((c: any) => ({
        ...c,
        direction: c.recipient_talent_id === talent.id ? "incoming" : "outgoing",
        other: tMap.get(c.sender_talent_id === talent.id ? c.recipient_talent_id : c.sender_talent_id) ?? {
          id: "",
          full_name: "Unknown",
          profile_photo_url: null,
          custom_profession: null,
        },
      })),
    );
    setLoading(false);
  }, [talent?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (id: string) => {
    setActing(id);
    const { data, error } = await supabase.rpc("connection_accept_and_open_thread", { _connection_id: id });
    setActing(null);
    if (error) {
      toast({ title: "Couldn't accept", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Connection accepted", description: "Opening chat…" });
    if (data) navigate(`/app/messages/${data}`);
    else load();
  };

  const decline = async (id: string) => {
    setActing(id);
    const { error } = await supabase.rpc("talent_connection_respond", { _request: id, _accept: false });
    setActing(null);
    if (error) {
      toast({ title: "Couldn't decline", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Declined", description: "Sender was refunded." });
    load();
  };

  const incoming = rows.filter((r) => r.direction === "incoming" && r.status === "pending");
  const outgoing = rows.filter((r) => r.direction === "outgoing" && r.status === "pending");
  const accepted = rows.filter((r) => r.status === "accepted");
  const history = rows.filter((r) => ["declined", "expired", "refunded"].includes(r.status));

  const renderCard = (r: ConnRow) => (
    <Card key={r.id} className="p-4 flex items-center gap-3">
      <Link to={`/app/talents/${r.other.id}`}>
        <Avatar className="h-12 w-12">
          <AvatarImage src={r.other.profile_photo_url ?? undefined} />
          <AvatarFallback>{r.other.full_name?.[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/app/talents/${r.other.id}`} className="font-medium truncate hover:underline">
          {r.other.full_name}
        </Link>
        <div className="text-xs text-muted-foreground truncate">{r.other.custom_profession || "Talent"}</div>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })} · {r.fee_paid} cr
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {r.direction === "incoming" && r.status === "pending" && (
          <>
            <Button size="sm" onClick={() => accept(r.id)} disabled={acting === r.id} className="gap-1">
              <Check className="h-3.5 w-3.5" /> Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => decline(r.id)} disabled={acting === r.id} className="gap-1">
              <X className="h-3.5 w-3.5" /> Decline
            </Button>
          </>
        )}
        {r.status === "accepted" && (
          <Button size="sm" variant="outline" onClick={() => navigate(`/app/messages`)} className="gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> Chat
          </Button>
        )}
        {r.direction === "outgoing" && r.status === "pending" && (
          <Badge variant="secondary">Pending</Badge>
        )}
        {["declined", "expired", "refunded"].includes(r.status) && (
          <Badge variant="outline" className="capitalize">{r.status}</Badge>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Connections
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage incoming requests, track sent ones, and chat with accepted connections.
        </p>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="incoming">Incoming{incoming.length > 0 && ` (${incoming.length})`}</TabsTrigger>
          <TabsTrigger value="outgoing">Sent{outgoing.length > 0 && ` (${outgoing.length})`}</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming" className="space-y-2 mt-4">
          {incoming.length === 0 ? <Empty msg="No pending requests." /> : incoming.map(renderCard)}
        </TabsContent>
        <TabsContent value="outgoing" className="space-y-2 mt-4">
          {outgoing.length === 0 ? <Empty msg="You haven't sent any requests." /> : outgoing.map(renderCard)}
        </TabsContent>
        <TabsContent value="accepted" className="space-y-2 mt-4">
          {accepted.length === 0 ? <Empty msg="No accepted connections yet." /> : accepted.map(renderCard)}
        </TabsContent>
        <TabsContent value="history" className="space-y-2 mt-4">
          {history.length === 0 ? <Empty msg="Nothing here yet." /> : history.map(renderCard)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <Card className="p-8 text-center text-sm text-muted-foreground">{msg}</Card>;
}
