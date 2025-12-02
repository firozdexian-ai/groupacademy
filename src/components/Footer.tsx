import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">GroUp Academy</span>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/courses")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Courses
            </button>
            <button
              onClick={() => navigate("/my-learning")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              My Learning
            </button>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GroUp Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
