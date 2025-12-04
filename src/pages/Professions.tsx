import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GraduationCap, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  Code, 
  Palette, 
  Users,
  ArrowRight,
  Bot,
  BookOpen,
  Target,
  Landmark,
  Laptop,
  Megaphone,
  Truck,
  HeartPulse,
  Calculator,
  LineChart,
  PiggyBank,
  Store,
  ShoppingCart,
  BarChart3,
  Presentation,
  UserCheck,
  UserCog,
  Handshake,
  Package,
  Factory,
  Warehouse,
  ClipboardList,
  Stethoscope,
  Pill,
  Activity,
  Wrench,
  Hammer,
  Lightbulb,
  Monitor,
  Smartphone,
  Globe,
  Cloud,
  Database,
  Shield,
  Lock,
  Cog,
  Settings,
  Pencil,
  PenTool,
  Camera,
  Video,
  Music,
  Mic,
  FileText,
  Book,
  Award,
  Star,
  Heart,
  Home,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Share2,
  Link,
  Zap,
  Rocket,
  Plane,
  Car,
  Ship,
  Coffee,
  Utensils,
  Bed,
  Building,
  Hotel,
  Banknote,
  CreditCard,
  DollarSign,
  Percent,
  Receipt,
  Scale,
  Gavel,
  Layers,
  Grid,
  Layout,
  LayoutDashboard,
  PieChart,
  Network,
  GitBranch,
  Terminal,
  Binary,
  Cpu,
  HardDrive,
  Server,
  Wifi,
  Bluetooth,
  Radio,
  Tv,
  Printer,
  Scan,
  QrCode,
  Fingerprint,
  Eye,
  Ear,
  Brain,
  Dna,
  Microscope,
  TestTube,
  Beaker,
  Atom,
  Leaf,
  TreePine,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  Droplet,
  Flame,
  Snowflake
} from "lucide-react";

interface Academy {
  id: string;
  name: string;
  slug: string;
  academy_type: string;
  description: string;
  primary_language: string;
}

interface School {
  id: string;
  name: string;
  slug: string;
  description: string;
  executive_capability_goal: string;
  academy_id: string;
}

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  target_audience: string;
  career_outcome: string;
  school_id: string;
  ai_instructors: { name: string }[] | { name: string } | null;
}

// Comprehensive icon map for all database icon values
const iconMap: Record<string, React.ElementType> = {
  // Business & Finance
  "briefcase": Briefcase,
  "landmark": Landmark,
  "banknote": Banknote,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  "piggy-bank": PiggyBank,
  "calculator": Calculator,
  "receipt": Receipt,
  "percent": Percent,
  "trending-up": TrendingUp,
  "line-chart": LineChart,
  "bar-chart-3": BarChart3,
  "pie-chart": PieChart,
  "presentation": Presentation,
  
  // Sales & Marketing
  "megaphone": Megaphone,
  "store": Store,
  "shopping-cart": ShoppingCart,
  "handshake": Handshake,
  
  // Operations & Logistics
  "truck": Truck,
  "package": Package,
  "factory": Factory,
  "warehouse": Warehouse,
  "clipboard-list": ClipboardList,
  
  // Healthcare & Pharma
  "heart-pulse": HeartPulse,
  "stethoscope": Stethoscope,
  "pill": Pill,
  "activity": Activity,
  "heart": Heart,
  
  // Technology
  "code": Code,
  "laptop": Laptop,
  "monitor": Monitor,
  "smartphone": Smartphone,
  "globe": Globe,
  "cloud": Cloud,
  "database": Database,
  "server": Server,
  "terminal": Terminal,
  "binary": Binary,
  "cpu": Cpu,
  "hard-drive": HardDrive,
  "network": Network,
  "git-branch": GitBranch,
  "wifi": Wifi,
  
  // HR & People
  "users": Users,
  "user-check": UserCheck,
  "user-cog": UserCog,
  
  // Creative & Design
  "palette": Palette,
  "pencil": Pencil,
  "pen-tool": PenTool,
  "camera": Camera,
  "video": Video,
  "music": Music,
  "mic": Mic,
  
  // Education & Learning
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  "book": Book,
  "file-text": FileText,
  "award": Award,
  
  // Buildings & Places
  "building-2": Building2,
  "building": Building,
  "hotel": Hotel,
  "home": Home,
  "map-pin": MapPin,
  
  // Transportation & Travel
  "plane": Plane,
  "car": Car,
  "ship": Ship,
  
  // Hospitality
  "coffee": Coffee,
  "utensils": Utensils,
  "bed": Bed,
  
  // Security & Legal
  "shield": Shield,
  "lock": Lock,
  "scale": Scale,
  "gavel": Gavel,
  
  // Tools & Engineering
  "wrench": Wrench,
  "hammer": Hammer,
  "cog": Cog,
  "settings": Settings,
  
  // Science & Research
  "microscope": Microscope,
  "test-tube": TestTube,
  "beaker": Beaker,
  "atom": Atom,
  "dna": Dna,
  "brain": Brain,
  
  // Communication
  "phone": Phone,
  "mail": Mail,
  "message-square": MessageSquare,
  "send": Send,
  
  // Miscellaneous
  "star": Star,
  "target": Target,
  "lightbulb": Lightbulb,
  "zap": Zap,
  "rocket": Rocket,
  "layers": Layers,
  "grid": Grid,
  "layout": Layout,
  "layout-dashboard": LayoutDashboard,
  "link": Link,
  "share-2": Share2,
  "bot": Bot,
  "eye": Eye,
  "leaf": Leaf,
  "sun": Sun,
  "flame": Flame,
};

