import { useState } from "react";
import { ApplicationKanban } from "@/components/applications/ApplicationKanban";
import { Card } from "@/components/ui/card";

export function JobsKanbanPipelineTab() {
  const [showWithdrawn, setShowWithdrawn] = useState(false);

  return (
    <div className="space-y-3">
      <Card className="p-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Applications pipeline</h2>
          <p className="text-xs text-muted-foreground">
            Oversight across every company. Moves are logged in the audit trail.
          </p>
        </div>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showWithdrawn}
            onChange={(e) => setShowWithdrawn(e.target.checked)}
          />
          Show withdrawn
        </label>
      </Card>
      <ApplicationKanban showWithdrawn={showWithdrawn} />
    </div>
  );
}

export default JobsKanbanPipelineTab;
