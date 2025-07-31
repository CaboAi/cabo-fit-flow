import { Button } from "@/components/ui/button";
import { Search, User, Menu, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error signing out",
          description: error.message,
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You've been logged out of your account.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again.",
      });
    }
  };

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
          <Button variant="ghost" className="font-semibold">
            <User className="w-4 h-4 mr-2" />
            PROFILE
          </Button>
          <Button 
            variant="outline" 
            className="font-semibold" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            SIGN OUT
          </Button>
        </div>
        
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

export default Header;