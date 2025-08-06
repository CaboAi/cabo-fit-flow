import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import AuthForm from "./AuthForm";

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth = ({ onAuthSuccess }: AuthProps) => {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle successful authentication
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            onAuthSuccess(session.user);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        onAuthSuccess(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  const handleToggleMode = () => {
    setAuthMode(prev => prev === "signin" ? "signup" : "signin");
  };

  const handleSuccess = () => {
    // Auth state change will handle the redirect
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </section>
    );
  }

  // If user is already authenticated, don't show auth form
  if (user) {
    return null;
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="bg-card rounded-lg shadow-card p-8 border border-border">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">CaboFitPass</span>
            </div>
          </div>
          
          <AuthForm 
            mode={authMode}
            onToggleMode={handleToggleMode}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </section>
  );
};

export default Auth;