import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Search, Clock, MessageCircle, CheckCircle, XCircle, Loader2, ExternalLink, Copy } from "lucide-react";
import { format } from "date-fns";
import { withTimeout } from "@/hooks/useDataFetch";
import { TIMEOUTS } from "@/lib/timeoutConfig";

interface PortfolioRequest {
  id: string;
  full_name: string;
  email: string;
  status: string;
  portfolio_url: string | null;
  portfolio_credentials: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-600', icon: <Clock className="h-4 w-4" /> },
  contacted: { label: 'Contacted', color: 'bg-blue-500/10 text-blue-600', icon: <MessageCircle className="h-4 w-4" /> },
  in_progress: { label: 'In Progress', color: 'bg-purple-500/10 text-purple-600', icon: <Loader2 className="h-4 w-4" /> },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600', icon: <XCircle className="h-4 w-4" /> },
};

const statusSteps = ['pending', 'contacted', 'in_progress', 'completed'];

export default function PortfolioStatus() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<PortfolioRequest[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    try {
      const { data, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from('portfolio_requests')
            .select('id, full_name, email, status, portfolio_url, portfolio_credentials, created_at, updated_at')
            .eq('email', email.trim().toLowerCase())
            .order('created_at', { ascending: false })
        ),
        TIMEOUTS.DEFAULT,
        "Search timed out. Please try again."
      );

      if (error) throw error;

      setRequests((data || []) as unknown as PortfolioRequest[]);
      if (!data || data.length === 0) {
        toast({ title: "No requests found", description: "No portfolio requests found for this email", variant: "destructive" });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to search";
      setSearchError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const getStepIndex = (status: string) => statusSteps.indexOf(status);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Check Portfolio Status</h1>
            <p className="text-muted-foreground">
              Enter your email to view the status of your portfolio request
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Search</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {requests !== null && requests.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No portfolio requests found for this email.</p>
                <Button variant="link" onClick={() => window.location.href = '/portfolio-request'}>
                  Submit a new request
                </Button>
              </CardContent>
            </Card>
          )}

          {requests && requests.length > 0 && (
            <div className="space-y-6">
              {requests.map((request) => {
                const config = statusConfig[request.status] || statusConfig.pending;
                const currentStepIndex = getStepIndex(request.status);
                
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.full_name}</CardTitle>
                          <CardDescription>
                            Request ID: {request.id.slice(0, 8).toUpperCase()}
                          </CardDescription>
                        </div>
                        <Badge className={config.color}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Progress Timeline */}
                      {request.status !== 'cancelled' && (
                        <div className="relative">
                          <div className="flex justify-between">
                            {statusSteps.map((step, index) => {
                              const stepConfig = statusConfig[step];
                              const isActive = index <= currentStepIndex;
                              const isCurrent = index === currentStepIndex;
                              
                              return (
                                <div key={step} className="flex flex-col items-center flex-1">
                                  <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center z-10
                                    ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                    ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                                  `}>
                                    {stepConfig.icon}
                                  </div>
                                  <span className={`text-xs mt-2 text-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {stepConfig.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Progress Line */}
                          <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-0">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Submitted: {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                        <span>Updated: {format(new Date(request.updated_at), 'MMM d, yyyy')}</span>
                      </div>

                      {/* Completed - Show Portfolio Details */}
                      {request.status === 'completed' && request.portfolio_url && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
                          <h4 className="font-semibold text-primary">🎉 Your Portfolio is Ready!</h4>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Portfolio URL:</span>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={request.portfolio_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  Visit Portfolio <ExternalLink className="h-3 w-3" />
                                </a>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(request.portfolio_url!, 'Portfolio URL')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {request.portfolio_credentials && (
                              <>
                                {request.portfolio_credentials.email && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">CMS Email:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm">{request.portfolio_credentials.email}</span>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(request.portfolio_credentials!.email!, 'Email')}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {request.portfolio_credentials.password && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">CMS Password:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm">{request.portfolio_credentials.password}</span>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(request.portfolio_credentials!.password!, 'Password')}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Info for non-completed */}
                      {request.status !== 'completed' && request.status !== 'cancelled' && (
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Questions? Contact us on WhatsApp:
                          </p>
                          <a 
                            href="https://wa.me/8801708459008"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            +880 1708-459008
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}