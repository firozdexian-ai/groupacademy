import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, ExternalLink, Loader2, Eye, FileText, MessageCircle, Download, User, GraduationCap, Briefcase, Wrench, FolderOpen, Award } from "lucide-react";
import ProfileSummaryPDFTemplate from "@/components/portfolio/ProfileSummaryPDFTemplate";
import { generateProfileSummaryPDF } from "@/lib/profilePdfGenerator";

interface ProfileData {
  education: Array<{ institution: string; degree: string; fieldOfStudy: string; graduationYear: string; current: boolean }>;
  experience: Array<{ title: string; company: string; duration: string; description: string }>;
  skills: Array<{ name: string; proficiency: string }>;
  projects: Array<{ name: string; description: string; url: string }>;
  achievements: Array<{ title: string; description: string; date: string }>;
}

interface PortfolioRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  certificates: any;
  achievements: string | null;
  social_links: Record<string, string> | null;
  additional_notes: string | null;
  status: string;
  admin_notes: string | null;
  portfolio_url: string | null;
  portfolio_credentials: Record<string, any> | null;
  profile_data: ProfileData | null;
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

const proficiencyColors: Record<string, string> = {
  beginner: 'bg-yellow-500/20 text-yellow-700',
  intermediate: 'bg-blue-500/20 text-blue-700',
  advanced: 'bg-green-500/20 text-green-700',
  expert: 'bg-purple-500/20 text-purple-700',
};

