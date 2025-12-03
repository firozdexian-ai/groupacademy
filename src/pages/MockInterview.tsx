import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  MessageSquare, 
  Target, 
  BarChart3, 
  Clock, 
  CheckCircle,
  Sparkles,
  BriefcaseIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MockInterview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              AI-Powered • Text-Based Interview Practice
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Practice Mock Interviews with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Paste your job description, answer AI-generated interview questions, 
              and get detailed feedback with your selection percentage score.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/mock-interview/setup")} 
              className="text-lg px-8 py-6"
            >
              Start Free Mock Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              First interview FREE • Retakes BDT 100
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-6 py-16 border-t">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: BriefcaseIcon,
                title: "Paste Job Description",
                description: "Copy and paste the JD you're preparing for"
              },
              {
                step: "2",
                icon: MessageSquare,
                title: "Answer Questions",
                description: "Respond to AI-generated interview questions"
              },
              {
                step: "3",
                icon: Sparkles,
                title: "Get AI Analysis",
                description: "Receive detailed feedback on each answer"
              },
              {
                step: "4",
                icon: BarChart3,
                title: "See Your Score",
                description: "Get your selection percentage and tips"
              }
            ].map((item, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{item.step}</span>
                </div>
                <CardContent className="pt-8 pb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-6 py-16 border-t">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Job-Specific Questions</h3>
              <p className="text-sm text-muted-foreground">
                AI generates questions tailored to your exact job description
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Selection Percentage</h3>
              <p className="text-sm text-muted-foreground">
                Get a realistic assessment of your interview performance
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Practice Anytime</h3>
              <p className="text-sm text-muted-foreground">
                No scheduling needed - practice at your own pace
              </p>
            </div>
          </div>
        </section>

        {/* What You'll Get Section */}
        <section className="container mx-auto px-6 py-16 border-t">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">What You'll Get</h2>
            <div className="space-y-4">
              {[
                "AI-generated questions based on your job description",
                "Detailed feedback on each of your answers",
                "Selection percentage score (0-100%)",
                "Strengths and improvement areas",
                "Tips specific to your target role",
                "Downloadable PDF report for review",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="container mx-auto px-6 py-16 border-t">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Simple Pricing</h2>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">First Interview</h3>
                    <p className="text-sm text-muted-foreground">Complete AI-powered mock interview</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-1">FREE</Badge>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <h3 className="font-semibold text-lg">Additional Interviews</h3>
                    <p className="text-sm text-muted-foreground">After 7-day cooldown</p>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-1">BDT 100</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-16 border-t">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Ace Your Interview?</h2>
            <p className="text-muted-foreground mb-8">
              Start practicing now and increase your chances of getting hired.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/mock-interview/setup")} 
              className="text-lg px-8 py-6"
            >
              Start Free Mock Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
