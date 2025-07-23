import { Button } from "@/components/ui/button";
import { Search, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <span className="text-2xl font-black text-foreground tracking-tight">CABO FIT PASS</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-12">
          <a 
            href="/#classes" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('classes')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-muted-foreground hover:text-foreground transition-colors font-semibold tracking-wide"
          >
            CLASSES
          </a>
          <Link to="/studios" className="text-muted-foreground hover:text-foreground transition-colors font-semibold tracking-wide">
            STUDIOS
          </Link>
          <a 
            href="/#plans" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-muted-foreground hover:text-foreground transition-colors font-semibold tracking-wide"
          >
            PRICING
          </a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="font-semibold">SIGN IN</Button>
          <Button variant="accent" className="font-bold">GET STARTED</Button>
        </div>
        
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

export default Header;