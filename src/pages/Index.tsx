import Header from "@/components/Header";
import ClassCard from "@/components/ClassCard";
import { Button } from "@/components/ui/button";
import { useClasses, useBookClass } from "@/hooks/useClasses";
import { Search, Filter, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { data: classes, isLoading, error } = useClasses();
  const bookClass = useBookClass();

  const handleBookClass = (classId: string) => {
    bookClass.mutate({ classId });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6">
            Your Fitness
            <br />
            <span className="text-cf-orange">Freedom</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Unlimited access to premium fitness studios across Los Cabos. 
            One membership, endless possibilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/pricing">
              <Button className="btn-cf-primary px-8 py-3 text-lg">
                View Pricing Plans
              </Button>
            </Link>
            <Link to="/studios">
              <Button variant="outline" className="btn-cf-outline px-8 py-3 text-lg">
                Explore Studios
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Classes Section */}
      <section id="classes" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Discover Classes
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              From sunrise yoga to high-intensity training - find the perfect class for you
            </p>
            
            {/* Search and Filter Bar */}
            <div className="bg-card rounded-lg border border-border p-6 mb-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search classes..."
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-foreground"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-foreground appearance-none">
                    <option>All Categories</option>
                    <option>Yoga</option>
                    <option>HIIT</option>
                    <option>Cycling</option>
                    <option>Pilates</option>
                  </select>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-foreground"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-foreground appearance-none">
                    <option>All Locations</option>
                    <option>Cabo San Lucas</option>
                    <option>San José del Cabo</option>
                    <option>Corridor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading classes...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-8">
                <p className="text-destructive">Failed to load classes. Please try again.</p>
              </div>
            ) : classes?.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No classes available at the moment.</p>
              </div>
            ) : (
              classes?.map((classItem) => (
                <ClassCard 
                  key={classItem.id} 
                  {...classItem} 
                  onBook={handleBookClass}
                />
              ))
            )}
          </div>
          
          <div className="text-center mt-8">
            <Button className="btn-cf-primary px-8 py-3 text-lg">
              View All Classes
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-black text-cf-orange mb-2">50+</div>
              <div className="text-muted-foreground">Partner Studios</div>
            </div>
            <div>
              <div className="text-4xl font-black text-cf-orange mb-2">200+</div>
              <div className="text-muted-foreground">Daily Classes</div>
            </div>
            <div>
              <div className="text-4xl font-black text-cf-orange mb-2">5000+</div>
              <div className="text-muted-foreground">Happy Members</div>
            </div>
            <div>
              <div className="text-4xl font-black text-cf-orange mb-2">24/7</div>
              <div className="text-muted-foreground">App Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-cf-gradient">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to Transform?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of fitness enthusiasts in Cabo San Lucas. Your perfect workout is just a tap away.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="bg-white text-slate-800 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
              START FREE TRIAL
            </Button>
            <Button className="bg-slate-800 text-white border-2 border-white hover:bg-white hover:text-slate-800 px-8 py-3 text-lg font-semibold">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;