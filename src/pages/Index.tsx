import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Video, Users, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  const contentTypes = [
    {
      icon: Video,
      title: "Free Videos",
      description: "Access our library of educational YouTube content",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: BookOpen,
      title: "Recorded Courses",
      description: "Self-paced foundational courses with lifetime access",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Calendar,
      title: "Live Webinars",
      description: "Interactive online sessions with industry experts",
      color: "from-teal-500 to-green-500",
    },
    {
      icon: Users,
      title: "Batch Classes",
      description: "Structured learning with live instruction and recordings",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: MapPin,
      title: "Offline Seminars",
      description: "In-person workshops and networking events",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
        <div className="container mx-auto px-6 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100">
              Welcome to GroUp Academy
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              Your comprehensive learning platform offering diverse educational formats tailored to your learning style and schedule
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-300">
              <Button size="lg" onClick={() => navigate("/courses")} className="text-lg">
                Browse Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Learning Formats</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from five different content formats designed to fit your learning preferences and schedule
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {contentTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <CardDescription className="text-base">{type.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card/50 backdrop-blur-sm border-y">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Expert Instructors</h3>
              <p className="text-muted-foreground">Learn from industry professionals with years of experience</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Flexible Schedule</h3>
              <p className="text-muted-foreground">Choose between live, recorded, or in-person learning options</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Comprehensive Content</h3>
              <p className="text-muted-foreground">Access to structured courses and free educational materials</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-gradient-primary text-white border-0 shadow-2xl">
          <CardContent className="py-12 px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who have transformed their careers with GroUp Academy
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg">
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">GroUp Academy</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 GroUp Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
