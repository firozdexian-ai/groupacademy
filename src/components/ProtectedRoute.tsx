import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn } from "lucide-react";
import { usePWADetect } from "@/hooks/usePWADetect";
import type { Database } from "@/integrations/supabase/types";
import logoIcon from "@/assets/logo-icon.png";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAnyAdminRole?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireAnyAdminRole = false 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPWA } = usePWADetect();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PWA users get longer timeout since service worker needs to initialize
  const authTimeout = isPWA ? 15000 : 10000;

  const checkAuth = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timed out')), authTimeout)
      );

      const sessionPromise = supabase.auth.getSession();
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>;
        
      if (!session) {
        // For PWA users, redirect to auth with return URL
        const returnUrl = location.pathname + location.search;
        navigate(`/auth?returnTo=${encodeURIComponent(returnUrl)}`, { replace: true });
        return;
      }

      // Check for admin role specifically
      if (requireAdmin) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          toast.error("Admin access required");
          navigate("/my-learning");
          return;
        }
        setUserRole("admin");
      }

      // Check for any admin-level role (admin OR talent_exec)
      if (requireAnyAdminRole) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .in("role", ["admin", "talent_exec"]);

        if (!roleData || roleData.length === 0) {
          toast.error("Dashboard access required");
          navigate("/my-learning");
          return;
        }
        
        // Set the highest role (admin takes precedence)
        const hasAdmin = roleData.some(r => r.role === "admin");
        setUserRole(hasAdmin ? "admin" : "talent_exec");
      }

      setIsAuthorized(true);
    } catch (err) {
      console.error("Auth check error:", err);
      const errorMessage = err instanceof Error && err.message === 'Auth check timed out' 
        ? 'Authorization check timed out' 
        : 'Authentication error';
      setError(errorMessage);
    } finally {
      setIsChecking(false);
    }
  }, [navigate, requireAdmin, requireAnyAdminRole, authTimeout, location]);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth state changes to handle session expiration
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth, navigate]);

  if (isChecking) {
    // Show branded loading for PWA users
    if (isPWA) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <img 
            src={logoIcon} 
            alt="GroUp Academy" 
            className="w-16 h-16 mb-4 animate-pulse"
          />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-muted-foreground text-sm mt-4">Loading...</p>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-muted-foreground text-sm">Please try again or sign in.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={checkAuth} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => navigate("/auth")} size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Export hook for getting user role
export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .in("role", ["admin", "talent_exec"]);

        if (roleData && roleData.length > 0) {
          const hasAdmin = roleData.some(r => r.role === "admin");
          setRole(hasAdmin ? "admin" : "talent_exec");
        }
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, isLoading };
};
