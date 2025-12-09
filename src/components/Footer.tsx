import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";

export const Footer = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Tagline */}
          <div className="md:col-span-1">
            <button
              onClick={() => navigate("/")}
              className="flex items-center mb-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src={theme === 'dark' ? logoLight : logoDark} 
                alt="GroUp Academy" 
                className="h-8 w-auto"
              />
            </button>
            <p className="text-sm text-muted-foreground">
              Decode Your Career Potential.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <button
                onClick={() => navigate("/courses")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Courses
              </button>
              <button
                onClick={() => navigate("/professions")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Professions
              </button>
              <button
                onClick={() => navigate("/jobs")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Jobs
              </button>
            </nav>
          </div>

          {/* Career Services */}
          <div>
            <h4 className="font-semibold mb-3">Career Services</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <button
                onClick={() => navigate("/career-assessment")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Career Scorecard
              </button>
              <button
                onClick={() => navigate("/mock-interview")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Mock Interview
              </button>
              <button
                onClick={() => navigate("/salary-analysis")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Salary Analysis
              </button>
              <button
                onClick={() => navigate("/portfolio-request")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Digital Portfolio
              </button>
            </nav>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <button
                onClick={() => navigate("/my-learning")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                My Learning
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Sign In
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GroUp Academy. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="https://www.youtube.com/@groupacademi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};