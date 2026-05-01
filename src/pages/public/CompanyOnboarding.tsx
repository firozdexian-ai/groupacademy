import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Building2, ArrowLeft, Loader2 } from "lucide-react";

const FREE_PROVIDERS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "proton.me", "protonmail.com"];

const schema = z.object({
  company_name: z.string().trim().min(2, "Required").max(120),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  industry: z.string().trim().min(1, "Select an industry").max(80),
  company_size: z.string().trim().min(1, "Select size"),
  country: z.string().trim().min(2, "Required").max(80),
  contact_name: z.string().trim().min(2, "Required").max(120),
  contact_email: z.string().trim().email("Valid email required").max(160),
  contact_phone: z.string().trim().min(7, "Include country code").max(20),
  use_case: z.string().trim().max(1000).optional().or(z.literal("")),
  heard_from: z.string().trim().max(80).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Manufacturing", "Retail", "Consulting", "Media", "Logistics", "Other"];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export default function CompanyOnboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  useEffect(() => { document.title = "Apply for Company Access | Group Academy"; }, []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    company_name: "", website: "", industry: "", company_size: "",
    country: "", contact_name: "", contact_email: "", contact_phone: "",
    use_case: "", heard_from: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      toast({ title: "Please fix errors", variant: "destructive" });
      return;
    }
    const emailDomain = form.contact_email.split("@")[1]?.toLowerCase();
    if (emailDomain && FREE_PROVIDERS.includes(emailDomain)) {
      setErrors({ contact_email: "Please use your work email address" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-company-onboarding", { body: parsed.data });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message || "Try again later", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Request received!</h1>
            <p className="text-muted-foreground mb-6">
              We'll review your application and get back to you within 1 business day. Check your inbox for a confirmation email.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>Back to home</Button>
              <Button onClick={() => navigate("/for-companies")}>Learn more</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/for-companies" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <Link to="/" className="font-semibold">Group Academy</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Apply for company access</h1>
          <p className="text-muted-foreground">Tell us about your company. We'll review and approve within 1 business day.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company details</CardTitle>
            <CardDescription>All fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company name *</Label>
                  <Input id="company_name" value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
                  {errors.company_name && <p className="text-xs text-destructive mt-1">{errors.company_name}</p>}
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="https://" value={form.website} onChange={(e) => update("website", e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                    <SelectTrigger id="industry"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.industry && <p className="text-xs text-destructive mt-1">{errors.industry}</p>}
                </div>
                <div>
                  <Label htmlFor="company_size">Company size *</Label>
                  <Select value={form.company_size} onValueChange={(v) => update("company_size", v)}>
                    <SelectTrigger id="company_size"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SIZES.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.company_size && <p className="text-xs text-destructive mt-1">{errors.company_size}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} />
                {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Primary contact</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Full name *</Label>
                    <Input id="contact_name" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
                    {errors.contact_name && <p className="text-xs text-destructive mt-1">{errors.contact_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Work email *</Label>
                    <Input id="contact_email" type="email" placeholder="you@company.com" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} />
                    {errors.contact_email && <p className="text-xs text-destructive mt-1">{errors.contact_email}</p>}
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="contact_phone">Phone (with country code) *</Label>
                  <Input id="contact_phone" placeholder="+1 555 0123" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
                  {errors.contact_phone && <p className="text-xs text-destructive mt-1">{errors.contact_phone}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="use_case">What are you looking to achieve?</Label>
                <Textarea id="use_case" rows={4} placeholder="e.g., Hire 5 engineers, deploy AI agents for our HR team..." value={form.use_case} onChange={(e) => update("use_case", e.target.value)} />
              </div>

              <div>
                <Label htmlFor="heard_from">How did you hear about us?</Label>
                <Input id="heard_from" value={form.heard_from} onChange={(e) => update("heard_from", e.target.value)} />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit application"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to be contacted about your application.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
