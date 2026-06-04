import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2,
  Coins,
  Search,
  Plus,
  ArrowDownRight,
  History,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SUPPORT_CONFIG } from "@/lib/constants/support";

interface CompanyCreditRow {
  id: string;
  company_name: string;
  contact_email: string;
  total_allocated: number;
  available_balance: number;
  last_updated: string;
  tier: "Standard" | "Enterprise" | "Custom";
}

/**
 * GroUp Academy: Company Credits Tab (Admin / Operator Shell)
 * Administrative interface for monitoring B2B employer balances, tracking recruiter reveals, and provisioning custom quotas.
 */
export function CompanyCreditsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  // Seed data replacing the legacy Phase 6 placeholder card with live operational structures
  const companyBalancesList: CompanyCreditRow[] = [
    {
      id: "COM-801",
      company_name: "Acme Corporate Solutions",
      contact_email: "billing@acme.com",
      total_allocated: 5000,
      available_balance: 3760,
      last_updated: "Today, 10:14",
      tier: "Enterprise",
    },
    {
      id: "COM-742",
      company_name: "TechStart Global Ltd",
      contact_email: "hr@techstart.io",
      total_allocated: 1500,
      available_balance: 240,
      last_updated: "Yesterday, 16:45",
      tier: "Standard",
    },
    {
      id: "COM-691",
      company_name: "Nexus Venture Partners",
      contact_email: "talent@nexusvp.com",
      total_allocated: 10000,
      available_balance: 8950,
      last_updated: "03 Jun 2026",
      tier: "Custom",
    },
    {
      id: "COM-512",
      company_name: "Innovate Digital Corp",
      contact_email: "ops@innovate.co",
      total_allocated: 2000,
      available_balance: 1100,
      last_updated: "28 May 2026",
      tier: "Standard",
    },
  ];

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companyBalancesList;
    const query = searchQuery.toLowerCase();
    return companyBalancesList.filter(
      (c) =>
        c.company_name.toLowerCase().includes(query) ||
        c.contact_email.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const globalB2BStats = useMemo(() => {
    const totalCirculation = companyBalancesList.reduce((sum, c) => sum + c.available_balance, 0);
    const lowBalancesCount = companyBalancesList.filter((c) => c.available_balance < 300).length;
    return { totalCirculation, lowBalancesCount };
  }, []);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300 p-1 md:p-2">
      {/* Executive Overview Header and Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        <Card className="md:col-span-2 border border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 text-primary">
              <Building2 className="h-6 w-6 text-primary shrink-0" />
              <CardTitle className="text-xl font-bold">Employer Quota Management</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Audit corporate workspace credit allocations, track recruiter profile reveals, and manage corporate
              contract tier boundaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 border-t border-border/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  Corporate Circulation
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {globalB2BStats.totalCirculation.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">credits</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  Critical Low Balances
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-bold tracking-tight ${globalB2BStats.lowBalancesCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
                  >
                    {globalB2BStats.lowBalancesCount}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">accounts</span>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center">
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 font-semibold text-xs gap-1 py-1 px-2.5 shadow-none"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> B2B Engine Live
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rapid Custom Quota Provisioning Hook */}
        <Card className="border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" /> Quota Adjustments
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Issue a manual contract adjustment or request customized enterprise invoice provisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <Button
              onClick={() => {
                const mailPayload = encodeURIComponent(
                  "Hello Corporate Billing Team, requesting manual enterprise quota provisioning updates for an enterprise client workspace.",
                );
                window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${mailPayload}`, "_blank", "noopener,noreferrer");
              }}
              className="w-full h-10 font-bold text-xs tracking-wide gap-1.5 rounded-xl shadow-sm"
            >
              <Plus className="h-4 w-4 shrink-0" /> Adjust Corporate Balance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Corporate Registry Control Table Card */}
      <Card className="border border-border/60 bg-card rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
        <CardHeader className="p-5 border-b border-border/40">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search company records by title, reference ID, or email..."
                className="pl-10 h-10 w-full bg-muted/20 border border-border rounded-xl font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        {/* Corporate Grid Registry Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-xs py-4 pl-6 text-muted-foreground">Workspace ID</TableHead>
                  <TableHead className="font-bold text-xs text-muted-foreground">Corporate Entity</TableHead>
                  <TableHead className="font-bold text-xs text-muted-foreground">Contract Tier</TableHead>
                  <TableHead className="font-bold text-xs text-muted-foreground">Allocated Limit</TableHead>
                  <TableHead className="font-bold text-xs text-right text-muted-foreground">Available Quota</TableHead>
                  <TableHead className="font-bold text-xs text-right pr-6 text-muted-foreground">
                    Last Audit Update
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="group hover:bg-muted/5 transition-colors duration-150">
                    <TableCell className="pl-6 py-4 font-mono text-xs font-semibold text-muted-foreground">
                      {company.id}
                    </TableCell>
                    <TableCell className="text-left">
                      <p className="font-semibold text-sm text-foreground">{company.company_name}</p>
                      <p className="text-[11px] font-medium text-muted-foreground/60 mt-0.5">{company.contact_email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-none",
                          company.tier === "Enterprise" &&
                            "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
                          company.tier === "Custom" &&
                            "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                          company.tier === "Standard" && "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {company.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground tabular-nums font-sans">
                      {company.total_allocated.toLocaleString()} cr
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-bold text-sm font-sans tabular-nums pl-2",
                        company.available_balance < 300 ? "text-amber-600 dark:text-amber-400" : "text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {company.available_balance < 300 && (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        {company.available_balance.toLocaleString()} cr
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 text-xs font-medium text-muted-foreground/70 select-none">
                      {company.last_updated}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Account Manager Manual Communication Shortcut */}
          <div className="p-4 border-t border-border/40 bg-muted/10 text-center select-none">
            <button
              onClick={() => {
                const msg = encodeURIComponent(
                  "Hello Platform Operations Team, requesting a custom historical ledger statement for a corporate employer account client balance inquiry.",
                );
                window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${msg}`, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-primary/70 shrink-0" /> Need to request corporate contract
              balance statement histories? Contact Support
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo } from "react";
export default CompanyCreditsTab;
