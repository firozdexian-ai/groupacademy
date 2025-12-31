import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AUTH_TIMEOUT = 5000; // 5 seconds max for auth checks

export const Navbar = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setIsLoggedIn(true);
          await checkUserRole(session.user.id);
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkAuth = async () => {
    try {
      // Use a timeout for session check
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), AUTH_TIMEOUT)
      );
      
      const result = await Promise.race([sessionPromise, timeoutPromise]);
      
      if (result && 'data' in result && result.data.session?.user) {
        setIsLoggedIn(true);
        await checkUserRole(result.data.session.user.id);
      }
    } catch (err) {
      // Silently fail - navbar should still render
      console.warn("[Navbar] Auth check failed:", err);
    }
  };

  const checkUserRole = async (userId: string) => {
    // Cancel any previous role check
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT);
    
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      
      clearTimeout(timeoutId);
      
      // Only update if this is still the active request
      if (abortControllerRef.current === controller && !controller.signal.aborted) {
        setIsAdmin(!!data);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name !== "AbortError") {
        console.warn("[Navbar] Role check failed:", err);
      }
      // Default to non-admin on failure
      if (abortControllerRef.current === controller) {
        setIsAdmin(false);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate("/");
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src={theme === "dark" ? logoLight : logoDark} 
              alt="GroUp Academy" 
              className="h-10 w-auto"
            />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button variant="ghost" onClick={() => navigate("/professions")}>
              Professions
            </Button>
            <Button variant="ghost" onClick={() => navigate("/courses")}>
              Courses
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Career Services
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => navigate("/career-services")}>
                  Overview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/career-assessment")}>
                  Career Readiness Scorecard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/mock-interview")}>
                  AI Mock Interview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/salary-analysis")}>
                  AI Salary Analysis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/portfolio-request")}>
                  Digital Portfolio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" onClick={() => navigate("/jobs")}>
              Jobs
            </Button>
            {isLoggedIn && (
              <>
                <Button variant="ghost" onClick={() => navigate("/my-learning")}>
                  My Learning
                </Button>
                {isAdmin && (
                  <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                )}
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:flex">
                  <Button variant="outline">Account</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/my-profile")}>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/my-learning")}>
                    My Learning
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/auth")} className="hidden md:flex">
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 flex flex-col gap-2 border-t mt-4">
            <Button variant="ghost" onClick={() => { navigate("/"); setMobileMenuOpen(false); }} className="justify-start">
              Home
            </Button>
            <Button variant="ghost" onClick={() => { navigate("/professions"); setMobileMenuOpen(false); }} className="justify-start">
              Professions
            </Button>
            <Button variant="ghost" onClick={() => { navigate("/courses"); setMobileMenuOpen(false); }} className="justify-start">
              Courses
            </Button>
            <Button variant="ghost" onClick={() => { navigate("/career-services"); setMobileMenuOpen(false); }} className="justify-start">
              Career Services
            </Button>
            <Button variant="ghost" onClick={() => { navigate("/jobs"); setMobileMenuOpen(false); }} className="justify-start">
              Jobs
            </Button>
            {isLoggedIn && (
              <>
                <Button variant="ghost" onClick={() => { navigate("/my-profile"); setMobileMenuOpen(false); }} className="justify-start">
                  My Profile
                </Button>
                <Button variant="ghost" onClick={() => { navigate("/my-learning"); setMobileMenuOpen(false); }} className="justify-start">
                  My Learning
                </Button>
                {isAdmin && (
                  <Button variant="ghost" onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }} className="justify-start">
                    Dashboard
                  </Button>
                )}
                <Button variant="outline" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="justify-start">
                  Sign Out
                </Button>
              </>
            )}
            {!isLoggedIn && (
              <Button onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
                Sign In
              </Button>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Theme</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
