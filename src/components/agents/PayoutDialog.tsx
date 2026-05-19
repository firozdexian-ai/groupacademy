import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";

interface PayoutDialogProps {
  available: number;
  onCreated?: () => void;
}

export function PayoutDialog({ available }: PayoutDialogProps) {
  return (
    <Card className="inline-flex">
      <CardContent className="p-2 flex items-center gap-2 text-xs">
        <Coins className="h-4 w-4" />
        Available: {Number(available).toFixed(1)}
      </CardContent>
    </Card>
  );
}
