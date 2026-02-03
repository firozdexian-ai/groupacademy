import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Mail, Users, ExternalLink } from "lucide-react";
import { IR_CONFIG } from "@/lib/irConfig";
import { InvestorDetailSheet } from "./InvestorDetailSheet";

interface Investor {
  id: string;
  vc_firm_id: string | null;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  investor_interests: string[] | null;
  investment_stage_pref: string | null;
  relationship_summary: string | null;
  last_feedback_summary: string | null;
  subscription_status: string;
  last_contacted_at: string | null;
  notes: string | null;
  created_at: string;
  vc_firm?: { id: string; name: string } | null;
}

export function InvestorsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [filterFirmId, setFilterFirmId] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    vc_firm_id: "",
    full_name: "",
    title: "",
    email: "",
    phone: "",
    linkedin_url: "",
    twitter_handle: "",
    investor_interests: [] as string[],
    investment_stage_pref: "",
    relationship_summary: "",
    subscription_status: "pending",
    notes: "",
  });
  
  // Fetch investors
  const { data: investors, isLoading } = useQuery({
    queryKey: ["ir-investors", filterFirmId],
    queryFn: async () => {
      let query = supabase
        .from("ir_investors")
        .select("*, vc_firm:ir_vc_firms(id, name)")
        .order("created_at", { ascending: false });
      
      if (filterFirmId && filterFirmId !== "all") {
        query = query.eq("vc_firm_id", filterFirmId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Investor[];
    },
  });
  
  // Fetch VC firms for dropdown
  const { data: vcFirms } = useQuery({
    queryKey: ["ir-vc-firms-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_vc_firms")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vc_firm_id: formData.vc_firm_id || null,
        full_name: formData.full_name,
        title: formData.title || null,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
        twitter_handle: formData.twitter_handle || null,
        investor_interests: formData.investor_interests.length > 0 ? formData.investor_interests : null,
        investment_stage_pref: formData.investment_stage_pref || null,
        relationship_summary: formData.relationship_summary || null,
        subscription_status: formData.subscription_status,
        notes: formData.notes || null,
      };
      
      if (editingInvestor) {
        const { error } = await supabase
          .from("ir_investors")
          .update(payload)
          .eq("id", editingInvestor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ir_investors")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingInvestor ? "Investor updated" : "Investor added");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ir_investors")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Investor deleted");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
  
  const resetForm = () => {
    setFormData({
      vc_firm_id: "",
      full_name: "",
      title: "",
      email: "",
      phone: "",
      linkedin_url: "",
      twitter_handle: "",
      investor_interests: [],
      investment_stage_pref: "",
      relationship_summary: "",
      subscription_status: "pending",
      notes: "",
    });
    setEditingInvestor(null);
  };
  
  const openEditDialog = (investor: Investor) => {
    setEditingInvestor(investor);
    setFormData({
      vc_firm_id: investor.vc_firm_id || "",
      full_name: investor.full_name,
      title: investor.title || "",
      email: investor.email || "",
      phone: investor.phone || "",
      linkedin_url: investor.linkedin_url || "",
      twitter_handle: investor.twitter_handle || "",
      investor_interests: investor.investor_interests || [],
      investment_stage_pref: investor.investment_stage_pref || "",
      relationship_summary: investor.relationship_summary || "",
      subscription_status: investor.subscription_status,
      notes: investor.notes || "",
    });
    setDialogOpen(true);
  };
  
  const getStatusBadge = (status: string) => {
    const option = IR_CONFIG.SUBSCRIPTION_STATUS_OPTIONS.find((o) => o.value === status);
    return (
      <Badge variant="secondary" className={option?.color}>
        {option?.label || status}
      </Badge>
    );
  };
  
  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      investor_interests: prev.investor_interests.includes(interest)
        ? prev.investor_interests.filter((i) => i !== interest)
        : [...prev.investor_interests, interest],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investors</h2>
          <p className="text-muted-foreground">
            Manage investor contacts and relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterFirmId} onValueChange={setFilterFirmId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by firm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Firms</SelectItem>
              {vcFirms?.map((firm) => (
                <SelectItem key={firm.id} value={firm.id}>
                  {firm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Investor
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Interests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : investors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No investors added yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                investors?.map((investor) => (
                  <TableRow 
                    key={investor.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInvestorId(investor.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{investor.full_name}</p>
                        {investor.title && (
                          <p className="text-sm text-muted-foreground">{investor.title}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {investor.vc_firm?.name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {investor.email ? (
                        <a 
                          href={`mailto:${investor.email}`}
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {investor.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {investor.investor_interests?.slice(0, 2).map((interest) => (
                          <Badge key={interest} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {(investor.investor_interests?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(investor.investor_interests?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(investor.subscription_status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {investor.email && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            asChild
                          >
                            <a href={`mailto:${investor.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(investor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteConfirmId(investor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Investor Detail Sheet */}
      <InvestorDetailSheet
        investorId={selectedInvestorId}
        open={!!selectedInvestorId}
        onOpenChange={(open) => !open && setSelectedInvestorId(null)}
      />
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvestor ? "Edit Investor" : "Add Investor"}</DialogTitle>
            <DialogDescription>
              {editingInvestor ? "Update investor details" : "Add a new investor contact"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Partner"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firm">VC Firm</Label>
              <Select
                value={formData.vc_firm_id}
                onValueChange={(v) => setFormData({ ...formData, vc_firm_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select firm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No firm</SelectItem>
                  {vcFirms?.map((firm) => (
                    <SelectItem key={firm.id} value={firm.id}>
                      {firm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@firm.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1..."
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  value={formData.twitter_handle}
                  onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                  placeholder="@handle"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2">
                {IR_CONFIG.INTEREST_TAGS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={formData.investor_interests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage Preference</Label>
                <Select
                  value={formData.investment_stage_pref}
                  onValueChange={(v) => setFormData({ ...formData, investment_stage_pref: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {IR_CONFIG.STAGE_FOCUS_OPTIONS.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Subscription Status</Label>
                <Select
                  value={formData.subscription_status}
                  onValueChange={(v) => setFormData({ ...formData, subscription_status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IR_CONFIG.SUBSCRIPTION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="summary">Relationship Summary</Label>
              <Textarea
                id="summary"
                value={formData.relationship_summary}
                onChange={(e) => setFormData({ ...formData, relationship_summary: e.target.value })}
                placeholder="AI-readable summary of the relationship..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={!formData.full_name || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Investor?</DialogTitle>
            <DialogDescription>
              This will also remove all associated interactions and communications. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
