import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  User, FileText, Briefcase, GraduationCap, Linkedin, 
  ArrowRight, Upload, X 
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface MissingField {
  key: string;
  label: string;
  icon: React.ElementType;
  action: string;
  priority: number;
}

interface ProfileCompletionPromptProps {
  variant?: "card" | "banner" | "inline";
  showDismiss?: boolean;
  className?: string;
}

export function ProfileCompletionPrompt({ 
  variant = "card", 
  showDismiss = true,
  className = ""
}: ProfileCompletionPromptProps) {
  const { talent, isLoading } = useTalent();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || !talent || isDismissed) {
    return null;
  }

  // Calculate missing fields
  const missingFields: MissingField[] = [];

  if (!talent.cvUrl) {
    missingFields.push({
      key: "cv",
      label: "Upload your CV",
      icon: FileText,
      action: "Unlock personalized job recommendations",
      priority: 1,
    });
  }

  if (!talent.linkedinUrl) {
    missingFields.push({
      key: "linkedin",
      label: "Add LinkedIn profile",
      icon: Linkedin,
      action: "Increase visibility to employers",
      priority: 2,
    });
  }

  if (talent.experience.length === 0) {
    missingFields.push({
      key: "experience",
      label: "Add work experience",
      icon: Briefcase,
      action: "Showcase your professional journey",
      priority: 3,
    });
  }

  if (talent.education.length === 0) {
    missingFields.push({
      key: "education",
      label: "Add education",
      icon: GraduationCap,
      action: "Highlight your qualifications",
      priority: 4,
    });
  }

  if (talent.skills.length === 0) {
    missingFields.push({
      key: "skills",
      label: "Add skills",
      icon: User,
      action: "Match with relevant opportunities",
      priority: 5,
    });
  }

  // Calculate completeness
  const totalFields = 8;
  const completedFields = [
    !!talent.fullName,
    !!talent.email,
    !!talent.phone,
    !!talent.cvUrl,
    talent.experience.length > 0,
    talent.education.length > 0,
    talent.skills.length > 0,
    !!talent.linkedinUrl,
  ].filter(Boolean).length;
  
  const completeness = Math.round((completedFields / totalFields) * 100);

  // Don't show if profile is mostly complete
  if (completeness >= 75 || missingFields.length === 0) {
    return null;
  }

  const topMissing = missingFields.slice(0, 2);

  const handleAction = () => {
    navigate("/my-profile");
  };

  if (variant === "banner") {
    return (
      <div className={`bg-primary/5 border border-primary/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{completeness}%</span>
            </div>
            <div>
              <p className="text-sm font-medium">Complete your profile</p>
              <p className="text-xs text-muted-foreground">
                {topMissing[0]?.action || "Unlock personalized recommendations"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAction}>
              Complete Profile
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
            {showDismiss && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsDismissed(true)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg ${className}`}>
        <div className="flex-shrink-0">
          <Progress value={completeness} className="w-16 h-2" />
        </div>
        <p className="text-sm text-muted-foreground flex-1">
          <span className="font-medium text-foreground">{completeness}%</span> profile complete
        </p>
        <Button size="sm" variant="outline" onClick={handleAction}>
          Complete
        </Button>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-transparent ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold mb-1">Complete Your Profile</h3>
            <p className="text-sm text-muted-foreground">
              Stand out to employers and get personalized recommendations
            </p>
          </div>
          {showDismiss && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0 -mt-1 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Profile Completeness</span>
            <span className="font-medium">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>

        <div className="space-y-2 mb-4">
          {topMissing.map((field) => {
            const Icon = field.icon;
            return (
              <div 
                key={field.key}
                className="flex items-center gap-3 p-2 rounded-md bg-background/50"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{field.action}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Button className="w-full" onClick={handleAction}>
          Complete Profile
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
