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
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl text-white">
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
            YOUR FITNESS
            <span className="block text-accent bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">REVOLUTION</span>
            STARTS HERE
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-white/80 leading-relaxed font-medium max-w-2xl">
            Unlimited access to Cabo's premier fitness studios. One membership, endless possibilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-16">
            <Button variant="accent" size="lg" className="text-lg py-4 px-8 font-bold">
              <Play className="mr-3 h-6 w-6" />
              START YOUR JOURNEY
            </Button>
            <Button variant="glass" size="lg" className="text-lg py-4 px-8 font-semibold">
              EXPLORE CLASSES
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-12 text-white">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="font-bold text-lg tracking-wide">50+ STUDIOS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="font-bold text-lg tracking-wide">500+ CLASSES</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="font-bold text-lg tracking-wide">FROM $500 MXN</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;