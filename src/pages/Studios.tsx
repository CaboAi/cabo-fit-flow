import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, Users, Loader2 } from "lucide-react";
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

  // Stock images for studios
  const stockImages = [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506629905058-8b182fb6c5b8?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop&q=80"
  ];

  const getStudioImage = (index: number) => {
    return stockImages[index % stockImages.length];
  };

  const getRandomStats = () => ({
    rating: (4.5 + Math.random() * 0.4).toFixed(1),
    classes: Math.floor(Math.random() * 15) + 8,
    members: Math.floor(Math.random() * 200) + 100
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block bg-cf-gradient text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              CABOFITPASS
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6">
              FITNESS
              <br />
              <span className="text-cf-orange">FREEDOM</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              IN CABO SAN LUCAS
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Discover premium fitness studios across Los Cabos. One membership gives you access to all partner locations.
            </p>
          </div>

          {/* Studios Grid */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gyms.map((gym, index) => {
                const stats = getRandomStats();
                return (
                  <div key={gym.id} className="card-cf card-cf-hover overflow-hidden">
                    {/* Studio Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={getStudioImage(index)} 
                        alt={gym.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = stockImages[0];
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold">{stats.rating}</span>
                      </div>
                    </div>

                    {/* Studio Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-2">{gym.name}</h3>
                      <p className="text-muted-foreground mb-4">Professional fitness studio with expert instructors</p>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{gym.location || "Cabo San Lucas, Mexico"}</span>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between items-center mb-6 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{stats.classes} classes</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{stats.members} members</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button 
                          className="btn-cf-primary flex-1"
                          onClick={() => handleViewClasses(gym.id, gym.name)}
                        >
                          View Classes
                        </Button>
                        <Button variant="outline" className="btn-cf-outline">
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center mt-16 bg-cf-gradient rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Fitness Journey?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of fitness enthusiasts who trust Cabo Fit Pass for unlimited access to premium studios.
            </p>
            <Button className="bg-white text-slate-800 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      <StudioClassModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        gymId={selectedGymId}
        gymName={selectedGymName}
        user={user}
      />
    </div>
  );
};

export default Studios;