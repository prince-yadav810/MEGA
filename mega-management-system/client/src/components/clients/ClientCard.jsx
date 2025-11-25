// File Path: client/src/components/clients/ClientCard.jsx

import React from 'react';
import { Building2, User, Phone, Mail, MapPin, Clock } from 'lucide-react';
import Card from '../ui/Card';

const ClientCard = ({ client, onClick }) => {

  // Get primary contact or first contact
  const primaryContact = client.contactPersons?.find(c => c.isPrimary) || client.contactPersons?.[0];

  // Calculate call status
  const getCallStatus = () => {
    if (!client.nextCallDate) return { status: 'due', label: 'Call Due', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextCall = new Date(client.nextCallDate);
    nextCall.setHours(0, 0, 0, 0);
    
    const diffTime = nextCall - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', label: `Overdue ${Math.abs(diffDays)} days`, color: 'bg-red-100 text-red-700 border-red-200' };
    if (diffDays === 0) return { status: 'due', label: 'Call Today', color: 'bg-green-100 text-green-700 border-green-200' };
    
    return { status: 'future', label: `Call in ${diffDays} days`, color: 'bg-blue-50 text-blue-600 border-blue-100' };
  };

  const callStatus = getCallStatus();

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary-300 relative"
      onClick={() => onClick(client)}
    >
      {/* Call Status Banner */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-xl ${callStatus.status === 'overdue' ? 'bg-red-500' : callStatus.status === 'due' ? 'bg-green-500' : 'bg-transparent'}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 mt-2">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {client.companyName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {client.businessType && (
                <span className="text-sm text-gray-500">{client.businessType}</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${callStatus.color}`}>
                {callStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col items-end gap-2">
          {/* Client Type Badge */}
          <span
            className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${client.clientType === 'supplier'
                ? 'bg-blue-100 text-blue-700'
                : client.clientType === 'buyer'
                ? 'bg-green-100 text-green-700'
                : 'bg-purple-100 text-purple-700'
              }
            `}
          >
            {client.clientType === 'supplier' ? 'Supplier' : client.clientType === 'buyer' ? 'Buyer' : 'Both'}
          </span>

          {/* Active/Inactive Badge */}
          <span
            className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${client.isActive
                ? 'bg-success-100 text-success-700'
                : 'bg-gray-100 text-gray-600'
              }
            `}
          >
            {client.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Call Frequency Info */}
      <div className="flex items-center text-xs text-gray-500 mb-4">
        <Clock className="w-3 h-3 mr-1" />
        Every {client.callFrequency || 10} days
      </div>

      {/* Primary Contact Info */}
      {primaryContact && (
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">{primaryContact.name}</span>
            {primaryContact.designation && (
              <span className="ml-2 text-gray-400">• {primaryContact.designation}</span>
            )}
          </div>

          {primaryContact.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <span>{primaryContact.phone}</span>
            </div>
          )}

          {primaryContact.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{primaryContact.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Address (if available) */}
      {client.address?.city && (
        <div className="flex items-center text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">
            {[client.address.city, client.address.state].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      {/* Tags */}
      {client.tags && client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {client.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
            >
              {tag}
            </span>
          ))}
          {client.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{client.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Products */}
      {client.products && client.products.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">
            {client.clientType === 'supplier' ? 'Supplies:' :
             client.clientType === 'buyer' ? 'Purchases:' : 'Products:'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {client.products.slice(0, 3).map((product, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  client.clientType === 'supplier' ? 'bg-blue-50 text-blue-700' :
                  client.clientType === 'buyer' ? 'bg-green-50 text-green-700' :
                  'bg-purple-50 text-purple-700'
                }`}
              >
                {product}
              </span>
            ))}
            {client.products.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{client.products.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {client.contactPersons?.length > 1 && (
            <span>+{client.contactPersons.length - 1} more contact{client.contactPersons.length - 1 > 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="text-xs text-primary-600 font-medium">
          View Details →
        </div>
      </div>
    </Card>
  );
};

export default ClientCard;
