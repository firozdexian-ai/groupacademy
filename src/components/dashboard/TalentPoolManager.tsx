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

interface Talent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  cv_text: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  services_used: any;
  created_at: string;
  updated_at: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

export function TalentPoolManager() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  
  // Portfolio request dialog state
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [portfolioNotes, setPortfolioNotes] = useState('');
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [portfolioTalent, setPortfolioTalent] = useState<Talent | null>(null);

  useEffect(() => {
    loadTalents();
    loadProfessionCategories();
  }, []);

  const loadTalents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from('talents')
            .select('*')
            .order('updated_at', { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading talent pool timed out"
      );

      if (queryError) throw queryError;
      setTalents(data || []);
    } catch (err: any) {
      console.error('Error loading talents:', err);
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

  const getProfessionName = (categoryId: string | null, customProfession: string | null) => {
    if (customProfession) return customProfession;
    if (!categoryId) return 'Not set';
    const category = professionCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const handleCreatePortfolioRequest = async () => {
    if (!portfolioTalent) return;

    setCreatingPortfolio(true);
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from('portfolio_requests').insert({
          full_name: portfolioTalent.full_name,
          email: portfolioTalent.email,
          phone: portfolioTalent.phone || '',
          profession_category_id: portfolioTalent.profession_category_id,
          cv_url: portfolioTalent.cv_url,
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
      setPortfolioTalent(null);
    } catch (error: any) {
      console.error('Error creating portfolio request:', error);
      toast.error('Failed to create portfolio request');
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const openPortfolioDialog = (talent: Talent) => {
    setPortfolioTalent(talent);
    setPortfolioNotes('');
    setPortfolioDialogOpen(true);
  };

  const filteredTalents = talents.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      t.full_name?.toLowerCase().includes(query) ||
      t.email?.toLowerCase().includes(query) ||
      t.phone?.includes(query) ||
      t.custom_profession?.toLowerCase().includes(query)
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
    const headers = ['Name', 'Email', 'Phone', 'Category', 'Services Used', 'Created At'];
    const rows = filteredTalents.map(t => [
      t.full_name,
      t.email,
      t.phone || '',
      getProfessionName(t.profession_category_id, t.custom_profession),
      (t.services_used as string[])?.join('; ') || '',
      new Date(t.created_at).toLocaleDateString()
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
    return servicesUsed.map((service: string, idx: number) => (
      <Badge key={idx} variant="outline" className="text-xs">
        {service?.replace('_', ' ') || 'Unknown'}
      </Badge>
    ));
  };

  if (isLoading) {
    return <DashboardTableSkeleton rows={5} columns={6} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load talent pool" message={error} onRetry={loadTalents} />;
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
                {talents.length} talents in the database
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadTalents} disabled={isLoading}>
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
                placeholder="Search by name, email, phone, or profession..."
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
          ) : filteredTalents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No talents found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Profession</TableHead>
                    <TableHead>Services Used</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTalents.map((talent) => (
                    <TableRow key={talent.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{talent.full_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{talent.email}</p>
                          <p className="text-muted-foreground">{talent.phone || 'No phone'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getProfessionName(talent.profession_category_id, talent.custom_profession)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getServiceBadges(talent.services_used as string[]) || (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(talent.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPortfolioDialog(talent)}
                            title="Create Portfolio Request"
                          >
                            <Briefcase className="w-4 h-4" />
                          </Button>
                          {talent.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(formatWhatsAppLink(talent.phone), '_blank')}
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
                                onClick={() => setSelectedTalent(talent)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{talent.full_name}</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4 p-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Email</p>
                                      <p>{talent.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Phone</p>
                                      <p>{talent.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Profession</p>
                                      <p>{getProfessionName(talent.profession_category_id, talent.custom_profession)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">CV</p>
                                      {talent.cv_url ? (
                                        <a 
                                          href={talent.cv_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          View CV
                                        </a>
                                      ) : talent.cv_text ? (
                                        <p className="text-sm truncate max-w-xs">Has CV text</p>
                                      ) : (
                                        <p className="text-muted-foreground">N/A</p>
                                      )}
                                    </div>
                                  </div>

                                  {(talent.services_used as string[])?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Services Used</p>
                                      <div className="flex flex-wrap gap-1">
                                        {(talent.services_used as string[]).map((service: string, idx: number) => (
                                          <Badge key={idx} variant="outline">{service?.replace('_', ' ')}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-4 border-t">
                                    {talent.linkedin_url && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={talent.linkedin_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          LinkedIn
                                        </a>
                                      </Button>
                                    )}
                                    {talent.portfolio_url && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          Portfolio
                                        </a>
                                      </Button>
                                    )}
                                    {talent.cv_url && (
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={talent.cv_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          CV
                                        </a>
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
          <div className="space-y-4">
            {portfolioTalent && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>Name:</strong> {portfolioTalent.full_name}</p>
                <p><strong>Email:</strong> {portfolioTalent.email}</p>
                <p><strong>Phone:</strong> {portfolioTalent.phone || 'N/A'}</p>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={portfolioNotes}
                onChange={(e) => setPortfolioNotes(e.target.value)}
                placeholder="Add any notes for this portfolio request..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePortfolioRequest} disabled={creatingPortfolio}>
              {creatingPortfolio ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
