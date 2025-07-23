import { Button } from "@/components/ui/button";
import { Search, User, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            CaboFit
          </h1>
          <nav className="hidden md:flex space-x-6">
            <a href="#classes" className="text-foreground hover:text-primary transition-colors">
              Classes
            </a>
            <a href="#studios" className="text-foreground hover:text-primary transition-colors">
              Studios
            </a>
            <a href="#plans" className="text-foreground hover:text-primary transition-colors">
              Plans
            </a>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="outline">Log In</Button>
          <Button variant="hero">Sign Up</Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;