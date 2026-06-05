import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * AdminTabPlaceholder — internal-only stub for admin tabs that are
 * registered in the navigation matrix but not yet wired to real UI.
 *
 * Renders a calm, branded panel so the admin shell never shows a blank screen
 * or a broken loader. Unlike `ComingSoonGate`, this is not a public waitlist —
 * admins don't sign up to use their own tooling.
 */
export function AdminTabPlaceholder({
  tabKey,
  title,
  note,
}: {
  tabKey: string;
  title?: string;
  note?: string;
}) {
  return (
    <div className="w-full px-3 py-6 sm:py-10">
      <Card className="mx-auto max-w-xl border-dashed border-border/70 bg-muted/20">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Construction className="h-3 w-3" />
              Not yet wired
            </Badge>
            <span className="text-xs text-muted-foreground">{tabKey}</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              {title ?? "This admin tab is reserved"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {note ??
                "The route is registered in the admin navigation matrix but no operator UI ships yet. It will appear here automatically once the underlying module is connected."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminTabPlaceholder;
