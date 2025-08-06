import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  TrendingUp, 
  Activity,
  Star,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "./Header";

interface UserProfile {
  id: string;
  monthly_credits: number;
  subscription_status: string;
  subscription_plan: string;
  subscription_start_date: string;
  subscription_end_date: string;
}

interface BookingHistory {
  id: string;
  type: string;
  payment_status: string;
  created_at: string;
  class: {
    id: string;
    title: string;
    schedule: string;
    price: number;
    gym: {
      name: string;
      location: string;
    };
  };
}

interface UserDashboardComponentProps {
  user?: any;
}

const UserDashboard = ({ user: propUser }: UserDashboardComponentProps = {}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const user = propUser || (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      // Set user profile with default values for missing fields
      setUserProfile({
        ...profile,
        monthly_credits: (profile as any).monthly_credits || 4,
        subscription_status: 'active',
        subscription_plan: 'monthly',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Fetch booking history
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) throw bookingsError;
      
      // Transform bookings data to match expected format
      const formattedBookings = (bookings || []).map(booking => ({
        ...booking,
        created_at: booking.created_at || new Date().toISOString(),
        class: {
          ...(booking.class || {}),
          gym: { name: 'Default Gym', location: 'Default Location' }
        }
      }));
      
      setBookingHistory(formattedBookings as any);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateCreditsUsed = () => {
    if (!userProfile) return 0;
    // Assuming a standard plan has 20 credits per month
    const standardCredits = 20;
    return standardCredits - userProfile.monthly_credits;
  };

  const getCreditsProgress = () => {
    if (!userProfile) return 0;
    const standardCredits = 20;
    const used = calculateCreditsUsed();
    return (used / standardCredits) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Track your credits, bookings, and fitness activities</p>
        </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Credits</p>
                    <p className="text-2xl font-bold text-foreground">
                      {userProfile?.monthly_credits || 0}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground">
                      {calculateCreditsUsed()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground">
                      {bookingHistory.length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge 
                      className={`${getSubscriptionColor(userProfile?.subscription_status || 'inactive')} text-white`}
                    >
                      {userProfile?.subscription_status || 'Inactive'}
                    </Badge>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credits Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monthly Credits Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Credits Used</span>
                  <span>{calculateCreditsUsed()} / 20</span>
                </div>
                <Progress value={getCreditsProgress()} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {userProfile?.monthly_credits || 0} credits remaining this month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-16 flex flex-col gap-2" asChild>
                  <a href="/#classes">
                    <Calendar className="h-6 w-6" />
                    Book a Class
                  </a>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-2">
                  <CreditCard className="h-6 w-6" />
                  Buy Credits
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-2" asChild>
                  <a href="/profile">
                    <User className="h-6 w-6" />
                    View Profile
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bookings yet</p>
                  <p className="text-sm text-muted-foreground">Start exploring classes to make your first booking</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingHistory.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{booking.class.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.class.gym.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(booking.class.schedule)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={booking.payment_status === 'completed' ? 'default' : 'secondary'}
                        >
                          {booking.payment_status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.type}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Bookings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">Start your fitness journey by booking your first class</p>
                  <Button>Browse Classes</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingHistory.map((booking) => (
                    <div key={booking.id} className="border border-border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{booking.class.title}</h4>
                          <p className="text-muted-foreground">{booking.class.gym.name}</p>
                        </div>
                        <Badge 
                          variant={booking.payment_status === 'completed' ? 'default' : 'secondary'}
                        >
                          {booking.payment_status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium text-foreground">
                            {formatDate(booking.class.schedule)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium text-foreground">{booking.class.gym.location}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium text-foreground capitalize">{booking.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Booked</p>
                          <p className="font-medium text-foreground">
                            {formatDate(booking.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;