// Lovable.io Configuration for Cabo FitPass
// This file configures the integration between Lovable frontend and Supabase backend

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://pamzfhiiuvmtlwwvufut.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supabase Database Queries for Cabo FitPass

export const queries = {
  // Get all gyms
  getGyms: async () => {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Get all classes
  getClasses: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        gyms (
          id,
          name,
          location
        )
      `)
      .order('schedule')
    
    if (error) throw error
    return data
  },

  // Get classes by gym
  getClassesByGym: async (gymId) => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('gym_id', gymId)
      .order('schedule')
    
    if (error) throw error
    return data
  },

  // Get user bookings
  getUserBookings: async (userId) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          id,
          title,
          schedule,
          price,
          gyms (
            name,
            location
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get user subscriptions
  getUserSubscriptions: async (userId) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (
          id,
          name,
          price,
          duration_days,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get subscription plans
  getPlans: async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price')
    
    if (error) throw error
    return data
  },

  // Create a booking
  createBooking: async (bookingData) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Create a subscription
  createSubscription: async (subscriptionData) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Get user workouts
  getUserWorkouts: async (userId) => {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        classes (
          title,
          gyms (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create workout record
  createWorkout: async (workoutData) => {
    const { data, error } = await supabase
      .from('workouts')
      .insert([workoutData])
      .select()
    
    if (error) throw error
    return data[0]
  }
}

// Authentication helpers
export const auth = {
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Realtime subscriptions
export const realtime = {
  subscribeToClasses: (callback) => {
    return supabase
      .channel('classes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, callback)
      .subscribe()
  },

  subscribeToBookings: (userId, callback) => {
    return supabase
      .channel('user-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${userId}` }, 
        callback
      )
      .subscribe()
  }
}

export default {
  supabase,
  queries,
  auth,
  realtime
}