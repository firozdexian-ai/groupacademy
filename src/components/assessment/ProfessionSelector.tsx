import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Briefcase, 
  Code, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Building2,
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
  BookOpen,
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
  Eye,
  Brain,
  Microscope,
  TestTube,
  Beaker,
  Atom,
  Leaf,
  Sun,
  Flame,
  GraduationCap,
  Target,
  Bot
} from "lucide-react";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface ProfessionSelectorProps {
  categories: ProfessionCategory[];
  onSelect: (category: ProfessionCategory) => void;
  onBack: () => void;
}

// Comprehensive icon map for all database icon values
const iconMap: Record<string, React.ComponentType<any>> = {
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
  "palette": Pencil,
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
  "building2": Building2,
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

export function ProfessionSelector({ categories, onSelect, onBack }: ProfessionSelectorProps) {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Select Your Profession</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Choose the category that best matches your career field for tailored assessment questions
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon || "briefcase"] || Briefcase;
          
          return (
            <Card
              key={category.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => onSelect(category)}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {category.description || `Assessment tailored for ${category.name} professionals`}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