export default function Professions() {
  const navigate = useNavigate();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load academies
      const { data: academiesData } = await supabase
        .from("academies")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      // Load schools
      const { data: schoolsData } = await supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      // Load profession lines with AI instructors
      const { data: professionData } = await supabase
        .from("profession_categories")
        .select(`
          *,
          ai_instructors(name)
        `)
        .eq("is_active", true)
        .not("school_id", "is", null)
        .order("display_order");

      setAcademies(academiesData || []);
      setSchools(schoolsData || []);
      setProfessionLines((professionData as ProfessionLine[]) || []);
      
      if (academiesData && academiesData.length > 0) {
        setSelectedAcademy(academiesData[0].slug);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSchoolsForAcademy = (academyId: string) => {
    return schools.filter((s) => s.academy_id === academyId);
  };

  const getProfessionLinesForSchool = (schoolId: string) => {
    return professionLines.filter((p) => p.school_id === schoolId);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Briefcase;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentAcademy = academies.find((a) => a.slug === selectedAcademy);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4">
              <GraduationCap className="h-3 w-3 mr-1" />
              Career Pathways
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Choose Your Profession
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Explore our structured learning paths designed to transform you into a job-ready professional. 
              Each profession line comes with AI-powered instruction and real Bangladesh market context.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4 text-primary" />
                <span>AI Instructors</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>6-Stage Learning</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-primary" />
                <span>Job-Ready Skills</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academy Tabs */}
      <main className="container mx-auto px-4 py-12">
        <Tabs value={selectedAcademy} onValueChange={setSelectedAcademy}>
          <TabsList className="mb-8">
            {academies.map((academy) => (
              <TabsTrigger key={academy.slug} value={academy.slug} className="gap-2">
                {academy.academy_type === "executive" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}
                {academy.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {academies.map((academy) => (
            <TabsContent key={academy.slug} value={academy.slug}>
              {/* Academy Description */}
              <div className="mb-8 p-6 rounded-lg bg-muted/30 border">
                <h2 className="text-xl font-semibold mb-2">{academy.name}</h2>
                <p className="text-muted-foreground mb-3">{academy.description}</p>
                <Badge variant="secondary">
                  Primary Language: {academy.primary_language === "english" ? "English" : "বাংলা"}
                </Badge>
              </div>

              {/* Schools Grid */}
              <div className="space-y-12">
                {getSchoolsForAcademy(academy.id).map((school) => (
                  <div key={school.id}>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{school.name}</h3>
                      <p className="text-muted-foreground mb-2">{school.description}</p>
                      {school.executive_capability_goal && (
                        <p className="text-sm text-primary">
                          <Target className="h-4 w-4 inline mr-1" />
                          Goal: {school.executive_capability_goal}
                        </p>
                      )}
                    </div>

                    {/* Profession Lines */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {getProfessionLinesForSchool(school.id).map((profession) => {
                        const IconComponent = getIcon(profession.icon);
                        const aiInstructors = profession.ai_instructors;
                        const hasAIInstructor = aiInstructors && (Array.isArray(aiInstructors) ? aiInstructors.length > 0 : true);
                        const instructorName = aiInstructors 
                          ? (Array.isArray(aiInstructors) ? aiInstructors[0]?.name : aiInstructors.name)
                          : null;

                        return (
                          <Card
                            key={profession.id}
                            className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer"
                            onClick={() => navigate(`/professions/${profession.slug}`)}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                  <IconComponent className="h-6 w-6 text-primary" />
                                </div>
                                {hasAIInstructor && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Bot className="h-3 w-3" />
                                    AI Instructor
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="group-hover:text-primary transition-colors">
                                {profession.name}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {profession.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {profession.career_outcome && (
                                <p className="text-sm text-muted-foreground mb-4">
                                  <strong>Career Outcome:</strong> {profession.career_outcome}
                                </p>
                              )}
                              {hasAIInstructor && instructorName && (
                                <p className="text-sm text-primary mb-4">
                                  <Bot className="h-4 w-4 inline mr-1" />
                                  Meet {instructorName}
                                </p>
                              )}
                              <Button variant="ghost" className="w-full group-hover:bg-primary/10">
                                Explore Path
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {getProfessionLinesForSchool(school.id).length === 0 && (
                        <Card className="col-span-full border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">
                              New profession lines coming soon for {school.name}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
