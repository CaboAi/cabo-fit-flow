import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Star } from "lucide-react";
import { useState } from "react";
import BookingModal from "./BookingModal";
import { ClassCreditCost } from "./ClassCreditCost";
import { EnhancedBookingButton } from "./EnhancedBookingButton";
import { supabase } from "@/integrations/supabase/client";

interface ClassCardProps {
  id: string;
  title: string;
  schedule: string;
  price: number;
  capacity: number;
  gym_id: string;
  gym: {
    id: string;
    name: string;
    location: string;
    logo_url: string;
  };
  bookings_count: number;
  onBook?: (classId: string) => void;
  onBookingSuccess?: () => void;
  user?: any;
}

const ClassCard = ({ 
  id,
  title, 
  schedule, 
  price, 
  capacity, 
  gym_id,
  gym, 
  bookings_count,
  onBook,
  onBookingSuccess,
  user
}: ClassCardProps) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const spotsLeft = capacity - bookings_count;
  const classTime = new Date(schedule).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const classDate = new Date(schedule).toLocaleDateString();

  const classData = {
    id,
    title,
    schedule,
    price,
    capacity,
    gym_id,
    gym,
    bookings_count
  };

  const handleBookClick = () => {
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    onBookingSuccess?.();
    onBook?.(id);
  };

  return (
    <Card className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={gym.logo_url || "/placeholder.svg"} 
          alt={gym.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <ClassCreditCost classId={id} className="bg-white/95 backdrop-blur-sm rounded-full px-2 py-1" />
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
          <ClassCreditCost classId={id} />
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
          <EnhancedBookingButton 
            classId={id} 
            user={user}
            className="min-w-20 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm"
            disabled={spotsLeft <= 0}
            onBookingSuccess={(result) => {
              console.log('Class booked successfully!', result);
              // Show success message with credit details
              alert(`Successfully booked! ${result.credits_used || 1} credits used. Remaining balance: ${result.remaining_balance || 'N/A'}`);
              handleBookingSuccess();
              window.location.reload();
            }}
            onBookingError={(error) => {
              console.log('Booking error:', error);
              if (error !== 'Please sign in to book classes') {
                alert('Booking failed: ' + error);
              }
            }}
          >
            {spotsLeft <= 0 ? "Full" : "Book Class"}
          </EnhancedBookingButton>
        </div>
      </CardContent>

      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        classData={classData}
        onBookingSuccess={handleBookingSuccess}
      />
    </Card>
  );
};

export default ClassCard;