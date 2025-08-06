import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Star } from "lucide-react";

interface ClassCardProps {
  id: string;
  title: string;
  schedule: string;
  price: number;
  capacity: number;
  gym: {
    name: string;
    location: string;
    logo_url: string;
  };
  bookings_count: number;
  onBook?: (classId: string) => void;
}

const ClassCard = ({ 
  id,
  title, 
  schedule, 
  price, 
  capacity, 
  gym, 
  bookings_count,
  onBook
}: ClassCardProps) => {
  const spotsLeft = capacity - bookings_count;
  const classTime = new Date(schedule).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const classDate = new Date(schedule).toLocaleDateString();

  return (
    <Card className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={gym.logo_url || "/placeholder.svg"} 
          alt={gym.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            ${price}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-full px-2 py-1 border border-border">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-accent" />
            <span className="text-xs font-medium text-foreground">{spotsLeft}</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
            ${price}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{gym.name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{classDate} • {classTime}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{spotsLeft} spots left</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">at</p>
            <p className="font-medium text-foreground">{gym.location}</p>
          </div>
          <Button 
            variant="accent" 
            size="sm" 
            className="min-w-20"
            onClick={() => onBook?.(id)}
            disabled={spotsLeft <= 0}
          >
            {spotsLeft <= 0 ? "Full" : "Book"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;