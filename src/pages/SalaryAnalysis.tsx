import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TrendingUp, Target, Lightbulb, FileText, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

// Brand icon
import iconSalary from "@/assets/icons/icon-salary.png";

const SalaryAnalysis = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Market Salary Range",
      description: "Get accurate salary benchmarks for your role in the global market"
    },
    {
      icon: Target,
      title: "Skills Gap Analysis",
      description: "Identify missing skills and get recommendations to boost your market value"
    },
    {
      icon: Lightbulb,
      title: "Negotiation Tips",
      description: "Personalized strategies to negotiate your best offer"
    },
    {
      icon: FileText,
      title: "Action Plan",
      description: "Clear steps to improve your career positioning"
    }
  ];

  const benefits = [
    "AI-powered analysis of your CV against job requirements",
    "Salary ranges specific to your target job market",
    "Personalized negotiation strategies",
    "Skills gap identification with recommendations",
    "Market demand insights for your profession",
    "Downloadable PDF report"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 via-secondary/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="icon-container-lg mx-auto mb-6">
              <img src={iconSalary} alt="Salary Analysis" className="w-11 h-11 object-contain" />
            </div>
            <Badge className="mb-4 gap-2 border-primary/30 text-primary" variant="outline">
              <Sparkles className="w-3 h-3" />
              First Analysis Free • Retakes 50 Credits
            </Badge>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              AI Salary Analysis
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Know your worth. Upload your CV and job description to get personalized salary insights, 
              skills gap analysis, and negotiation tips for your target market.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link to="/salary-analysis/setup">
                Start Free Analysis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              First analysis FREE • Retakes 50 Credits
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll Get</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Use AI Salary Analysis?</h2>
              <p className="text-muted-foreground mb-6">
                Going into salary negotiations unprepared can cost you thousands. Our AI analyzes 
                your profile against market data to give you the confidence to negotiate effectively.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-2xl">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium">Upload Your CV</p>
                    <p className="text-sm text-muted-foreground">PDF upload or paste your CV text</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium">Add Job Description</p>
                    <p className="text-sm text-muted-foreground">Paste the JD you're targeting</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium">Get AI Analysis</p>
                    <p className="text-sm text-muted-foreground">Receive detailed salary insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Know Your Worth?</h2>
          <p className="text-muted-foreground mb-8">
            Your first analysis is completely free. Get started now and negotiate with confidence.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/salary-analysis/setup">
              Start Free Analysis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SalaryAnalysis;
