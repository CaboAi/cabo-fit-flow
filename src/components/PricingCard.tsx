import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isTourist?: boolean;
}

const PricingCard = ({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  isPopular = false,
  isTourist = false 
}: PricingCardProps) => {
  // Define color schemes for different plan types
  const getColorScheme = () => {
    if (name === "Basic") {
      return {
        badge: "bg-blue-500 text-white",
        ring: "ring-blue-500",
        button: "bg-blue-500 hover:bg-blue-600 text-white",
        accent: "text-blue-500"
      };
    } else if (name === "Premium") {
      return {
        badge: "bg-amber-500 text-white",
        ring: "ring-amber-500", 
        button: "bg-amber-500 hover:bg-amber-600 text-white",
        accent: "text-amber-500"
      };
    } else if (name === "Tourist Pass") {
      return {
        badge: "bg-orange-500 text-white",
        ring: "ring-orange-500",
        button: "bg-orange-500 hover:bg-orange-600 text-white", 
        accent: "text-orange-500"
      };
    } else {
      // Default green for Standard
      return {
        badge: "bg-accent text-accent-foreground",
        ring: "ring-accent",
        button: "bg-accent hover:bg-accent/90 text-accent-foreground",
        accent: "text-accent"
      };
    }
  };

  const colorScheme = getColorScheme();

  return (
    <Card className={`relative transition-all duration-300 hover:shadow-card hover:-translate-y-1 ${
      isPopular ? `ring-2 ${colorScheme.ring} shadow-glow` : ''
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className={`${colorScheme.badge} px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg`}>
            <Star className="h-3 w-3 fill-current" />
            Most Popular
          </div>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <h3 className="text-xl font-bold text-foreground">{name}</h3>
        <div className="mt-2">
          <span className={`text-3xl font-bold ${colorScheme.accent}`}>{price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
        <p className="text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className={`h-4 w-4 ${colorScheme.accent} flex-shrink-0`} />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        <button 
          className={`w-full mt-6 h-11 rounded-md px-8 font-medium transition-colors ${colorScheme.button}`}
        >
          {isTourist ? 'Get Tourist Pass' : 'Start Membership'}
        </button>
        
        {isTourist && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Perfect for visitors to Cabo San Lucas
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingCard;