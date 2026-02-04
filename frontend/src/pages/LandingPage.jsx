import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music2, Sparkles, Mic2, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      try {
        await axios.get(`${API}/auth/me`);
        navigate('/generate', { replace: true });
      } catch {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/generate';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-background to-background" />
      
      {/* Animated background elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 md:p-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight font-['Outfit']">LyricLab</span>
          </div>
          
          <Button 
            onClick={handleLogin}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            data-testid="header-login-btn"
          >
            Sign In
          </Button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Songwriting</span>
            </div>

            {/* Main heading */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter font-['Outfit'] leading-[1.1]">
                Where Sound
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Meets Syntax
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Transform your ideas into powerful lyrics. Fine-tune every aspect of your song with intuitive controls and let AI bring your vision to life.
              </p>
            </div>

            {/* CTA Button */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/25 rounded-full px-8 py-6 text-lg font-bold tracking-wide transition-all duration-300 hover:-translate-y-1 group"
                data-testid="get-started-btn"
              >
                Start Writing
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <FeatureCard 
                icon={<Mic2 className="w-6 h-6" />}
                title="Genre Mastery"
                description="From trap pop to country hip-hop, every style at your fingertips"
              />
              <FeatureCard 
                icon={<Sparkles className="w-6 h-6" />}
                title="Creative Control"
                description="Fine-tune rhyme schemes, cadence, imagery, and more"
              />
              <FeatureCard 
                icon={<FileText className="w-6 h-6" />}
                title="Your Library"
                description="Save, edit, and organize all your lyrics in one place"
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 md:p-8 text-center text-sm text-muted-foreground">
          <p>Craft lyrics that resonate. Build your songwriting legacy.</p>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 font-['Outfit']">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default LandingPage;
