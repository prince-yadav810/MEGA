/**
 * Date formatting utilities for reminders
 */

/**
 * Format date to natural language (Today, Tomorrow, etc.)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Natural language date representation
 */
export const formatNaturalDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `In ${diffDays} days`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return `${Math.abs(diffDays)} days ago`;
  } else {
    // Format as readable date
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: targetDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Format date and time together in a readable format
 * @param {string|Date} dateString - Date string or Date object
 * @param {string} timeString - Time string (HH:mm format)
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (dateString, timeString) => {
  if (!dateString) return '';
  
  const naturalDate = formatNaturalDate(dateString);
  const time = timeString ? formatTime(timeString) : '';
  
  if (time) {
    return `${naturalDate} at ${time}`;
  }
  return naturalDate;
};

/**
 * Format time string to readable format (12-hour with AM/PM)
 * @param {string} timeString - Time string in HH:mm format
 * @returns {string} Formatted time
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Get smart default date (today) and time (1 hour from now)
 * @returns {Object} Object with date and time strings
 */
export const getSmartDefaults = () => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  const date = now.toISOString().split('T')[0];
  const hours = String(oneHourLater.getHours()).padStart(2, '0');
  const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;
  
  return { date, time };
};

/**
 * Format repeat frequency to readable text
 * @param {Object} reminder - Reminder object
 * @param {Array} weekDays - Array of weekday names
 * @returns {string} Formatted repeat pattern
 */
export const formatRepeatPattern = (reminder, weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) => {
  if (!reminder || reminder.repeatFrequency === 'none') return 'One-time';
  
  switch (reminder.repeatFrequency) {
    case 'daily':
      return 'Daily';
    case 'yearly':
      return 'Yearly';
    case 'weekly':
      if (reminder.weeklyDays && reminder.weeklyDays.length > 0) {
        const selectedDays = reminder.weeklyDays.map(d => weekDays[d]).join(', ');
        return `Weekly on ${selectedDays}`;
      }
      return 'Weekly';
    case 'monthly':
      if (reminder.monthlyType === 'weekday') {
        const weekNum = ['First', 'Second', 'Third', 'Fourth', 'Last'][
          reminder.monthlyWeekNumber === -1 ? 4 : reminder.monthlyWeekNumber - 1
        ];
        return `Monthly on ${weekNum} ${weekDays[reminder.monthlyWeekDay]}`;
      }
      return `Monthly on day ${reminder.monthlyDate}`;
    case 'custom':
      return `Every ${reminder.customInterval || 1} ${reminder.customIntervalUnit || 'days'}`;
    default:
      return reminder.repeatFrequency;
  }
};

