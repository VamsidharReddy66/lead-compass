import { Building2, TrendingUp, Users, Shield, Calendar, BarChart3, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Multi-Tenant Architecture',
      description: 'Separate workspaces for independent agents and real estate ventures with complete data isolation.',
    },
    {
      icon: TrendingUp,
      title: 'Smart Lead Pipeline',
      description: 'Visual Kanban board to track leads from first contact to deal closure with drag-and-drop simplicity.',
    },
    {
      icon: Calendar,
      title: 'Never Miss a Follow-up',
      description: 'Automated reminders and calendar integration ensure no lead falls through the cracks.',
    },
    {
      icon: BarChart3,
      title: 'Actionable Analytics',
      description: 'Real-time dashboards showing conversion rates, agent performance, and lead source effectiveness.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Granular permissions for venture admins, agents, and team leads with audit logging.',
    },
    {
      icon: Globe,
      title: 'Lead Capture Forms',
      description: 'Generate shareable forms for each agent or venture to capture leads from anywhere.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Leads Managed' },
    { value: '500+', label: 'Active Agents' },
    { value: '95%', label: 'Follow-up Rate' },
    { value: '3x', label: 'Faster Conversions' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">LeadFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
            <Button variant="accent" onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-hero-gradient opacity-[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8 animate-fade-in">
              <Zap className="w-4 h-4" />
              Built for Real Estate Professionals
            </div>
            
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up">
              Never Lose a Lead.
              <br />
              <span className="text-gradient">Close More Deals.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The intelligent CRM designed for real estate agents and ventures. 
              Track leads, automate follow-ups, and grow your business with powerful insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" onClick={() => navigate('/signup')}>
                Start Free Trial
              </Button>
              <Button variant="outline" size="xl" onClick={() => navigate('/dashboard')}>
                View Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-slide-up"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="font-display text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Leads
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed specifically for real estate professionals to streamline their workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="relative bg-hero-gradient rounded-3xl p-12 md:p-16 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />
            
            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Transform Your Real Estate Business?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Join thousands of successful agents who never miss a follow-up and close deals faster with LeadFlow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" onClick={() => navigate('/signup')}>
                  Start Your Free Trial
                </Button>
                <Button variant="hero-outline" size="lg">
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">LeadFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LeadFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
