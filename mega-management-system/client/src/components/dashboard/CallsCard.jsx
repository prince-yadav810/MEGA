import React from 'react';
import { Phone, MapPin, Calendar, ChevronRight, User, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallsCard = ({ calls = [], dateRange = 'today' }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatOverdueDays = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day overdue';
    return `${diffDays} days overdue`;
  };

  const getPrimaryContact = (contactPersons) => {
    if (!contactPersons || contactPersons.length === 0) return null;
    return contactPersons.find(c => c.isPrimary) || contactPersons[0];
  };

  const isOverdue = dateRange === 'overdue';

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Phone className={`h-6 w-6 ${isOverdue ? 'text-orange-600' : 'text-primary-600'}`} />
          <h3 className="text-lg font-semibold text-gray-900">
            {isOverdue ? 'Overdue Calls' : 'Clients to Call'}
          </h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isOverdue ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {calls.length}
        </span>
      </div>

      {isOverdue && calls.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-700 font-medium">
            No calls for today. Showing {calls.length} overdue client{calls.length > 1 ? 's' : ''} to follow up:
          </p>
        </div>
      )}

      {calls.length === 0 ? (
        <div className="text-center py-8">
          <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No calls scheduled</p>
          <p className="text-sm text-gray-400 mt-1">You're free to focus on other tasks!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {calls.map((client) => {
            const primaryContact = getPrimaryContact(client.contactPersons);

            return (
              <div
                key={client._id}
                className={`border rounded-lg p-3 hover:shadow-sm transition-all ${
                  isOverdue
                    ? 'border-orange-200 bg-orange-50/30 hover:border-orange-300'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {client.companyName}
                    </h4>

                    {primaryContact && (
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <User className="h-3 w-3 mr-1" />
                          <span>{primaryContact.name}</span>
                          {primaryContact.designation && (
                            <span className="text-gray-400 ml-1">
                              • {primaryContact.designation}
                            </span>
                          )}
                        </div>
                        {primaryContact.phone && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            <a
                              href={`tel:${primaryContact.phone}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {primaryContact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {client.lastCallOutcome && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">
                          Last: {client.lastCallOutcome}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-1 ml-2">
                    {isOverdue ? (
                      <span className="text-xs text-orange-600 font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatOverdueDays(client.nextCallDate)}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-blue-600 font-medium flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Today
                        </span>
                        {client.nextCallDate && (
                          <span className="text-xs text-gray-500">
                            {formatTime(client.nextCallDate)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        to="/clients"
        className="mt-4 w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-100 transition-colors"
      >
        <span>View All Clients</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default CallsCard;
