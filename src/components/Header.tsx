import { Button } from "@/components/ui/button";
import { User, LogOut, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditBadge } from "./CreditBadge";
import { useEffect, useState } from "react";

const Header = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-cf-gradient backdrop-blur-md border-b border-orange-200/20">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* CF Logo and Brand - NOW CLICKABLE HOME LINK */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
          <div className="cf-logo">
            {/* C and F added via CSS */}
          </div>
          <span className="text-2xl font-black text-white tracking-tight">CABO FIT PASS</span>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-12">
          <a 
            href="/#classes" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('classes')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-white/80 hover:text-white transition-colors font-semibold tracking-wide"
          >
            CLASSES
          </a>
          <Link to="/studios" className="text-white/80 hover:text-white transition-colors font-semibold tracking-wide">
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
            className="text-white/80 hover:text-white transition-colors font-semibold tracking-wide"
          >
            PRICING
          </a>
        </nav>
        
        {/* User Actions - FIXED SIGN OUT BUTTON */}
        <div className="flex items-center gap-4">
          <CreditBadge user={user} />
          <Button variant="ghost" className="font-semibold text-white hover:bg-white/10" asChild>
            <Link to="/profile">
              <User className="w-4 h-4 mr-2" />
              PROFILE
            </Link>
          </Button>
          <Button 
            className="font-semibold bg-slate-800 text-white border-2 border-slate-800 hover:bg-slate-900 hover:border-slate-900" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            SIGN OUT
          </Button>
        </div>
        
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

export default Header;