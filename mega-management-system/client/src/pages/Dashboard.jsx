import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';

// Import dashboard cards
import WelcomeCard from '../components/dashboard/WelcomeCard';
import AttendanceCard from '../components/dashboard/AttendanceCard';
import TasksCard from '../components/dashboard/TasksCard';
import CallsCard from '../components/dashboard/CallsCard';
import QuotationsCard from '../components/dashboard/QuotationsCard';
import RemindersCard from '../components/dashboard/RemindersCard';
import PaymentRemindersCard from '../components/dashboard/PaymentRemindersCard';
import EmployeeWalletSection from '../components/wallet/EmployeeWalletSection';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getStats();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    // Refresh dashboard data after check-in
    fetchDashboardData();
  };

  const handleCheckOut = () => {
    // Refresh dashboard data after check-out
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      {/* Dashboard Content - Magic Bento Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        {/* Bento Grid Layout - 3 columns for better vertical alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Welcome Card (Spans 2 cols) */}
          <div className="md:col-span-2 lg:col-span-2">
            <WelcomeCard 
              userName={dashboardData?.user?.name || user?.name || 'User'}
              userRole={dashboardData?.user?.role || user?.role || 'employee'}
            />
          </div>

          {/* Attendance Card (Spans 1 col, Row span 2) - Sits on the right */}
          <div className="md:col-span-2 lg:col-span-1 lg:row-span-2">
            <AttendanceCard
              userRole={user?.role}
              attendanceData={dashboardData?.attendance}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          </div>

          {/* Tasks (1 col) - Sits under Welcome */}
          <div className="md:col-span-1 lg:col-span-1">
            <TasksCard 
              tasks={dashboardData?.tasks?.items || []} 
              title="Today's Tasks" 
            />
          </div>

          {/* For Admins: Calls Card. For Employees: Upcoming Tasks */}
          <div className="md:col-span-1 lg:col-span-1">
            {isAdmin ? (
              <CallsCard
                calls={dashboardData?.calls?.items || []}
                dateRange={dashboardData?.calls?.dateRange || 'today'}
              />
            ) : (
              <TasksCard 
                tasks={dashboardData?.tasks?.upcoming || []} 
                title="Upcoming Tasks" 
              />
            )}
          </div>

          {/* Quotations (2 cols) */}
          <div className="md:col-span-2 lg:col-span-2">
            <QuotationsCard quotations={dashboardData?.quotations?.items || []} />
          </div>

          {/* Reminders (1 col) */}
          <div className="md:col-span-1 lg:col-span-1">
            <RemindersCard 
              reminders={dashboardData?.reminders?.items || []} 
              dateRange={dashboardData?.reminders?.dateRange || 'today'}
            />
          </div>

          {/* Employee Wallet Section - Only for Employees (2 cols) */}
          {!isAdmin && user?.role === 'employee' && (
            <div className="md:col-span-2 lg:col-span-2">
              <EmployeeWalletSection />
            </div>
          )}

          {/* Payment Reminders (Full Width) - Only for Admin/Manager */}
          {isAdmin && (
            <div className="md:col-span-2 lg:col-span-3">
              <PaymentRemindersCard
                paymentReminders={dashboardData?.paymentReminders?.items || []}
              />
            </div>
          )}
        </div>

        {/* Additional Stats Section for Admins */}
        {isAdmin && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-primary-600">
                  {dashboardData?.tasks?.count || 0}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <p className="text-sm text-gray-600">Calls Scheduled</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData?.calls?.count || 0}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <p className="text-sm text-gray-600">On-Hold Quotations</p>
                <p className="text-3xl font-bold text-orange-600">
                  {dashboardData?.quotations?.onHold || 0}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <p className="text-sm text-gray-600">Team Present</p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboardData?.attendance?.summary?.present || 0}
                  <span className="text-sm text-gray-500">
                    /{dashboardData?.attendance?.summary?.total || 0}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
