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
import { Eye, EyeOff, Loader2, Target, Mic, DollarSign, FolderOpen, Gift, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneInput } from "@/components/ui/phone-input";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signIn, signUp, resetPassword } = useAuth();
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "login");

  // Form States
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    fullName: "", 
    email: "", 
    password: "", 
    phone: "",
    countryCode: "+880",
    country: "BD"
  });
  const [resetEmail, setResetEmail] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Safe Redirect Logic
  useEffect(() => {
    if (!authLoading && user) {
      const returnTo = searchParams.get("returnTo");
      const safeReturn = returnTo && returnTo !== "/auth" && returnTo !== "/" ? returnTo : "/app/feed";

      navigate(safeReturn, { replace: true });
    }
  }, [user, authLoading, navigate, searchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup" || tab === "login") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(loginData.email, loginData.password);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        const returnTo = searchParams.get("returnTo");
        const safeReturn = returnTo && returnTo !== "/auth" ? returnTo : null;

        if (safeReturn) {
          navigate(safeReturn);
        } else if (roleData && (roleData.role === "admin" || roleData.role === "talent_exec")) {
          navigate("/dashboard");
        } else {
          navigate("/app/feed");
        }
      }
    } catch (error) {
      console.error("Login flow error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!signupData.phone || signupData.phone.length < 7) {
      toast.error("Phone number is required for WhatsApp communication");
      return;
    }

    setIsLoading(true);

    // Combine country code and phone number
    const fullPhone = `${signupData.countryCode}${signupData.phone}`;

    try {
      const success = await signUp(
        signupData.fullName, 
        signupData.email, 
        signupData.password, 
        fullPhone,
        signupData.country,
        signupData.countryCode
      );

      if (success) {
        // Success logic handled by hook/redirect
      } else {
        setActiveTab("login");
      }
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(resetEmail);
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 8) return { strength: 1, label: "Weak", color: "bg-destructive" };

    let strength = 1;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 2, label: "Fair", color: "bg-orange-500" };
    if (strength <= 3) return { strength: 3, label: "Good", color: "bg-yellow-500" };
    return { strength: 4, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(signupData.password);

  const valueProps = [
    { icon: Target, label: "Free Career Assessment", description: "Discover your strengths" },
    { icon: Mic, label: "AI Mock Interviews", description: "Practice with feedback" },
    { icon: DollarSign, label: "Salary Analysis", description: "Know your market value" },
    { icon: FolderOpen, label: "Digital Portfolio", description: "Stand out professionally" },
    { icon: Gift, label: "250 Bonus Credits", description: "On signup" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-muted">
      {/* Left Side - Value Props (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <button onClick={() => navigate("/")} className="mb-8 hover:opacity-90 transition-opacity">
            <img src={logoLight} alt="GroUp Academy" className="h-12" />
          </button>

          <h2 className="text-3xl font-heading font-bold text-white mb-4">Accelerate Your Career Journey</h2>
          <p className="text-white/80 mb-8">
            Join thousands of professionals who have transformed their careers with our AI-powered tools.
          </p>

          <div className="space-y-4">
            {valueProps.map((prop, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <prop.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{prop.label}</h3>
                  <p className="text-sm text-white/70">{prop.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="font-semibold text-white">100% Free to Start</span>
            </div>
            <p className="text-sm text-white/80">
              No credit card required. Get instant access to career assessment and more.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <button onClick={() => navigate("/")} className="inline-block">
              <img src={theme === "dark" ? logoLight : logoDark} alt="GroUp Academy" className="h-10 mx-auto mb-4" />
            </button>
            <p className="text-muted-foreground">Access your career portal</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to continue your career journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-end text-sm">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Start your career journey with 250 bonus credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <PhoneInput
                        value={signupData.phone}
                        countryCode={signupData.countryCode}
                        onValueChange={(phone) => setSignupData({ ...signupData, phone })}
                        onCountryCodeChange={(countryCode, country) => 
                          setSignupData({ ...signupData, countryCode, country })
                        }
                        placeholder="1712345678"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for career updates via WhatsApp
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {signupData.password && (
                        <div className="space-y-1 mt-2">
                          <div className="flex gap-1 h-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`flex-1 rounded-full transition-colors ${
                                  level <= passwordStrength.strength ? passwordStrength.color : "bg-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground text-right">{passwordStrength.label}</p>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
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
