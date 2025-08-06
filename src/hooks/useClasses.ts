import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClassWithGym {
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
}

export const useClasses = () => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          gym:gyms(*),
          bookings(count)
        `);

      if (error) throw error;

      return data.map((item: any) => ({
        ...item,
        bookings_count: item.bookings?.[0]?.count || 0,
      })) as ClassWithGym[];
    },
  });
};

export const useGyms = () => {
  return useQuery({
    queryKey: ["gyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gyms")
        .select("*");

      if (error) throw error;
      return data;
    },
  });
};

export const useClassesByGym = (gymId: string) => {
  return useQuery({
    queryKey: ["classes-by-gym", gymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          gym:gyms(*),
          bookings(count)
        `)
        .eq("gym_id", gymId);

      if (error) throw error;

      return data.map((item: any) => ({
        ...item,
        bookings_count: item.bookings?.[0]?.count || 0,
      })) as ClassWithGym[];
    },
    enabled: !!gymId,
  });
};

export const useUserBookings = () => {
  return useQuery({
    queryKey: ["user-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          class:classes(*,
            gym:gyms(*)
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: false, // Will be enabled when user is authenticated
  });
};

export const useBookClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId }: { classId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          class_id: classId,
          payment_status: "pending",
          type: "regular"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      toast({
        title: "Class booked successfully!",
        description: "Your booking has been confirmed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};