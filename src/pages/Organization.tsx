import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, Users, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const FEATURES = [
  {
    title: 'Post Jobs',
    description: 'Reach qualified candidates across Bangladesh',
    icon: Briefcase
  },
  {
    title: 'Talent Search',
    description: 'Find the perfect candidates from our talent pool',
    icon: Users
  },
  {
    title: 'Analytics',
    description: 'Track applications and hiring metrics',
    icon: BarChart3
  }
];

export default function Organization() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // TODO: Save to waitlist
    setSubmitted(true);
    toast.success('Thanks! We\'ll notify you when organization accounts launch.');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-6">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              For Organizations
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Coming soon! Post jobs, discover talent, and build your team with GroUp Academy's 
              employer tools.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid gap-4 md:grid-cols-3 mb-12">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Waitlist Form */}
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Get Early Access</CardTitle>
              <CardDescription>
                Be the first to know when we launch organization accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-4">
                  <div className="text-accent text-lg font-medium mb-2">You're on the list!</div>
                  <p className="text-sm text-muted-foreground">
                    We'll email you at {email} when organization accounts are ready.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full">
                    Notify Me
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Back to Talents */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Looking for a job instead?</p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Talent Platform
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
