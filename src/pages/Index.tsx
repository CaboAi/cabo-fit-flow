import Header from "@/components/Header";
import ClassCard from "@/components/ClassCard";
import PricingCard from "@/components/PricingCard";
import { Button } from "@/components/ui/button";
import { Search, Filter, Calendar, MapPin } from "lucide-react";

// Import class images
import yogaImage from "@/assets/yoga-class.jpg";
import hiitImage from "@/assets/hiit-class.jpg";
import cyclingImage from "@/assets/cycling-class.jpg";
import pilatesImage from "@/assets/pilates-class.jpg";

const Index = () => {
  // Sample class data
  const sampleClasses = [
    {
      id: "1",
      name: "Sunset Beach Yoga",
      studio: "Ocean Breeze Studio",
      instructor: "Maria Rodriguez",
      time: "6:30 PM",
      duration: 60,
      spots: 8,
      maxSpots: 15,
      rating: 4.9,
      difficulty: "Beginner" as const,
      type: "Yoga",
      image: yogaImage
    },
    {
      id: "2", 
      name: "HIIT Beachside",
      studio: "Cabo Fitness Club",
      instructor: "Carlos Martinez",
      time: "7:00 AM",
      duration: 45,
      spots: 12,
      maxSpots: 20,
      rating: 4.8,
      difficulty: "Advanced" as const,
      type: "HIIT",
      image: hiitImage
    },
    {
      id: "3",
      name: "Power Cycling",
      studio: "Ride Cabo",
      instructor: "Ana Lopez",
      time: "8:00 AM", 
      duration: 50,
      spots: 5,
      maxSpots: 25,
      rating: 4.7,
      difficulty: "Intermediate" as const,
      type: "Cycling",
      image: cyclingImage
    },
    {
      id: "4",
      name: "Core Pilates",
      studio: "Balance Studio",
      instructor: "Sofia Chen",
      time: "9:30 AM",
      duration: 55,
      spots: 3,
      maxSpots: 12,
      rating: 4.9,
      difficulty: "Intermediate" as const,
      type: "Pilates", 
      image: pilatesImage
    }
  ];

  // Sample pricing plans
  const pricingPlans = [
    {
      name: "Basic",
      price: "$650 MXN",
      period: "month",
      description: "Perfect for getting started with fitness",
      features: [
        "10 classes per month",
        "Access to 30+ studios",
        "Book up to 3 days ahead",
        "Mobile app access",
        "Class reminders"
      ]
    },
    {
      name: "Standard", 
      price: "$950 MXN",
      period: "month",
      description: "Most popular choice for regular fitness enthusiasts",
      features: [
        "20 classes per month",
        "Access to 50+ studios", 
        "Book up to 7 days ahead",
        "Premium class access",
        "Guest passes (2/month)",
        "Priority booking"
      ],
      isPopular: true
    },
    {
      name: "Premium",
      price: "$1,350 MXN", 
      period: "month",
      description: "Unlimited access for fitness lovers",
      features: [
        "Unlimited classes",
        "All 50+ studios",
        "Book up to 14 days ahead",
        "VIP studio access",
        "Guest passes (5/month)",
        "Personal training discounts"
      ]
    },
    {
      name: "Tourist Pass",
      price: "$450 MXN",
      period: "week", 
      description: "Short-term access for visitors",
      features: [
        "5 classes per week",
        "All studio access",
        "Instant booking",
        "English support",
        "No commitment"
      ],
      isTourist: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Featured Classes Section */}
      <section id="classes" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Discover Classes
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              From sunrise yoga to high-intensity training - find the perfect class for you
            </p>
            
            {/* Search and Filter Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 bg-card rounded-xl shadow-card p-6 border border-border">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search classes or studios..."
                    className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Today
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Near Me
                </Button>
              </div>
            </div>
          </div>
          
          {/* Class Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleClasses.map((classItem) => (
              <ClassCard key={classItem.id} {...classItem} />
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="accent" size="lg">
              View All Classes
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-24 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Choose Your Plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Flexible plans for locals and tourists alike
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto pt-8">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to Transform?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of fitness enthusiasts in Cabo San Lucas. Your perfect workout is just a tap away.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button variant="accent" size="lg" className="text-lg py-4 px-8 font-semibold">
              START FREE TRIAL
            </Button>
            <Button variant="outline" size="lg" className="text-lg py-4 px-8 font-semibold border-white/20 text-white hover:bg-white/10">
              LEARN MORE
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-accent mb-4">
                Cabo Fit Pass
              </h3>
              <p className="text-muted-foreground">
                Your fitness passport to Cabo San Lucas. Discover, book, and enjoy unlimited access to the best studios.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Classes</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-accent cursor-pointer transition-colors">Yoga</li>
                <li className="hover:text-accent cursor-pointer transition-colors">HIIT</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Pilates</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Cycling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-accent cursor-pointer transition-colors">About</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Press</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-accent cursor-pointer transition-colors">Help Center</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Safety</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Terms</li>
                <li className="hover:text-accent cursor-pointer transition-colors">Privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
