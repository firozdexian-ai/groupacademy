import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, ExternalLink, Loader2, Eye, FileText, MessageCircle, Gift, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TalentDetailDialog } from "./TalentDetailDialog";

const FREE_PORTFOLIO_LIMIT = 1000;

interface PortfolioRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  profile_data: {
    education?: any[];
    experience?: any[];
    skills?: any[];
    projects?: any[];
    achievements?: any[];
  } | null;
  certificates: any;
  achievements: string | null;
  social_links: Record<string, string> | null;
  additional_notes: string | null;
  status: string;
  admin_notes: string | null;
  portfolio_url: string | null;
  portfolio_credentials: Record<string, any> | null;
  created_at: string;
  profession_category?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  contacted: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-purple-500/10 text-purple-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function PortfolioRequestsManager() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PortfolioRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<PortfolioRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTalentEmail, setSelectedTalentEmail] = useState<string | null>(null);
  const [selectedTalentName, setSelectedTalentName] = useState<string>("");
  
  // Edit form state
  const [editStatus, setEditStatus] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [editPortfolioUrl, setEditPortfolioUrl] = useState("");
  const [editCmsEmail, setEditCmsEmail] = useState("");
  const [editCmsPassword, setEditCmsPassword] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from('portfolio_requests')
            .select(`
              *,
              profession_category:profession_categories(name)
            `)
            .order('created_at', { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading portfolio requests timed out"
      );

      if (queryError) throw queryError;
      setRequests((data || []) as unknown as PortfolioRequest[]);
    } catch (err: any) {
      console.error("Error loading portfolio requests:", err);
      setError(err.message || "Failed to load portfolio requests");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (request: PortfolioRequest) => {
    setSelectedRequest(request);
    setEditStatus(request.status);
    setEditAdminNotes(request.admin_notes || "");
    setEditPortfolioUrl(request.portfolio_url || "");
    setEditCmsEmail(request.portfolio_credentials?.email || "");
    setEditCmsPassword(request.portfolio_credentials?.password || "");
    setIsDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;
    
    setIsUpdating(true);
    try {
      const updates: any = {
        status: editStatus,
        admin_notes: editAdminNotes || null,
      };

      if (editStatus === 'completed') {
        updates.portfolio_url = editPortfolioUrl || null;
        updates.portfolio_credentials = (editCmsEmail || editCmsPassword) 
          ? { email: editCmsEmail, password: editCmsPassword }
          : null;
      }

      const { error } = await supabase
        .from('portfolio_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({ title: "Updated", description: "Request updated successfully" });
      setIsDetailOpen(false);
      loadRequests();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  if (loading) {
    return <DashboardTableSkeleton rows={5} columns={6} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load requests" message={error} onRetry={loadRequests} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* Free Counter */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Gift className="h-8 w-8 text-primary" />
              <div>
                <div className="text-xl font-bold text-primary">
                  {Math.max(0, FREE_PORTFOLIO_LIMIT - requests.length)}
                </div>
                <div className="text-xs text-muted-foreground">Free slots left</div>
              </div>
            </div>
            
            {/* Status Breakdown */}
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = requests.filter(r => r.status === status).length;
              return (
                <div 
                  key={status} 
                  className={`px-3 py-2 rounded-lg text-center cursor-pointer transition-all hover:scale-105 ${statusColors[status]} ${statusFilter === status ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                  onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                >
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-xs">{label}</div>
                </div>
              );
            })}
          </div>
          
          {/* Summary Line */}
          <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span><strong>{requests.length}</strong> total requests</span>
            <span>•</span>
            <span><strong>{requests.filter(r => r.cv_url).length}</strong> with CV</span>
            <span>•</span>
            <span><strong>{requests.filter(r => r.profile_data && Object.keys(r.profile_data).some(k => (r.profile_data as any)[k]?.length > 0)).length}</strong> with profile data</span>
            <span>•</span>
            <span><strong>{requests.filter(r => r.custom_profession).length}</strong> custom professions</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Profession</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No portfolio requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => {
                const hasProfileData = request.profile_data && (
                  (request.profile_data.education?.length || 0) > 0 ||
                  (request.profile_data.experience?.length || 0) > 0
                );
                return (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium">{request.full_name}</div>
                    <div className="text-xs text-muted-foreground">{request.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.custom_profession || request.profession_category?.name || '-'}
                    </div>
                    {request.custom_profession && (
                      <Badge variant="outline" className="text-[10px] mt-1">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {request.cv_url && <Badge variant="secondary" className="text-[10px]">📄 CV</Badge>}
                      {hasProfileData && <Badge variant="secondary" className="text-[10px]">📋 Profile</Badge>}
                      {!request.cv_url && !hasProfileData && <span className="text-muted-foreground text-xs">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedTalentEmail(request.email);
                          setSelectedTalentName(request.full_name);
                        }}
                        title="View Talent Profile"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openDetail(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openWhatsApp(request.phone)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      {request.cv_url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => window.open(request.cv_url!, '_blank')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );})
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Portfolio Request Details</DialogTitle>
            <DialogDescription>
              Review and manage this portfolio request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profession</Label>
                  <p className="font-medium">
                    {selectedRequest.custom_profession || selectedRequest.profession_category?.name || 'Not specified'}
                    {selectedRequest.custom_profession && <Badge variant="outline" className="ml-2 text-[10px]">Custom</Badge>}
                  </p>
                </div>
              </div>

              {/* Profile Data Section */}
              {selectedRequest.profile_data && (
                (selectedRequest.profile_data.education?.length || 0) > 0 ||
                (selectedRequest.profile_data.experience?.length || 0) > 0 ||
                (selectedRequest.profile_data.skills?.length || 0) > 0
              ) && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label className="text-muted-foreground font-semibold">Profile Data (No CV)</Label>
                  
                  {(selectedRequest.profile_data.education?.length || 0) > 0 && (
                    <div>
                      <span className="text-xs font-medium">Education ({selectedRequest.profile_data.education?.length})</span>
                      <div className="text-sm mt-1 space-y-1">
                        {selectedRequest.profile_data.education?.slice(0, 2).map((edu: any, i: number) => (
                          <div key={i} className="text-muted-foreground">
                            • {edu.degree} at {edu.institution} ({edu.year})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(selectedRequest.profile_data.experience?.length || 0) > 0 && (
                    <div>
                      <span className="text-xs font-medium">Experience ({selectedRequest.profile_data.experience?.length})</span>
                      <div className="text-sm mt-1 space-y-1">
                        {selectedRequest.profile_data.experience?.slice(0, 2).map((exp: any, i: number) => (
                          <div key={i} className="text-muted-foreground">
                            • {exp.title} at {exp.company} ({exp.duration})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(selectedRequest.profile_data.skills?.length || 0) > 0 && (
                    <div>
                      <span className="text-xs font-medium">Skills ({selectedRequest.profile_data.skills?.length})</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequest.profile_data.skills?.slice(0, 5).map((skill: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{skill.name}</Badge>
                        ))}
                        {(selectedRequest.profile_data.skills?.length || 0) > 5 && (
                          <Badge variant="outline" className="text-[10px]">+{(selectedRequest.profile_data.skills?.length || 0) - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Documents</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.cv_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(selectedRequest.cv_url!, '_blank')}>
                      <FileText className="h-4 w-4 mr-1" /> CV
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  {Array.isArray(selectedRequest.certificates) && selectedRequest.certificates.map((cert: any, i: number) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => window.open(cert.url, '_blank')}>
                      <FileText className="h-4 w-4 mr-1" /> {cert.name}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              {selectedRequest.social_links && Object.keys(selectedRequest.social_links).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Social Links</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedRequest.social_links).map(([key, url]) => (
                      url && (
                        <Button key={key} variant="outline" size="sm" onClick={() => window.open(url as string, '_blank')}>
                          {key} <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {selectedRequest.achievements && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Achievements</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.achievements}</p>
                </div>
              )}

              {/* Additional Notes from User */}
              {selectedRequest.additional_notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">User Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.additional_notes}</p>
                </div>
              )}

              <hr />

              {/* Admin Controls */}
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Admin Notes (Internal)</Label>
                  <Textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    rows={2}
                  />
                </div>

                {editStatus === 'completed' && (
                  <div className="space-y-4 p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold">Delivery Details</h4>
                    <div>
                      <Label>Portfolio URL</Label>
                      <Input
                        value={editPortfolioUrl}
                        onChange={(e) => setEditPortfolioUrl(e.target.value)}
                        placeholder="https://portfolio-site.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>CMS Email</Label>
                        <Input
                          value={editCmsEmail}
                          onChange={(e) => setEditCmsEmail(e.target.value)}
                          placeholder="user@cms.com"
                        />
                      </div>
                      <div>
                        <Label>CMS Password</Label>
                        <Input
                          value={editCmsPassword}
                          onChange={(e) => setEditCmsPassword(e.target.value)}
                          placeholder="password123"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TalentDetailDialog
        open={!!selectedTalentEmail}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTalentEmail(null);
            setSelectedTalentName("");
          }
        }}
        talentEmail={selectedTalentEmail || ""}
        talentName={selectedTalentName}
      />
    </div>
  );
}