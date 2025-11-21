import React from 'react';
import { Phone, MapPin, Calendar, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallsCard = ({ calls = [] }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrimaryContact = (contactPersons) => {
    if (!contactPersons || contactPersons.length === 0) return null;
    return contactPersons.find(c => c.isPrimary) || contactPersons[0];
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Phone className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Clients to Call</h3>
        </div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          {calls.length}
        </span>
      </div>

      {calls.length === 0 ? (
        <div className="text-center py-8">
          <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No calls scheduled for today</p>
          <p className="text-sm text-gray-400 mt-1">You're free to focus on other tasks!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {calls.map((client) => {
            const primaryContact = getPrimaryContact(client.contactPersons);
            
            return (
              <div
                key={client._id}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
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
                    <span className="text-xs text-blue-600 font-medium flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Today
                    </span>
                    {client.nextCallDate && (
                      <span className="text-xs text-gray-500">
                        {formatTime(client.nextCallDate)}
                      </span>
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

