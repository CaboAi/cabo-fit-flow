import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Users, CreditCard, Star, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClassWithGym } from "@/hooks/useClasses";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassWithGym | null;
  onBookingSuccess?: () => void;
}

interface UserProfile {
  id: string;
  monthly_credits: number;
  subscription_status: string;
}

const BookingModal = ({ isOpen, onClose, classData, onBookingSuccess }: BookingModalProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedBookingType, setSelectedBookingType] = useState<'drop-in' | 'monthly' | 'one-time'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, monthly_credits, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!classData || !userProfile) return;

    try {
      setIsBooking(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user has enough credits for monthly booking
      if (selectedBookingType === 'monthly' && userProfile.monthly_credits <= 0) {
        toast({
          title: "Insufficient Credits",
          description: "You don't have enough monthly credits. Consider a drop-in booking.",
          variant: "destructive",
        });
        return;
      }

      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          class_id: classData.id,
          type: selectedBookingType,
          payment_status: selectedBookingType === 'monthly' ? 'completed' : 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update user credits if monthly booking
      if (selectedBookingType === 'monthly') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ monthly_credits: userProfile.monthly_credits - 1 })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Booking Confirmed!",
        description: `Your ${selectedBookingType} booking has been confirmed.`,
      });

      onBookingSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book class",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const getBookingPrice = () => {
    if (!classData) return 0;
    switch (selectedBookingType) {
      case 'monthly':
        return 0; // Uses credits
      case 'drop-in':
        return classData.price;
      case 'one-time':
        return classData.price * 0.9; // 10% discount for one-time
      default:
        return classData.price;
    }
  };

  const spotsLeft = classData ? classData.capacity - classData.bookings_count : 0;
  const classTime = classData ? new Date(classData.schedule).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';
  const classDate = classData ? new Date(classData.schedule).toLocaleDateString() : '';

  if (!classData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Book Your Class</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{classData.title}</h3>
                <p className="text-muted-foreground">{classData.gym.name}</p>
              </div>
              <Badge variant="secondary" className="ml-2">
                {spotsLeft} spots left
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{classDate}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{classTime}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{classData.gym.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classData.capacity} capacity</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Credits Info */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : userProfile && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Monthly Credits</span>
                <Badge variant={userProfile.monthly_credits > 0 ? "default" : "destructive"}>
                  {userProfile.monthly_credits} remaining
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Subscription: {userProfile.subscription_status}
              </p>
            </div>
          )}

          {/* Booking Type Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Choose Booking Type</h4>
            
            <div className="space-y-2">
              {/* Monthly Credit Booking */}
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedBookingType === 'monthly' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-accent'
                }`}
                onClick={() => setSelectedBookingType('monthly')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        selectedBookingType === 'monthly' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <span className="font-medium">Use Monthly Credit</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-5">
                      {userProfile?.monthly_credits && userProfile.monthly_credits > 0 
                        ? 'Included in your subscription' 
                        : 'No credits available'}
                    </p>
                  </div>
                  <span className="font-semibold text-primary">FREE</span>
                </div>
              </div>

              {/* Drop-in Booking */}
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedBookingType === 'drop-in' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-accent'
                }`}
                onClick={() => setSelectedBookingType('drop-in')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        selectedBookingType === 'drop-in' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <span className="font-medium">Drop-in Rate</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-5">Pay per class</p>
                  </div>
                  <span className="font-semibold">${classData.price} MXN</span>
                </div>
              </div>

              {/* One-time Booking */}
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedBookingType === 'one-time' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-accent'
                }`}
                onClick={() => setSelectedBookingType('one-time')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        selectedBookingType === 'one-time' 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <span className="font-medium">First-time Discount</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-5">10% off for new users</p>
                  </div>
                  <span className="font-semibold">${(classData.price * 0.9).toFixed(0)} MXN</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">
                {selectedBookingType === 'monthly' 
                  ? 'FREE' 
                  : `$${getBookingPrice()} MXN`}
              </span>
            </div>
            
            {selectedBookingType === 'monthly' && userProfile?.monthly_credits && userProfile.monthly_credits > 0 && (
              <p className="text-sm text-muted-foreground">
                Credits after booking: {userProfile.monthly_credits - 1}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleBooking} 
              disabled={isBooking || spotsLeft <= 0 || (selectedBookingType === 'monthly' && (!userProfile?.monthly_credits || userProfile.monthly_credits <= 0))}
              className="flex-1"
            >
              {isBooking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Booking...
                </div>
              ) : spotsLeft <= 0 ? (
                'Class Full'
              ) : selectedBookingType === 'monthly' && (!userProfile?.monthly_credits || userProfile.monthly_credits <= 0) ? (
                'No Credits'
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;