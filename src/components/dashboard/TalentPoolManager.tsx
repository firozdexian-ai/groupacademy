import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Users, MessageSquare, Download, ExternalLink, RefreshCw, Eye, Loader2, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Professional {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  profile_type: string;
  current_status: string | null;
  education: any;
  experience: any;
  skills: any;
  services_used: any;
  linkedin_url: string | null;
  portfolio_url: string | null;
  cv_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

export function TalentPoolManager() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  
  // Portfolio request dialog state
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [portfolioNotes, setPortfolioNotes] = useState('');
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [portfolioProfessional, setPortfolioProfessional] = useState<Professional | null>(null);

  useEffect(() => {
    loadProfessionals();
    loadProfessionCategories();
  }, []);

  const loadProfessionals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from('professionals')
            .select('*')
            .order('updated_at', { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading talent pool timed out"
      );

      if (queryError) throw queryError;
      setProfessionals(data || []);
    } catch (err: any) {
      console.error('Error loading professionals:', err);
      setError(err.message || 'Failed to load talent pool');
      toast.error('Failed to load talent pool');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfessionCategories = async () => {
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from('profession_categories')
            .select('id, name')
            .eq('is_active', true)
        ).then(q => q),
        TIMEOUTS.CATEGORY_LOAD,
        "Loading categories timed out"
      );

      if (queryError) throw queryError;
      setProfessionCategories(data || []);
    } catch (err: any) {
      console.error('Error loading profession categories:', err);
    }
  };

  const getProfessionName = (categoryId: string | null) => {
    if (!categoryId) return 'Not set';
    const category = professionCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const handleCreatePortfolioRequest = async () => {
    if (!portfolioProfessional) return;

    setCreatingPortfolio(true);
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from('portfolio_requests').insert({
          full_name: portfolioProfessional.full_name,
          email: portfolioProfessional.email,
          phone: portfolioProfessional.phone || '',
          profession_category_id: portfolioProfessional.profession_category_id,
          cv_url: portfolioProfessional.cv_url,
          additional_notes: portfolioNotes || `Created from Talent Pool on ${new Date().toLocaleDateString()}`,
          status: 'pending',
        })),
        TIMEOUTS.DEFAULT,
        "Insert timed out"
      );

      if (error) throw error;

      toast.success('Portfolio request created!', {
        description: 'View it in the Portfolio Requests tab.',
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/dashboard?tab=portfolios';
          },
        },
      });

      setPortfolioDialogOpen(false);
      setPortfolioNotes('');
      setPortfolioProfessional(null);
    } catch (error: any) {
      console.error('Error creating portfolio request:', error);
      toast.error('Failed to create portfolio request');
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const openPortfolioDialog = (professional: Professional) => {
    setPortfolioProfessional(professional);
    setPortfolioNotes('');
    setPortfolioDialogOpen(true);
  };

  const filteredProfessionals = professionals.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.phone?.includes(query) ||
      (p.skills as string[])?.some(s => s.toLowerCase().includes(query))
    );
  });

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('880')) {
      return `https://wa.me/${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `https://wa.me/880${cleaned.slice(1)}`;
    } else if (cleaned.length === 10) {
      return `https://wa.me/880${cleaned}`;
    }
    return `https://wa.me/${cleaned}`;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Category', 'Status', 'Skills', 'Created At'];
    const rows = filteredProfessionals.map(p => [
      p.full_name,
      p.email,
      p.phone || '',
      getProfessionName(p.profession_category_id),
      p.current_status || '',
      (p.skills as string[])?.join('; ') || '',
      new Date(p.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `talent-pool-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const getServiceBadges = (servicesUsed: any[]) => {
    if (!servicesUsed || servicesUsed.length === 0) return null;
    return servicesUsed.map((service: any, idx: number) => (
      <Badge key={idx} variant="outline" className="text-xs">
        {service.service?.replace('_', ' ') || 'Unknown'}
      </Badge>
    ));
  };

  if (isLoading) {
    return <DashboardTableSkeleton rows={5} columns={6} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load talent pool" message={error} onRetry={loadProfessionals} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Talent Pool
              </CardTitle>
              <CardDescription>
                {professionals.length} professionals in the database
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadProfessionals} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No professionals found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Services Used</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{professional.full_name}</p>
                          <p className="text-xs text-muted-foreground">{professional.profile_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{professional.email}</p>
                          <p className="text-muted-foreground">{professional.phone || 'No phone'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getProfessionName(professional.profession_category_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getServiceBadges(professional.services_used as any[]) || (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(professional.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPortfolioDialog(professional)}
                            title="Create Portfolio Request"
                          >
                            <Briefcase className="w-4 h-4" />
                          </Button>
                          {professional.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(formatWhatsAppLink(professional.phone), '_blank')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedProfessional(professional)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{professional.full_name}</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4 p-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Email</p>
                                      <p>{professional.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Phone</p>
                                      <p>{professional.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Status</p>
                                      <p>{professional.current_status || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Profile Type</p>
                                      <p>{professional.profile_type}</p>
                                    </div>
                                  </div>

                                  {(professional.education as any[])?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Education</p>
                                      <div className="space-y-2">
                                        {(professional.education as any[]).map((edu: any, idx: number) => (
                                          <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                                            <p className="font-medium">{edu.degree} in {edu.field}</p>
                                            <p className="text-muted-foreground">{edu.institution}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {(professional.experience as any[])?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Experience</p>
                                      <div className="space-y-2">
                                        {(professional.experience as any[]).map((exp: any, idx: number) => (
                                          <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                                            <p className="font-medium">{exp.title}</p>
                                            <p className="text-muted-foreground">{exp.company} • {exp.duration}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {(professional.skills as string[])?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Skills</p>
                                      <div className="flex flex-wrap gap-1">
                                        {(professional.skills as string[]).map((skill: string, idx: number) => (
                                          <Badge key={idx} variant="outline">{skill}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-4 border-t">
                                    {professional.linkedin_url && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={professional.linkedin_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          LinkedIn
                                        </a>
                                      </Button>
                                    )}
                                    {professional.cv_url && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={professional.cv_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          View CV
                                        </a>
                                      </Button>
                                    )}
                                    {professional.phone && (
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => window.open(formatWhatsAppLink(professional.phone), '_blank')}
                                      >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        WhatsApp
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Request Dialog */}
      <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Portfolio Request</DialogTitle>
          </DialogHeader>
          {portfolioProfessional && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{portfolioProfessional.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{portfolioProfessional.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{portfolioProfessional.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <Badge variant="secondary">{getProfessionName(portfolioProfessional.profession_category_id)}</Badge>
                </div>
              </div>
              {portfolioProfessional.cv_url && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">CV</p>
                  <a href={portfolioProfessional.cv_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> View CV
                  </a>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="portfolioNotes">Additional Notes</Label>
                <Textarea
                  id="portfolioNotes"
                  value={portfolioNotes}
                  onChange={(e) => setPortfolioNotes(e.target.value)}
                  placeholder="Add any notes for the Talent Success Executive..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePortfolioRequest} disabled={creatingPortfolio}>
              {creatingPortfolio && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
