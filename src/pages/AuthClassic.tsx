import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { resolvePostAuthRoute } from "@/lib/postAuthRoute";
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
  const { accountType, isLoading: accountTypeLoading } = useAccountType();
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

  // REDIRECT GUARD — wait until we know account type to route correctly
  useEffect(() => {
    if (authLoading || !user || accountTypeLoading) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const dest = resolvePostAuthRoute(accountType, searchParams.get("returnTo"));
        navigate(dest, { replace: true });
      }
    });
  }, [user, authLoading, accountType, accountTypeLoading, navigate, searchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup" || tab === "login") setActiveTab(tab);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginData.identifier, loginData.password);
    } catch (error) {
      console.error("Login Handshake Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    const fullPhone = `${signupData.countryCode}${signupData.phone}`;

    try {
      const { data: existing } = await supabase.from("talents").select("id").eq("phone", fullPhone).maybeSingle();
      if (existing) {
        toast.error("Account already exists. Switching to sign in.");
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
      console.error("Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsLoading(true);
    try {
      await resetPassword(resetEmail);
      setShowForgotPassword(false);
      setResetEmail("");
      toast.success("Reset link sent. Check your inbox.");
    } catch (error) {
      console.error("Reset request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, label: "", color: "bg-muted" };
    if (password.length < 8) return { level: 1, label: "Too short", color: "bg-destructive" };
    let s = 1;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    const maps = [
      { level: 1, label: "Weak", color: "bg-destructive" },
      { level: 2, label: "Fair", color: "bg-orange-500" },
      { level: 3, label: "Good", color: "bg-secondary" },
      { level: 4, label: "Strong", color: "bg-accent" },
    ];
    return maps[s - 1];
  };

  const strength = getPasswordStrength(signupData.password);

  const valueProps = [
    { icon: Target, label: "Career audit", description: "AI-powered skill mapping" },
    { icon: Mic, label: "Mock interviews", description: "Practice with real-time feedback" },
    { icon: DollarSign, label: "Salary index", description: "Live market value analysis" },
    { icon: Gift, label: "250 bonus credits", description: "Welcome reward for new members" },
  ];

  if (authLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary/10">
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10">
          <button onClick={() => navigate("/")} className="mb-12 hover:scale-105 transition-transform">
            <img src={logoLight} alt="GroUp" className="h-9" />
          </button>
          <h2 className="text-5xl font-black text-white tracking-tighter leading-tight mb-6">
            Grow your <br />
            career with AI.
          </h2>
          <p className="text-white/70 text-lg font-medium max-w-sm">
            Join the platform where AI mentors and real career opportunities meet.
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

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="text-center lg:hidden space-y-4">
            <button onClick={() => navigate("/")}>
              <img src={theme === "dark" ? logoLight : logoDark} alt="GroUp" className="h-8 mx-auto" />
            </button>
            <p className="text-xs font-medium text-muted-foreground">
              Welcome back
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-2xl border border-border/40">
              <TabsTrigger value="login" className="rounded-xl font-semibold text-sm">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-semibold text-sm">
                Sign up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <Card className="rounded-[32px] border-border/40 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Welcome back</CardTitle>
                  <CardDescription className="text-sm">Sign in to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">
                        Email or phone
                      </Label>
                      <Input
                        type="text"
                        placeholder="you@example.com or +1234567890"
                        value={loginData.identifier}
                        onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                        className="rounded-xl border-border/40 h-11"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-1">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Forgot password?
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
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl font-semibold text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <Card className="rounded-[32px] border-border/40 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold tracking-tight">Create your account</CardTitle>
                  <CardDescription className="text-sm">Get 250 bonus credits to start</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">
                        Full name
                      </Label>
                      <Input
                        placeholder="Jane Doe"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className="rounded-xl border-border/40 h-10"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="rounded-xl border-border/40 h-10"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">
                        Phone number
                      </Label>
                      <PhoneInput
                        value={signupData.phone}
                        countryCode={signupData.countryCode}
                        onValueChange={(phone) => setSignupData({ ...signupData, phone })}
                        onCountryCodeChange={(cc, c) => setSignupData({ ...signupData, countryCode: cc, country: c })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">
                        Password
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
                          aria-label={showSignupPassword ? "Hide password" : "Show password"}
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
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl font-semibold text-sm mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <button
              onClick={() => navigate(`/auth?${searchParams.toString()}`)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Try the chat experience instead
            </button>
          </div>
          </div>

          <div className="text-center pt-2 border-t border-border/40">
            <button
              onClick={() => navigate("/for-companies")}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Hiring? Apply for company access →
            </button>
          </div>
        </div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="rounded-[32px] border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Reset password</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground ml-1">
                Email address
              </Label>
              <Input
                type="email"
                placeholder="you@example.com"
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
                className="flex-1 rounded-xl font-semibold text-sm h-11"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
