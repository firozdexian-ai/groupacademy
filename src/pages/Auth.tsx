import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, signupSchema, resetPasswordSchema } from "@/lib/validations";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signIn, signUp, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const returnTo = searchParams.get('returnTo') || '/app/feed';
      navigate(returnTo);
    }
  }, [user, authLoading, navigate, searchParams]);

  // Update tab based on URL param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup" || tab === "login") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setValidationErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    setIsLoading(true);

    try {
      await withTimeout(
        signIn(loginData.email, loginData.password),
        TIMEOUTS.AUTH,
        "Sign in timed out. Please try again."
      );
      const returnTo = searchParams.get('returnTo') || '/app/feed';
      navigate(returnTo);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    const validation = signupSchema.safeParse(signupData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setValidationErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    setIsLoading(true);

    try {
      const success = await withTimeout(
        signUp(
          signupData.fullName,
          signupData.email,
          signupData.password,
          signupData.phone
        ),
        TIMEOUTS.AUTH,
        "Sign up timed out. Please try again."
      );

      if (success) {
        const returnTo = searchParams.get('returnTo') || '/app/feed';
        navigate(returnTo);
      } else {
        setActiveTab("login");
      }
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Email already registered</p>
            <button
              onClick={() => setActiveTab("login")}
              className="text-xs underline text-left"
            >
              Click here to sign in instead
            </button>
          </div>
        );
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = resetPasswordSchema.safeParse({ email: resetEmail });
    if (!validation.success) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await withTimeout(
        resetPassword(resetEmail),
        TIMEOUTS.AUTH,
        "Password reset request timed out. Please try again."
      );
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">GroUp Academy</h1>
          <p className="text-muted-foreground">Access your learning portal</p>
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
                <CardDescription>Sign in to continue your learning journey</CardDescription>
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
                    {validationErrors.email && (
                      <p className="text-sm text-destructive">{validationErrors.email}</p>
                    )}
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
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-sm text-destructive">{validationErrors.password}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join GroUp Academy to start learning</CardDescription>
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
                    {validationErrors.fullName && (
                      <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                    )}
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
                    {validationErrors.email && (
                      <p className="text-sm text-destructive">{validationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone (Optional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+8801XXXXXXXXX"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    />
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
                    {validationErrors.password && (
                      <p className="text-sm text-destructive">{validationErrors.password}</p>
                    )}
                    {signupData.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1 h-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.strength
                                  ? passwordStrength.color
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password strength: {passwordStrength.label || "Enter password"}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Reset Link"}
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
