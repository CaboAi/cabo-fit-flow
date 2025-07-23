import Header from "@/components/Header";
import Hero from "@/components/Hero";
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
      <Hero />
      
      {/* Featured Classes Section */}
      <section id="classes" className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Discover Your Next Workout
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              From sunrise yoga to high-intensity training - find the perfect class for you
            </p>
            
            {/* Search and Filter Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 bg-white rounded-lg shadow-card p-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search classes or studios..."
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <Button variant="default" size="lg">
              View All Classes
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Fitness Journey
            </h2>
            <p className="text-xl text-muted-foreground">
              Flexible plans for locals and tourists alike
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Fitness?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of fitness enthusiasts in Cabo San Lucas. Your perfect workout is just a tap away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="glass" size="lg" className="text-lg">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
                CaboFit
              </h3>
              <p className="text-white/80">
                Your fitness passport to Cabo San Lucas. Discover, book, and enjoy unlimited access to the best studios.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Classes</h4>
              <ul className="space-y-2 text-white/80">
                <li>Yoga</li>
                <li>HIIT</li>
                <li>Pilates</li>
                <li>Cycling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/80">
                <li>About</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/80">
                <li>Help Center</li>
                <li>Safety</li>
                <li>Terms</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
