import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Users, BookOpen, Send, Check, Filter, RefreshCw } from "lucide-react";
import { getOutreachWhatsAppLink, getFirstName } from "@/lib/outreachTemplates";

interface Content {
  id: string;
  title: string;
  content_type: string;
  current_enrollment: number;
  is_published: boolean;
}

interface Talent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  country: string | null;
}

interface OutreachRecord {
  talent_id: string;
  course_id: string | null;
}

export function ContentOutreachManager() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"not_enrolled" | "not_pitched" | "all">("not_pitched");

  // Load published content
  const loadContents = useCallback(async () => {
    const { data, error } = await supabase
      .from("content")
      .select("id, title, content_type, current_enrollment, is_published")
      .eq("is_published", true)
      .in("content_type", ["recorded_course", "batch_class", "live_webinar"])
      .order("title");

    if (error) {
      console.error("Error loading content:", error);
      return;
    }

    setContents(data || []);
    setIsLoading(false);
  }, []);

  // Load talents for outreach
  const loadTalents = useCallback(async () => {
    if (!selectedContent) return;

    setIsLoading(true);

    // Get talents with phone numbers
    const { data: talentData, error: talentError } = await supabase
      .from("talents")
      .select("id, full_name, email, phone, profession_category_id, country")
      .not("phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (talentError) {
      console.error("Error loading talents:", talentError);
      setIsLoading(false);
      return;
    }

    // Get outreach records for this course
    const { data: outreachData } = await supabase
      .from("outreach_messages")
      .select("talent_id, course_id")
      .eq("product", "course")
      .eq("course_id", selectedContent.id);

    setOutreachRecords(outreachData || []);

    // Filter based on selection
    let filteredTalents = talentData || [];

    if (filterType === "not_pitched") {
      const pitchedTalentIds = new Set(
        (outreachData || []).map((r) => r.talent_id)
      );
      filteredTalents = filteredTalents.filter((t) => !pitchedTalentIds.has(t.id));
    }

    setTalents(filteredTalents);
    setIsLoading(false);
  }, [selectedContent, filterType]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  useEffect(() => {
    if (selectedContent) {
      loadTalents();
    }
  }, [selectedContent, loadTalents]);

  const handleSendOutreach = async (talent: Talent) => {
    if (!talent.phone || !selectedContent) return;

    setIsSending(talent.id);

    try {
      // Record outreach
      const { error } = await supabase.from("outreach_messages").insert({
        talent_id: talent.id,
        product: "course",
        course_id: selectedContent.id,
        message_content: `Course pitch: ${selectedContent.title}`,
      });

      if (error) {
        console.error("Error recording outreach:", error);
        toast.error("Failed to record outreach");
        return;
      }

      // Open WhatsApp
      const firstName = getFirstName(talent.full_name);
      const whatsappUrl = getOutreachWhatsAppLink(
        talent.phone,
        "course",
        firstName,
        selectedContent.title
      );
      window.open(whatsappUrl, "_blank");

      // Update local state
      setOutreachRecords((prev) => [
        ...prev,
        { talent_id: talent.id, course_id: selectedContent.id },
      ]);

      toast.success(`Outreach sent to ${talent.full_name}`);
    } finally {
      setIsSending(null);
    }
  };

  const isPitched = (talentId: string) => {
    return outreachRecords.some(
      (r) => r.talent_id === talentId && r.course_id === selectedContent?.id
    );
  };

  const contentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      recorded_course: "Course",
      batch_class: "Batch",
      live_webinar: "Webinar",
    };
    return labels[type] || type;
  };

  if (isLoading && contents.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Content Outreach
          </CardTitle>
          <CardDescription>
            Send WhatsApp nudges to talents for specific courses and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Content</label>
              <Select
                value={selectedContent?.id || ""}
                onValueChange={(value) => {
                  const content = contents.find((c) => c.id === value);
                  setSelectedContent(content || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course or content..." />
                </SelectTrigger>
                <SelectContent>
                  {contents.map((content) => (
                    <SelectItem key={content.id} value={content.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {contentTypeLabel(content.content_type)}
                        </Badge>
                        <span>{content.title}</span>
                        <span className="text-muted-foreground text-xs">
                          ({content.current_enrollment} enrolled)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Audience</label>
              <Select
                value={filterType}
                onValueChange={(value: "not_enrolled" | "not_pitched" | "all") =>
                  setFilterType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_pitched">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Never pitched this content
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All talents with phone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedContent && (
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div>
                <h3 className="font-medium">{selectedContent.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {contentTypeLabel(selectedContent.content_type)} •{" "}
                  {selectedContent.current_enrollment} current enrollments
                </p>
              </div>
              <Badge variant="secondary">
                {talents.length} targets ready
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Talent List */}
      {selectedContent && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Target Talents
              </CardTitle>
              <CardDescription>
                Talents matching your filter criteria
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadTalents}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : talents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No talents matching the criteria</p>
                <p className="text-sm">
                  Try changing the filter or select a different content
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {talents.map((talent) => (
                      <TableRow key={talent.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{talent.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {talent.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {talent.phone}
                        </TableCell>
                        <TableCell>
                          {talent.country ? (
                            <Badge variant="outline">{talent.country}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isPitched(talent.id) ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Pitched
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not pitched</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {talent.phone && !isPitched(talent.id) && (
                            <Button
                              size="sm"
                              onClick={() => handleSendOutreach(talent)}
                              disabled={isSending === talent.id}
                            >
                              {isSending === talent.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Send
                                </>
                              )}
                            </Button>
                          )}
                          {isPitched(talent.id) && (
                            <span className="text-sm text-muted-foreground">
                              Already sent
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
