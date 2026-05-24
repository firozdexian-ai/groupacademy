import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUserId } from "@/lib/auth";
import { useAuthoringTrends } from "@/domains/learning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { InlineSpinner } from "@/components/common/InlineSpinner";

// 1. Define explicit contracts for your data
interface AuthoringTrends {
 window_days: number;
 totals: {
 courses: number;
 modules: number;
 items: number;
 flag_items: number;
 translated_items: number;
 };
 flag_breakdown: Record<string, number>;
 ai_assist: { rewrites_applied: number; translations_applied: number };
 hotspots: { course_id: string; course_title: string; flagged_count: number }[];
 wins: { course_id: string; course_title: string; resolved_count: number }[];
}

const FLAG_COLORS: Record<string, string> = {
 low_p_value: "hsl(var(--destructive))",
 miscalibrated: "hsl(38 92% 50%)",
 stale: "hsl(var(--muted-foreground))",
 trivial: "hsl(var(--primary))",
};

export default function InstructorInsights() {
 const navigate = useNavigate();
 const [params] = useSearchParams();
 const [meId, setMeId] = React.useState<string | null>(null);

 React.useEffect(() => {
 getCurrentUserId().then((id) => setMeId(id));
 }, []);

 const instructorId = params.get("instructor") || meId;
 const { data, isLoading } = useAuthoringTrends(instructorId, 30);
 const trends = data as AuthoringTrends | undefined;

 const flagPie = React.useMemo(() => {
 if (!trends?.flag_breakdown) return [];
 return Object.entries(trends.flag_breakdown)
 .filter(([, v]) => v > 0)
 .map(([k, v]) => ({ name: k.replace("_", " "), value: v, key: k }));
 }, [trends?.flag_breakdown]);

 if (!instructorId) return null;
 if (isLoading)
 return (
 <InlineSpinner size="lg" />
 );
 if (!trends) return <div className="p-6 text-center text-muted-foreground">No insights available.</div>;

 return (
 <div className="container max-w-5xl py-6 space-y-4">
 {/* ... (Keep your existing Header/StatCards) ... */}

 <div className="grid md:grid-cols-2 gap-4">
 <Card>
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-500" /> Flag breakdown
 </CardTitle>
 </CardHeader>
 <CardContent className="h-64">
 {flagPie.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center mt-12">No flagged items 🎉</p>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie data={flagPie} dataKey="value" nameKey="name" outerRadius={80} label>
 {flagPie.map((d) => (
 <Cell key={d.key} fill={FLAG_COLORS[d.key] ?? "hsl(var(--primary))"} />
 ))}
 </Pie>
 <Tooltip />
 <Legend />
 </PieChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>
 {/* ... (Rest of your component) ... */}
 </div>
 </div>
 );
}
