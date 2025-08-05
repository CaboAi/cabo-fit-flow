// Cabo FitPass - Main App Component for Lovable.io
import React, { useState, useEffect } from 'react'
import { queries, auth } from './lovable_config.js'

// Main App Component
export default function CaboFitPassApp() {
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [gyms, setGyms] = useState([])
  const [userBookings, setUserBookings] = useState([])
  const [userSubscriptions, setUserSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Check for authenticated user
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)

      // Load initial data
      const [gymsData, classesData] = await Promise.all([
        queries.getGyms(),
        queries.getClasses()
      ])

      setGyms(gymsData)
      setClasses(classesData)

      // Load user-specific data if authenticated
      if (currentUser) {
        const [bookingsData, subscriptionsData] = await Promise.all([
          queries.getUserBookings(currentUser.id),
          queries.getUserSubscriptions(currentUser.id)
        ])
        
        setUserBookings(bookingsData)
        setUserSubscriptions(subscriptionsData)
      }

    } catch (error) {
      console.error('Error initializing app:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookClass = async (classId) => {
    if (!user) {
      alert('Please sign in to book classes')
      return
    }

    try {
      const bookingData = {
        user_id: user.id,
        class_id: classId,
        type: 'drop-in',
        payment_status: 'pending'
      }

      const newBooking = await queries.createBooking(bookingData)
      setUserBookings(prev => [newBooking, ...prev])
      alert('Class booked successfully!')
      
    } catch (error) {
      console.error('Error booking class:', error)
      alert('Failed to book class. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-blue-600">Loading Cabo FitPass...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {user && <UserDashboard 
          user={user}
          bookings={userBookings}
          subscriptions={userSubscriptions}
        />}
        
        <ClassSchedule 
          classes={classes}
          gyms={gyms}
          onBookClass={handleBookClass}
          user={user}
        />
      </main>
    </div>
  )
}

// Header Component
function Header({ user }) {
  return (
    <header className="bg-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CF</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cabo FitPass</h1>
              <p className="text-gray-600">Your fitness journey in paradise</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">Welcome, {user.email}</span>
                <button 
                  onClick={() => auth.signOut()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// User Dashboard Component
function UserDashboard({ user, bookings, subscriptions }) {
  const activeSubscription = subscriptions.find(sub => sub.status === 'active')

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Subscription Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Status</h3>
          {activeSubscription ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-600 font-medium">Active</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                  {activeSubscription.plans?.name}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Expires: {new Date(activeSubscription.end_date).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-gray-500">No active subscription</span>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                View Plans
              </button>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Bookings</h3>
          {bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.slice(0, 3).map(booking => (
                <div key={booking.id} className="text-sm">
                  <div className="font-medium">{booking.classes?.title}</div>
                  <div className="text-gray-600">{booking.classes?.gyms?.name}</div>
                  <div className={`text-xs ${
                    booking.payment_status === 'completed' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {booking.payment_status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No bookings yet</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Bookings:</span>
              <span className="font-medium">{bookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Subs:</span>
              <span className="font-medium">{subscriptions.filter(s => s.status === 'active').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gyms Available:</span>
              <span className="font-medium">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Class Schedule Component
function ClassSchedule({ classes, gyms, onBookClass, user }) {
  const [selectedGym, setSelectedGym] = useState('')

  const filteredClasses = selectedGym 
    ? classes.filter(cls => cls.gym_id === selectedGym)
    : classes

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Class Schedule</h2>
        
        <select 
          value={selectedGym} 
          onChange={(e) => setSelectedGym(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Gyms</option>
          {gyms.map(gym => (
            <option key={gym.id} value={gym.id}>{gym.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map(classItem => (
          <ClassCard 
            key={classItem.id}
            classItem={classItem}
            onBook={() => onBookClass(classItem.id)}
            canBook={!!user}
          />
        ))}
      </div>
    </div>
  )
}

// Class Card Component
function ClassCard({ classItem, onBook, canBook }) {
  const scheduleDate = new Date(classItem.schedule)
  const isUpcoming = scheduleDate > new Date()

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{classItem.title}</h3>
          <span className="text-2xl font-bold text-blue-600">${classItem.price}</span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <span className="font-medium">📍 {classItem.gyms?.name}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span>📅 {scheduleDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span>🕐 {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span>👥 Capacity: {classItem.capacity} people</span>
          </div>
        </div>

        <button 
          onClick={onBook}
          disabled={!canBook || !isUpcoming}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            canBook && isUpcoming
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!canBook ? 'Sign in to Book' : !isUpcoming ? 'Class Ended' : 'Book Class'}
        </button>
      </div>
    </div>
  )
}