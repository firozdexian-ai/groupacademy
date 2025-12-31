import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  GraduationCap, 
  Briefcase, 
  Globe, 
  Bot,
  Sparkles,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useTalent } from '@/hooks/useTalent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logoLight from '@/assets/logo-horizontal-light.png';
import logoDark from '@/assets/logo-horizontal-dark.png';
import { useTheme } from 'next-themes';
import { CreditBalance } from '@/components/credits/CreditBalance';

const NAV_ITEMS = [
  { path: '/app/feed', label: 'Feed', icon: Home },
  { path: '/app/learning', label: 'Learning', icon: GraduationCap },
  { path: '/app/services', label: 'Services', icon: Sparkles },
  { path: '/app/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/app/abroad', label: 'Abroad', icon: Globe },
  { path: '/app/agents', label: 'AI Agents', icon: Bot },
];

export function TalentAppShell() {
  const { talent, signOut, isLoading } = useTalent();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!talent) {
    navigate('/auth', { state: { from: location.pathname } });
    return null;
  }

  const logoSrc = theme === 'dark' ? logoDark : logoLight;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header - Desktop & Mobile */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/app/feed" className="flex items-center">
            <img src={logoSrc} alt="GroUp Academy" className="h-8" />
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right side - Credits, Profile, Menu */}
          <div className="flex items-center gap-2">
            {/* Credits Display */}
            <div className="hidden sm:block">
              <CreditBalance onClick={() => navigate('/app/profile')} />
            </div>

            {/* Profile */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => navigate('/app/profile')}
            >
              <User className="h-5 w-5" />
            </Button>

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

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="p-4 space-y-2">
              {/* Credits for mobile */}
              <CreditBalance variant="full" className="mb-3" />

              <NavLink
                to="/app/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  )
                }
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </NavLink>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px]',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
