import Header from "@/components/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, Users, Wifi, Car, Coffee } from "lucide-react";

const Studios = () => {
  const studios = [
    {
      id: "1",
      name: "Ocean Breeze Studio",
      description: "Beachfront yoga and meditation classes with ocean views",
      address: "Playa El Médano, Cabo San Lucas",
      rating: 4.9,
      reviews: 234,
      image: "/lovable-uploads/9ab08d21-9a91-4aad-b6be-474299c842d9.png",
      amenities: ["Ocean View", "Parking", "WiFi", "Showers"],
      hours: "6:00 AM - 9:00 PM",
      classes: ["Yoga", "Meditation", "Pilates"]
    },
    {
      id: "2", 
      name: "Cabo Fitness Club",
      description: "High-intensity training and strength classes in downtown Cabo",
      address: "Centro, Cabo San Lucas",
      rating: 4.8,
      reviews: 189,
      image: "/lovable-uploads/9ab08d21-9a91-4aad-b6be-474299c842d9.png",
      amenities: ["AC", "Parking", "Showers", "Lockers"],
      hours: "5:00 AM - 11:00 PM",
      classes: ["HIIT", "CrossFit", "Strength Training"]
    },
    {
      id: "3",
      name: "Ride Cabo",
      description: "Premium indoor cycling studio with energizing music",
      address: "Marina District, Cabo San Lucas", 
      rating: 4.7,
      reviews: 156,
      image: "/lovable-uploads/9ab08d21-9a91-4aad-b6be-474299c842d9.png",
      amenities: ["Premium Bikes", "Sound System", "AC", "Water"],
      hours: "6:00 AM - 8:00 PM",
      classes: ["Cycling", "Spin", "HIIT Bike"]
    },
    {
      id: "4",
      name: "Balance Studio",
      description: "Mindful movement and core strengthening in a serene environment",
      address: "San José del Cabo",
      rating: 4.9,
      reviews: 98,
      image: "/lovable-uploads/9ab08d21-9a91-4aad-b6be-474299c842d9.png",
      amenities: ["Garden View", "Props Included", "WiFi", "Tea Bar"],
      hours: "7:00 AM - 7:00 PM", 
      classes: ["Pilates", "Barre", "Yoga"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Partner Studios
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover premium fitness studios across Cabo San Lucas. Each location offers unique classes and amenities for your perfect workout experience.
            </p>
          </div>
        </div>
      </section>

      {/* Studios Grid */}
      <section className="pb-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {studios.map((studio) => (
              <Card key={studio.id} className="overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={studio.image} 
                    alt={studio.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-full px-2 py-1 border border-border">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span className="text-xs font-medium text-foreground">{studio.rating}</span>
                      <span className="text-xs text-muted-foreground">({studio.reviews})</span>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <h3 className="text-xl font-bold text-foreground">{studio.name}</h3>
                  <p className="text-muted-foreground">{studio.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{studio.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{studio.hours}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {studio.classes.map((classType, index) => (
                      <span key={index} className="bg-accent/10 text-accent px-2 py-1 rounded-md text-xs font-medium">
                        {classType}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {studio.amenities.slice(0, 4).map((amenity, index) => (
                      <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="accent" className="flex-1">
                      View Classes
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Get Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Studios;