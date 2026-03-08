import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Plus, Trash2, BookOpen, ClipboardCheck, MessageSquare, TrendingUp, Briefcase, RefreshCw } from "lucide-react";
import { StandaloneAssessmentCodeGenerator } from "@/components/dashboard/StandaloneAssessmentCodeGenerator";
import { StandaloneMockInterviewCodeGenerator } from "@/components/dashboard/StandaloneMockInterviewCodeGenerator";
import { StandaloneSalaryCodeGenerator } from "@/components/dashboard/StandaloneSalaryCodeGenerator";
import { JobApplicationCodeGenerator } from "@/components/dashboard/JobApplicationCodeGenerator";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "@/components/dashboard/DashboardSkeleton";

interface AccessCode {
  id: string;
  code: string;
  content_id: string;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  notes: string | null;
  content: {
    title: string;
  };
}

interface Content {
  id: string;
  title: string;
  price: number;
  content_type: string;
}

export const AccessCodeManager = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [paidContent, setPaidContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [maxUses, setMaxUses] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      await Promise.all([fetchCodes(), fetchPaidContent()]);
    } catch (error: any) {
      const errorMessage = error.message?.includes("timed out")
        ? "Loading took too long. Please try again."
        : "Failed to load data";
      setLoadError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaidContent = async () => {
    const { data, error } = await withTimeout(
      Promise.resolve(supabase
        .from("content")
        .select("id, title, price, content_type")
        .gt("price", 0)
        .eq("is_published", true)
        .order("title")),
      TIMEOUTS.DEFAULT,
      "Loading content timed out"
    );

    if (error) throw error;
    setPaidContent(data || []);
  };

  const fetchCodes = async () => {
    const { data, error } = await withTimeout(
      Promise.resolve(supabase
        .from("access_codes")
        .select(`
          *,
          content:content_id (title)
        `)
        .order("created_at", { ascending: false })),
      TIMEOUTS.DEFAULT,
      "Loading codes timed out"
    );

    if (error) throw error;
    setCodes(data || []);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCode = async () => {
    if (!selectedContentId) {
      toast.error("Please select a course");
      return;
    }

    setIsGenerating(true);
    try {
      const newCode = generateCode();
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        TIMEOUTS.AUTH,
        "Auth check timed out"
      );
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await withTimeout(
        Promise.resolve(supabase.from("access_codes").insert({
          code: newCode,
          content_id: selectedContentId,
          max_uses: maxUses,
          created_by: user.id,
          notes: notes || null,
        })),
        TIMEOUTS.DEFAULT,
        "Insert timed out"
      );

      if (error) throw error;

      toast.success(`Access code generated: ${newCode}`);
      setSelectedContentId("");
      setMaxUses(1);
      setNotes("");
      await fetchCodes();
    } catch (error: any) {
      console.error("Error generating code:", error);
      toast.error(error.message || "Failed to generate access code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleDeleteCode = async (id: string) => {
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("access_codes").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out"
      );
      if (error) throw error;
      toast.success("Access code deleted");
      await fetchCodes();
    } catch (error: any) {
      console.error("Error deleting code:", error);
      toast.error(error.message || "Failed to delete access code");
    }
  };

  if (isLoading) {
    return <DashboardTableSkeleton rows={5} columns={4} />;
  }

  if (loadError) {
    return <DashboardErrorState title="Failed to load access codes" message={loadError} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Courses</span>
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="interview" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Interview</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Salary</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Jobs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          {/* Generate New Code Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generate Course Access Code</CardTitle>
              <CardDescription>
                Create access codes for paid courses after receiving payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a paid course" />
                  </SelectTrigger>
                  <SelectContent>
                    {paidContent.map((content) => (
                      <SelectItem key={content.id} value={content.id}>
                        {content.title} - ${content.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="e.g., Student name, payment reference"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button onClick={handleGenerateCode} disabled={isGenerating || !selectedContentId} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Access Code"}
              </Button>
            </CardContent>
          </Card>

          {/* Active Codes Card */}
          <Card>
            <CardHeader>
              <CardTitle>Active Course Codes ({codes.length})</CardTitle>
              <CardDescription>
                Manage existing access codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {codes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No access codes generated yet
                </p>
              ) : (
                <div className="space-y-3">
                  {codes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-lg font-mono font-bold">{code.code}</code>
                          <Badge variant={code.is_active ? "default" : "secondary"}>
                            {code.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {code.current_uses}/{code.max_uses} uses
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {code.content?.title || "Unknown course"}
                        </p>
                        {code.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{code.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(code.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCode(code.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="mt-6">
          <StandaloneAssessmentCodeGenerator />
        </TabsContent>

        <TabsContent value="interview" className="mt-6">
          <StandaloneMockInterviewCodeGenerator />
        </TabsContent>

        <TabsContent value="salary" className="mt-6">
          <StandaloneSalaryCodeGenerator />
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <JobApplicationCodeGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};
