import { Button } from "@/components/ui/button";
import { MapPin, Dumbbell, Users, Star } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/hero-fitness.jpg')] bg-cover bg-center bg-no-repeat opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20"></div>
      
      <div className="relative container mx-auto px-6 text-center">
        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/20 mb-8">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Los Cabos Fitness Network</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Your Fitness
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent block">
              Passport to Cabo
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Access 50+ premium studios, unlimited classes, and the best fitness community in Los Cabos
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-border">
              <Dumbbell className="h-6 w-6 text-primary" />
              <div className="text-left">
                <div className="font-bold text-lg text-foreground">50+</div>
                <div className="text-sm text-muted-foreground">Studios</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-border">
              <Users className="h-6 w-6 text-primary" />
              <div className="text-left">
                <div className="font-bold text-lg text-foreground">2,000+</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-border">
              <Star className="h-6 w-6 text-primary" />
              <div className="text-left">
                <div className="font-bold text-lg text-foreground">4.9</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 font-semibold rounded-xl border-2 hover:bg-accent/10 transition-all duration-300"
            >
              Explore Classes
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Trusted by fitness enthusiasts and tourists</p>
            <div className="flex justify-center items-center gap-6 opacity-60">
              <div className="text-xs font-medium bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">7-Day Free Trial</div>
              <div className="text-xs font-medium bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">No Commitment</div>
              <div className="text-xs font-medium bg-white/60 dark:bg-gray-800/60 px-3 py-1 rounded-full">Cancel Anytime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>
    </section>
  );
};

export default Hero;