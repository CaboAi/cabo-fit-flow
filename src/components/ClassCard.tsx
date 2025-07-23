import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Star } from "lucide-react";

interface ClassCardProps {
  id: string;
  name: string;
  studio: string;
  instructor: string;
  time: string;
  duration: number;
  spots: number;
  maxSpots: number;
  rating: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  type: string;
  image: string;
}

const ClassCard = ({ 
  name, 
  studio, 
  instructor, 
  time, 
  duration, 
  spots, 
  maxSpots, 
  rating, 
  difficulty, 
  type,
  image 
}: ClassCardProps) => {
  const spotsLeft = maxSpots - spots;
  const difficultyColor = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800", 
    Advanced: "bg-red-100 text-red-800"
  };

  return (
    <Card className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={image} 
          alt={name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColor[difficulty]}`}>
            {difficulty}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-full px-2 py-1 border border-border">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs font-medium text-foreground">{rating}</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
            {type}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{studio}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{time} • {duration} min</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{spotsLeft} spots left</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">with</p>
            <p className="font-medium text-foreground">{instructor}</p>
          </div>
          <Button variant="accent" size="sm" className="min-w-20">
            Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;