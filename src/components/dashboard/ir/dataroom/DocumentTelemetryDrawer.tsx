import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useDocumentTelemetry, type IRDocument } from "../hooks/useDataRoom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Flame, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";

export function DocumentTelemetryDrawer({
  document,
  onOpenChange,
}: {
  document: IRDocument | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!document;
  const { views, hotSlides } = useDocumentTelemetry(document?.id ?? null);

  const heatmap = (hotSlides.data ?? [])
    .reduce<Record<number, number>>((acc, s) => {
      acc[s.slide_number] = (acc[s.slide_number] ?? 0) + s.total_dwell;
      return acc;
    }, {});

  const slideData = Object.entries(heatmap)
    .map(([slide, dwell]) => ({ slide: Number(slide), dwell }))
    .sort((a, b) => a.slide - b.slide);

  const totalViews = views.data?.length ?? 0;
  const uniqueViewers = new Set((views.data ?? []).map((v) => v.viewer_email ?? v.viewer_ip ?? v.id)).size;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{document?.title}</SheetTitle>
          <SheetDescription>Engagement telemetry</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 my-6">
          <Card className="p-3 text-center">
            <Eye className="h-4 w-4 mx-auto text-primary" />
            <div className="text-2xl font-bold mt-1">{totalViews}</div>
            <div className="text-xs text-muted-foreground">Total Views</div>
          </Card>
          <Card className="p-3 text-center">
            <Clock className="h-4 w-4 mx-auto text-primary" />
            <div className="text-2xl font-bold mt-1">{uniqueViewers}</div>
            <div className="text-xs text-muted-foreground">Unique Viewers</div>
          </Card>
          <Card className="p-3 text-center">
            <Flame className="h-4 w-4 mx-auto text-orange-500" />
            <div className="text-2xl font-bold mt-1">{slideData.filter(s => s.dwell >= 300).length}</div>
            <div className="text-xs text-muted-foreground">Hot Slides (≥5m)</div>
          </Card>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold">Slide Heatmap (dwell seconds)</h3>
          {slideData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No slide telemetry yet</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slideData}>
                  <XAxis dataKey="slide" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="dwell">
                    {slideData.map((entry, i) => (
                      <Cell key={i} fill={entry.dwell >= 300 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Recent Views</h3>
          {views.data?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No views yet</p>
          )}
          {views.data?.map((v) => (
            <Card key={v.id} className="p-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{v.viewer_email ?? "Anonymous"}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(v.started_at), { addSuffix: true })}
                  {v.user_agent && ` · ${v.user_agent.split(" ")[0]}`}
                </div>
              </div>
              {v.completed && <Badge variant="outline" className="text-xs">Completed</Badge>}
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
