import React, { useState, useEffect } from 'react';
import { Sun, Moon, Cloud } from 'lucide-react';

const WelcomeCard = ({ userName, userRole }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute instead of every second

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sun, color: 'text-yellow-500' };
    if (hour < 17) return { text: 'Good Afternoon', icon: Cloud, color: 'text-blue-500' };
    return { text: 'Good Evening', icon: Moon, color: 'text-indigo-500' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Display proper name instead of role for admins
  const displayName = userRole === 'admin' || userRole === 'manager' ? 'Nirmal Dewasi' : userName;

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GreetingIcon className={`h-6 w-6 ${greeting.color}`} />
          <div>
            <h2 className="text-lg font-bold">{greeting.text}, {displayName}!</h2>
            <p className="text-primary-100 text-xs capitalize">{userRole === 'admin' ? 'Manager' : userRole}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium">{formatDate(currentTime)}</p>
          <p className="text-xl font-bold">{formatTime(currentTime)}</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;

