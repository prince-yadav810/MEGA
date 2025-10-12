// File Path: client/src/components/clients/ClientCard.jsx

import React from 'react';
import { Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import Card from '../ui/Card';

const ClientCard = ({ client, onClick }) => {
  // Get primary contact or first contact
  const primaryContact = client.contactPersons?.find(c => c.isPrimary) || client.contactPersons?.[0];

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary-300"
      onClick={() => onClick(client)}
    >
      {/* Company Name */}
      <div className="flex items-start justify-between mb-4">
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
            {client.businessType && (
              <p className="text-sm text-gray-500">{client.businessType}</p>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
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

      {/* Additional Info */}
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