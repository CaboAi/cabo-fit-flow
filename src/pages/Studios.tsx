import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, Loader2 } from "lucide-react";
import { useGyms } from "@/hooks/useClasses";
import StudioClassModal from "@/components/StudioClassModal";

const Studios = ({ user }: { user: any }) => {
  const { data: gyms, isLoading, error } = useGyms();
  const [selectedGymId, setSelectedGymId] = useState<string>("");
  const [selectedGymName, setSelectedGymName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewClasses = (gymId: string, gymName: string) => {
    setSelectedGymId(gymId);
    setSelectedGymName(gymName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGymId("");
    setSelectedGymName("");
  };

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
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading studios...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive">Failed to load studios</p>
            </div>
          ) : !gyms || gyms.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No studios available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {gyms.map((gym) => (
                <Card key={gym.id} className="overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={gym.logo_url || "/lovable-uploads/9ab08d21-9a91-4aad-b6be-474299c842d9.png"} 
                      alt={gym.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <CardHeader className="pb-4">
                    <h3 className="text-xl font-bold text-foreground">{gym.name}</h3>
                    <p className="text-muted-foreground">Professional fitness studio with expert instructors</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{gym.location || "Location TBD"}</span>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="accent" 
                        className="flex-1"
                        onClick={() => handleViewClasses(gym.id, gym.name)}
                      >
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
          )}
        </div>
      </section>

      <StudioClassModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        gymId={selectedGymId}
        gymName={selectedGymName}
      / user={user}>
    </div>
  );
};

export default Studios;