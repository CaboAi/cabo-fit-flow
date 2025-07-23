import { Button } from "@/components/ui/button";
import { Play, MapPin, Users } from "lucide-react";
import heroImage from "@/assets/hero-fitness.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Fitness in Cabo San Lucas" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/60"></div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your Fitness
            <span className="block text-accent-glow">Passport</span>
            to Cabo
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
            Access 50+ studios and unlimited classes across Cabo San Lucas. 
            From beachside yoga to high-intensity training - discover your perfect workout.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button variant="glass" size="lg" className="text-lg">
              <Play className="mr-2 h-5 w-5" />
              Start Your Journey
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              Explore Classes
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-8 text-white/90">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">50+ Studios</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">500+ Classes Weekly</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              <span className="font-medium">From $500 MXN/month</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;