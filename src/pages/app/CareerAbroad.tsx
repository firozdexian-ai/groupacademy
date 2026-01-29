import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Briefcase, ChevronRight, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";

// Popular destinations filtered from centralized constants
const POPULAR_DESTINATIONS = COUNTRIES.filter(c => 
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL"].includes(c.code)
);

const ABROAD_SECTIONS = [
  {
    title: "Study Abroad",
    description: "Find universities & scholarships",
    icon: GraduationCap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    href: "/app/abroad/study",
  },
  {
    title: "IELTS Prep",
    description: "Mock tests & AI practice",
    icon: BookOpen,
    color: "text-accent-foreground",
    bgColor: "bg-accent/10",
    href: "/app/abroad/ielts",
  },
  {
    title: "Jobs Abroad",
    description: "International work visas",
    icon: Briefcase,
    color: "text-warning",
    bgColor: "bg-warning/10",
    href: "/app/jobs?location=abroad",
  },
];

export default function CareerAbroad() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-background rounded-xl shadow-sm">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Career Abroad</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Your gateway to international opportunities. Explore universities, prepare for language tests, and find jobs
          overseas.
        </p>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ABROAD_SECTIONS.map((section) => (
          <Card
            key={section.title}
            className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm press-scale hover:bg-muted/50"
            onClick={() => navigate(section.href)}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${section.bgColor} flex items-center justify-center flex-shrink-0`}>
                <section.icon className={`h-6 w-6 ${section.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{section.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Countries Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Popular Destinations</h2>
          <Badge variant="outline" className="text-xs">
            {POPULAR_DESTINATIONS.length} Countries
          </Badge>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {POPULAR_DESTINATIONS.map((country) => (
            <Card
              key={country.code}
              className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm press-scale hover:bg-muted/50"
              onClick={() => navigate(`/app/abroad/study?country=${country.code}`)}
            >
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <span className="text-3xl">{getCountryFlag(country.code)}</span>
                <span className="font-medium text-xs truncate w-full text-center">{country.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* IELTS CTA - Wide Card */}
      <Card
        className="bg-gradient-to-r from-primary/5 to-secondary/5 border-0 shadow-sm cursor-pointer hover:shadow-md transition-all press-scale group"
        onClick={() => navigate("/app/abroad/ielts")}
      >
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="p-4 bg-background/80 backdrop-blur rounded-2xl shadow-sm">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">Start IELTS Preparation</h3>
            <p className="text-sm text-muted-foreground mb-4 md:mb-0 max-w-md">
              Take AI-powered mock tests, get instant band score predictions, and improve your speaking and writing
              skills.
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[140px]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg">
              <Badge variant="secondary" className="h-1.5 w-1.5 rounded-full p-0" />
              AI Mock Tests
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg">
              <Badge variant="secondary" className="h-1.5 w-1.5 rounded-full p-0" />
              Band Predictor
            </div>
          </div>

          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <ChevronRight className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
