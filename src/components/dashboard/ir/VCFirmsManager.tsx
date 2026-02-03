import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, ExternalLink, Building2 } from "lucide-react";
import { IR_CONFIG } from "@/lib/irConfig";

interface VCFirm {
  id: string;
  name: string;
  logo_url: string | null;
  stage_focus: string[] | null;
  sector_focus: string[] | null;
  website: string | null;
  linkedin_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export function VCFirmsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<VCFirm | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    stage_focus: [] as string[],
    sector_focus: [] as string[],
    website: "",
    linkedin_url: "",
    status: "prospecting",
    notes: "",
  });
  
  // Fetch VC firms
  const { data: firms, isLoading } = useQuery({
    queryKey: ["ir-vc-firms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_vc_firms")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as VCFirm[];
    },
  });
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name,
        logo_url: formData.logo_url || null,
        stage_focus: formData.stage_focus.length > 0 ? formData.stage_focus : null,
        sector_focus: formData.sector_focus.length > 0 ? formData.sector_focus : null,
        website: formData.website || null,
        linkedin_url: formData.linkedin_url || null,
        status: formData.status,
        notes: formData.notes || null,
      };
      
      if (editingFirm) {
        const { error } = await supabase
          .from("ir_vc_firms")
          .update(payload)
          .eq("id", editingFirm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ir_vc_firms")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingFirm ? "VC firm updated" : "VC firm added");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["ir-vc-firms"] });
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ir_vc_firms")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("VC firm deleted");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["ir-vc-firms"] });
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
  
  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      stage_focus: [],
      sector_focus: [],
      website: "",
      linkedin_url: "",
      status: "prospecting",
      notes: "",
    });
    setEditingFirm(null);
  };
  
  const openEditDialog = (firm: VCFirm) => {
    setEditingFirm(firm);
    setFormData({
      name: firm.name,
      logo_url: firm.logo_url || "",
      stage_focus: firm.stage_focus || [],
      sector_focus: firm.sector_focus || [],
      website: firm.website || "",
      linkedin_url: firm.linkedin_url || "",
      status: firm.status,
      notes: firm.notes || "",
    });
    setDialogOpen(true);
  };
  
  const getStatusBadge = (status: string) => {
    const option = IR_CONFIG.VC_STATUS_OPTIONS.find((o) => o.value === status);
    return (
      <Badge variant="secondary" className={option?.color}>
        {option?.label || status}
      </Badge>
    );
  };
  
  const toggleArrayValue = (field: "stage_focus" | "sector_focus", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">VC Firms</h2>
          <p className="text-muted-foreground">
            Manage venture capital firms you're tracking
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add VC Firm
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firm</TableHead>
                <TableHead>Stage Focus</TableHead>
                <TableHead>Sectors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : firms?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No VC firms added yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                firms?.map((firm) => (
                  <TableRow key={firm.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {firm.logo_url ? (
                          <img 
                            src={firm.logo_url} 
                            alt={firm.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{firm.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {firm.stage_focus?.map((stage) => (
                          <Badge key={stage} variant="outline" className="text-xs">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {firm.sector_focus?.slice(0, 2).map((sector) => (
                          <Badge key={sector} variant="outline" className="text-xs">
                            {sector}
                          </Badge>
                        ))}
                        {(firm.sector_focus?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(firm.sector_focus?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(firm.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {firm.website && (
                          <a href={firm.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                        {firm.linkedin_url && (
                          <a href={firm.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(firm)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteConfirmId(firm.id)}
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
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFirm ? "Edit VC Firm" : "Add VC Firm"}</DialogTitle>
            <DialogDescription>
              {editingFirm ? "Update firm details" : "Add a new venture capital firm to track"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Firm Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sequoia Capital"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Stage Focus</Label>
              <div className="flex flex-wrap gap-2">
                {IR_CONFIG.STAGE_FOCUS_OPTIONS.map((stage) => (
                  <Badge
                    key={stage}
                    variant={formData.stage_focus.includes(stage) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue("stage_focus", stage)}
                  >
                    {stage}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Sector Focus</Label>
              <div className="flex flex-wrap gap-2">
                {IR_CONFIG.SECTOR_FOCUS_OPTIONS.map((sector) => (
                  <Badge
                    key={sector}
                    variant={formData.sector_focus.includes(sector) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayValue("sector_focus", sector)}
                  >
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IR_CONFIG.VC_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={!formData.name || saveMutation.isPending}
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
            <DialogTitle>Delete VC Firm?</DialogTitle>
            <DialogDescription>
              This will also remove all associated investors and communications. This action cannot be undone.
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
