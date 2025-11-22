import React from 'react';
import { CreditCard, Send, Clock, MessageSquare } from 'lucide-react';

const PaymentRemindersCard = ({ paymentReminders = [] }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return '---';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No message';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const getProgressColor = (sent, total) => {
    const percentage = (sent / total) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Payment Reminders</h3>
        </div>
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
          {paymentReminders.length} active
        </span>
      </div>

      {paymentReminders.length === 0 ? (
        <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active payment reminders</p>
          <p className="text-sm text-gray-400 mt-1">All payment reminders are completed</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto flex-1">
          {paymentReminders.map((reminder) => (
            <div
              key={reminder._id}
              className="border border-orange-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-sm transition-all bg-orange-50/30"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {reminder.clientName}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                    <span className="font-medium text-primary-600">
                      {reminder.invoiceNumber}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-gray-800">
                      {formatAmount(reminder.invoiceAmount)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-orange-600 font-medium">
                    Every {reminder.frequencyInDays} days
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center text-gray-600">
                    <Send className="h-3 w-3 mr-1" />
                    {reminder.messagesSent} / {reminder.totalMessagesToSend} sent
                  </span>
                  <span className="text-gray-500">
                    {Math.round((reminder.messagesSent / reminder.totalMessagesToSend) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(reminder.messagesSent, reminder.totalMessagesToSend)}`}
                    style={{ width: `${(reminder.messagesSent / reminder.totalMessagesToSend) * 100}%` }}
                  />
                </div>
              </div>

              {/* Message Preview */}
              <div className="flex items-start space-x-1 text-xs text-gray-500 mb-2">
                <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p className="line-clamp-1">{truncateMessage(reminder.messageTemplate)}</p>
              </div>

              {/* Next Scheduled */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center text-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Next: <span className="font-medium text-blue-600 ml-1">{formatDate(reminder.nextScheduledDate)}</span>
                </span>
                {reminder.lastSentDate && (
                  <span className="text-gray-400">
                    Last sent: {formatDate(reminder.lastSentDate)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentRemindersCard;
