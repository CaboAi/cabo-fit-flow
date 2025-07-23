import { Button } from "@/components/ui/button";
import { Play, MapPin, Users } from "lucide-react";
import heroImage from "@/assets/hero-fitness.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-hero">
      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
            Welcome to
            <span className="block text-white">CaboFit</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-white/90 leading-relaxed font-medium max-w-2xl mx-auto">
            Your fitness passport to Cabo San Lucas. Discover, book, and enjoy unlimited access to the best studios.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button variant="accent" size="lg" className="text-lg py-4 px-8 font-semibold">
              <Play className="mr-3 h-6 w-6" />
              GET STARTED
            </Button>
            <Button variant="outline" size="lg" className="text-lg py-4 px-8 font-semibold border-white/20 text-white hover:bg-white/10">
              BROWSE CLASSES
            </Button>
          </div>
          
          {/* Simple Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-white/90">
            <span className="font-medium">50+ Studios</span>
            <span className="font-medium">•</span>
            <span className="font-medium">500+ Classes</span>
            <span className="font-medium">•</span>
            <span className="font-medium">From $500 MXN</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;