import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Target,
  Mic,
  DollarSign,
  FolderOpen,
  Gift,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneInput } from "@/components/ui/phone-input";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import { cn } from "@/lib/utils";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signIn, signUp, resetPassword } = useAuth();
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "login");

  // Form States
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    countryCode: "+880",
    country: "BD",
  });
  const [resetEmail, setResetEmail] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // REDIRECT GUARD: Unified with AuthChat
  useEffect(() => {
    if (!authLoading && user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const returnTo = searchParams.get("returnTo");
          const safeReturn = returnTo && !returnTo.includes("/auth") ? returnTo : "/app/feed";
          navigate(safeReturn, { replace: true });
        }
      });
    }
  }, [user, authLoading, navigate, searchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup" || tab === "login") setActiveTab(tab);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginData.identifier, loginData.password);
      // Redirect logic handled by the useEffect guard above
    } catch (error) {
      console.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password.length < 8) {
      toast.error("Security policy: Minimum 8 characters required.");
      return;
    }

    if (!signupData.phone || signupData.phone.length < 7) {
      toast.error("Contact verification: Phone number required.");
      return;
    }

    setIsLoading(true);
    const fullPhone = `${signupData.countryCode}${signupData.phone}`;

    try {
      // PRE-FLIGHT: Duplicate Identity Check
      const { data: existing, error: checkError } = await supabase
        .from("talents")
        .select("id")
        .eq("phone", fullPhone)
        .maybeSingle();

      if (existing) {
        toast.error("Identity already exists. Redirecting to login...");
        setActiveTab("login");
        setLoginData((prev) => ({ ...prev, identifier: fullPhone }));
        return;
      }

      await signUp(
        signupData.fullName,
        signupData.email,
        signupData.password,
        fullPhone,
        signupData.country,
        signupData.countryCode,
      );
    } catch (error) {
      console.error("Account creation failure");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, label: "", color: "bg-muted" };
    if (password.length < 8) return { level: 1, label: "Insufficient", color: "bg-destructive" };
    let s = 1;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    const maps = [
      { level: 1, label: "Weak", color: "bg-destructive" },
      { level: 2, label: "Fair", color: "bg-orange-500" },
      { level: 3, label: "Secure", color: "bg-secondary" },
      { level: 4, label: "High Entropy", color: "bg-accent" },
    ];
    return maps[s - 1];
  };

  const strength = getPasswordStrength(signupData.password);

  const valueProps = [
    { icon: Target, label: "Career Audit", description: "Gemini-powered skill mapping" },
    { icon: Mic, label: "Mock Interviews", description: "Practice with real-time feedback" },
    { icon: DollarSign, label: "Salary Index", description: "Live market value analysis" },
    { icon: Gift, label: "250 Bonus Credits", description: "Initial onboarding reward" },
  ];

  if (authLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 text-muted-foreground">
          Authenticating Access
        </p>
      </div>
    );

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary/10">
      {/* Left Column - Conversion UI (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="mb-12 hover:scale-105 transition-transform">
            <img src={logoLight} alt="GroUp" className="h-9" />
          </button>
          <h2 className="text-5xl font-black text-white tracking-tighter leading-tight mb-6">
            Evolve Your <br />
            Professional Identity.
          </h2>
          <p className="text-white/70 text-lg font-medium max-w-sm">
            Join the ecosystem where AI mentors and professional opportunities converge.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 relative z-10">
          {valueProps.map((prop, i) => (
            <div key={i} className="space-y-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <prop.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white text-sm">{prop.label}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{prop.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Handshake UI */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {/* Mobile Brand */}
          <div className="text-center lg:hidden space-y-4">
            <button onClick={() => navigate("/")}>
              <img src={theme === "dark" ? logoLight : logoDark} alt="GroUp" className="h-8 mx-auto" />
            </button>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Access Career Terminal
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-2xl border border-border/40">
              <TabsTrigger value="login" className="rounded-xl font-black uppercase text-[10px] tracking-widest">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-black uppercase text-[10px] tracking-widest">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <Card className="rounded-[32px] border-border/40 shadow-2xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-xl font-black tracking-tighter">Welcome Back</CardTitle>
                  <CardDescription className="text-xs font-medium">
                    Continue your professional trajectory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Identity
                      </Label>
                      <Input
                        type="text"
                        placeholder="Email or phone number"
                        value={loginData.identifier}
                        onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                        className="rounded-xl border-border/40 h-11"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Keycode
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                        >
                          Lost Access?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="rounded-xl border-border/40 h-11 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Entry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <Card className="rounded-[32px] border-border/40 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black tracking-tighter">New Node</CardTitle>
                  <CardDescription className="text-xs font-medium">
                    Claim your 250 bonus credits on setup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Full Name
                      </Label>
                      <Input
                        placeholder="John Doe"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className="rounded-xl border-border/40 h-10"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Work Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="you@domain.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="rounded-xl border-border/40 h-10"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Verified Phone
                      </Label>
                      <PhoneInput
                        value={signupData.phone}
                        countryCode={signupData.countryCode}
                        onValueChange={(phone) => setSignupData({ ...signupData, phone })}
                        onCountryCodeChange={(cc, c) => setSignupData({ ...signupData, countryCode: cc, country: c })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Set Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showSignupPassword ? "text" : "password"}
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className="rounded-xl border-border/40 h-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {signupData.password && (
                        <div className="pt-1.5">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "flex-1 rounded-full transition-all duration-500",
                                  i <= strength.level ? strength.color : "bg-muted",
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-[9px] font-black uppercase text-right mt-1 text-muted-foreground/60">
                            Strength: {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-xs mt-2 shadow-lg shadow-primary/20"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Identity"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <button
              onClick={() => navigate(`/auth?${searchParams.toString()}`)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/70 transition-colors"
            >
              Initialize Chat Handshake
            </button>
          </div>
        </div>
      </div>

      {/* Recovery Layer */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="rounded-[32px] border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tighter">Access Recovery</DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest">
              Transmit a secure reset link
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Registered Email
              </Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="rounded-xl border-border/40 h-11"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-xl font-black uppercase text-xs h-11"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transmit Link"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="rounded-xl font-black uppercase text-xs h-11"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
