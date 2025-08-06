import Header from "@/components/Header";
import PricingCard from "@/components/PricingCard";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";

const Pricing = () => {
  // Pricing plans data
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

  const benefits = [
    {
      icon: <Check className="w-6 h-6" />,
      title: "No Contracts",
      description: "Cancel anytime, no questions asked"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Premium Studios",
      description: "Access to the best fitness facilities in Los Cabos"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Booking",
      description: "Book classes instantly through our mobile app"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Flexible membership options designed for locals and tourists alike. 
            Get unlimited access to premium fitness studios across Los Cabos.
          </p>
          <div className="inline-block bg-cf-gradient text-white px-6 py-2 rounded-full text-sm font-semibold">
            🎉 30-DAY MONEY-BACK GUARANTEE
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose Cabo Fit Pass?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of fitness enthusiasts who trust us for their wellness journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-cf-gradient rounded-full flex items-center justify-center text-white mb-4 mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Can I cancel anytime?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes! You can cancel your membership at any time with no cancellation fees.
                  </p>
                </div>
                
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Do you offer day passes?
                  </h3>
                  <p className="text-muted-foreground">
                    Our Tourist Pass is perfect for short visits - gives you access for a full week.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    What's included in my membership?
                  </h3>
                  <p className="text-muted-foreground">
                    All plans include access to partner studios, mobile app, and customer support.
                  </p>
                </div>
                
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Is there a free trial?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes! We offer a 7-day free trial for all new members to try our services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-cf-gradient">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the fitness revolution in Los Cabos. Your perfect workout is just a click away.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="bg-white text-slate-800 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
              START FREE TRIAL
            </Button>
            <Button className="bg-slate-800 text-white border-2 border-white hover:bg-white hover:text-slate-800 px-8 py-3 text-lg font-semibold">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;