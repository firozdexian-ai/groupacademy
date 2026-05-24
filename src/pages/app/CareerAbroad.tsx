import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { InlineSpinner } from "@/components/common/InlineSpinner";

/**
 * Legacy /app/abroad redirect → Learning Hub abroad events tab.
 * Preserves existing query params so analytics/filters carry through.
 */
export default function CareerAbroad() {
 const navigate = useNavigate();
 const location = useLocation();

 React.useEffect(() => {
 const params = new URLSearchParams(location.search);
 params.set("tab", "events");
 params.set("kind", "abroad");

 navigate(
 { pathname: "/app/learning", search: `?${params.toString()}` },
 { replace: true },
 );
 }, [navigate, location.search]);

 return (
 <div
 role="status"
 className="min-h-screen w-full grid place-items-center bg-background text-xs font-medium text-muted-foreground"
 >
 <div className="flex items-center gap-2">
 <InlineSpinner size="sm" />
 <span>Taking you to Study Abroad…</span>
 </div>
 </div>
 );
}