export default function PortfolioRequestsManager() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PortfolioRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<PortfolioRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfTemplate, setShowPdfTemplate] = useState(false);
  
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
    try {
      const { data, error } = await supabase
        .from('portfolio_requests')
        .select(`
          *,
          profession_category:profession_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as unknown as PortfolioRequest[]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const handleDownloadProfilePDF = async () => {
    if (!selectedRequest || !selectedRequest.profile_data) return;
    
    setIsGeneratingPDF(true);
    setShowPdfTemplate(true);
    
    try {
      // Small delay to ensure template is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      await generateProfileSummaryPDF(selectedRequest.full_name);
      toast({ title: "Success", description: "Profile summary downloaded" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
      setShowPdfTemplate(false);
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

  const getProfessionDisplay = (request: PortfolioRequest) => {
    if (request.custom_profession) {
      return request.custom_profession;
    }
    return request.profession_category?.name || 'Not specified';
  };

  const hasProfileData = (request: PortfolioRequest) => {
    const pd = request.profile_data;
    if (!pd) return false;
    return (
      (pd.education && pd.education.length > 0) ||
      (pd.experience && pd.experience.length > 0) ||
      (pd.skills && pd.skills.length > 0) ||
      (pd.projects && pd.projects.length > 0) ||
      (pd.achievements && pd.achievements.length > 0)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(statusLabels).map(([status, label]) => {
          const count = requests.filter(r => r.status === status).length;
          return (
            <div key={status} className={`px-3 py-2 rounded-lg text-center ${statusColors[status]}`}>
              <div className="text-lg font-semibold">{count}</div>
              <div className="text-xs">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Profession</TableHead>
              <TableHead>Type</TableHead>
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
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.full_name}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getProfessionDisplay(request)}
                      {request.custom_profession && (
                        <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {request.cv_url && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />CV
                        </Badge>
                      )}
                      {hasProfileData(request) && (
                        <Badge variant="secondary" className="text-xs">
                          <User className="h-3 w-3 mr-1" />Profile
                        </Badge>
                      )}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Portfolio Request Details</DialogTitle>
            <DialogDescription>
              Review and manage this portfolio request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="profile" disabled={!hasProfileData(selectedRequest)}>
                  Profile Data
                </TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
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
                      {getProfessionDisplay(selectedRequest)}
                      {selectedRequest.custom_profession && (
                        <Badge variant="outline" className="ml-2">Custom</Badge>
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => openWhatsApp(selectedRequest.phone)}>
                    <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                  </Button>
                  {selectedRequest.cv_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(selectedRequest.cv_url!, '_blank')}>
                      <FileText className="h-4 w-4 mr-1" /> View CV
                    </Button>
                  )}
                  {hasProfileData(selectedRequest) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadProfilePDF}
                      disabled={isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Download Profile Summary
                    </Button>
                  )}
                </div>

                {/* Social Links */}
                {selectedRequest.social_links && Object.keys(selectedRequest.social_links).filter(k => selectedRequest.social_links![k]).length > 0 && (
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

                {/* Additional Notes from User */}
                {selectedRequest.additional_notes && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">User Notes</Label>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.additional_notes}</p>
                  </div>
                )}
              </TabsContent>

              {/* Profile Data Tab */}
              <TabsContent value="profile" className="space-y-6">
                {selectedRequest.profile_data && (
                  <>
                    {/* Education */}
                    {selectedRequest.profile_data.education && selectedRequest.profile_data.education.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-primary" />
                          <Label className="text-lg font-semibold">Education</Label>
                        </div>
                        <div className="space-y-3">
                          {selectedRequest.profile_data.education.map((edu, index) => (
                            <div key={index} className="bg-muted p-3 rounded-lg">
                              <p className="font-medium">{edu.degree} in {edu.fieldOfStudy}</p>
                              <p className="text-sm text-muted-foreground">
                                {edu.institution} • {edu.current ? 'Currently studying' : edu.graduationYear}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {selectedRequest.profile_data.experience && selectedRequest.profile_data.experience.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <Label className="text-lg font-semibold">Experience</Label>
                        </div>
                        <div className="space-y-3">
                          {selectedRequest.profile_data.experience.map((exp, index) => (
                            <div key={index} className="bg-muted p-3 rounded-lg">
                              <p className="font-medium">{exp.title}</p>
                              <p className="text-sm text-primary">{exp.company} • {exp.duration}</p>
                              {exp.description && (
                                <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {selectedRequest.profile_data.skills && selectedRequest.profile_data.skills.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-5 w-5 text-primary" />
                          <Label className="text-lg font-semibold">Skills</Label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.profile_data.skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              className={proficiencyColors[skill.proficiency] || 'bg-secondary'}
                            >
                              {skill.name} ({skill.proficiency})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {selectedRequest.profile_data.projects && selectedRequest.profile_data.projects.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-primary" />
                          <Label className="text-lg font-semibold">Projects</Label>
                        </div>
                        <div className="space-y-3">
                          {selectedRequest.profile_data.projects.map((project, index) => (
                            <div key={index} className="bg-muted p-3 rounded-lg">
                              <p className="font-medium">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-muted-foreground">{project.description}</p>
                              )}
                              {project.url && (
                                <Button variant="link" size="sm" className="h-auto p-0 mt-1" onClick={() => window.open(project.url, '_blank')}>
                                  {project.url} <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {selectedRequest.profile_data.achievements && selectedRequest.profile_data.achievements.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          <Label className="text-lg font-semibold">Achievements</Label>
                        </div>
                        <div className="space-y-3">
                          {selectedRequest.profile_data.achievements.map((achievement, index) => (
                            <div key={index} className="bg-muted p-3 rounded-lg">
                              <p className="font-medium">{achievement.title}</p>
                              {achievement.description && (
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              )}
                              {achievement.date && (
                                <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Documents & Certificates</Label>
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
                    {!selectedRequest.cv_url && (!selectedRequest.certificates || selectedRequest.certificates.length === 0) && (
                      <p className="text-sm text-muted-foreground">No documents uploaded</p>
                    )}
                  </div>
                </div>

                {/* Achievements Text */}
                {selectedRequest.achievements && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Achievements (Text)</Label>
                    <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.achievements}</p>
                  </div>
                )}
              </TabsContent>

              {/* Admin Tab */}
              <TabsContent value="admin" className="space-y-4">
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
              </TabsContent>
            </Tabs>
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

      {/* Hidden PDF Template */}
      {showPdfTemplate && selectedRequest && selectedRequest.profile_data && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ProfileSummaryPDFTemplate
            fullName={selectedRequest.full_name}
            email={selectedRequest.email}
            phone={selectedRequest.phone}
            profession={selectedRequest.profession_category?.name || 'Not specified'}
            customProfession={selectedRequest.custom_profession}
            profileData={selectedRequest.profile_data}
            socialLinks={selectedRequest.social_links}
            achievementsText={selectedRequest.achievements}
          />
        </div>
      )}
    </div>
  );
}
