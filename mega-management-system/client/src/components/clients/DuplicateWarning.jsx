// File Path: client/src/components/clients/DuplicateWarning.jsx

import React from 'react';
import { AlertTriangle, AlertCircle, Eye } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Duplicate Warning Component
 * Shows warning banners for detected duplicate clients
 * - Exact match: RED banner (high severity)
 * - Similar company: YELLOW banner (medium severity)
 * - Existing contact: ORANGE banner (medium severity)
 */

const DuplicateWarning = ({
  duplicates,
  onViewExisting,
  onOverride,
  showOverrideButton = true
}) => {
  if (!duplicates) return null;

  const { exactMatch, similarCompanies, existingContact } = duplicates;

  const hasAnyDuplicate = exactMatch || (similarCompanies && similarCompanies.length > 0) || existingContact;

  if (!hasAnyDuplicate) return null;

  return (
    <div className="space-y-3 mb-6">
      {/* Exact Match - RED (Critical) */}
      {exactMatch && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-1">
                  ⚠️ Company Already Exists
                </h4>
                <p className="text-sm text-red-700 mb-2">
                  A client with the name <strong>"{exactMatch.companyName}"</strong> already exists in the system.
                </p>
                {exactMatch.address && (
                  <p className="text-xs text-red-600 mb-2">
                    Address: {exactMatch.address.city && `${exactMatch.address.city}, `}
                    {exactMatch.address.state}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Eye}
                    onClick={() => onViewExisting(exactMatch._id)}
                  >
                    View Existing Client
                  </Button>
                  {showOverrideButton && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onOverride}
                      className="text-red-700 hover:text-red-800 hover:bg-red-100"
                    >
                      Save as New Anyway
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar Companies - YELLOW (Warning) */}
      {similarCompanies && similarCompanies.length > 0 && !exactMatch && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                ⚠️ Similar Company Found
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                {similarCompanies.length > 1
                  ? `${similarCompanies.length} similar companies found. This might be a duplicate:`
                  : 'A similar company was found in the system:'}
              </p>

              {similarCompanies.map((similar, index) => (
                <div key={index} className="bg-white border border-yellow-200 rounded p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {similar.companyName}
                        <span className="ml-2 text-xs text-yellow-600 font-semibold">
                          {similar.similarity}% match
                        </span>
                      </p>
                      {similar.address && (
                        <p className="text-xs text-gray-600 mt-1">
                          {similar.address.city && `${similar.address.city}, `}
                          {similar.address.state}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Eye}
                      onClick={() => onViewExisting(similar._id)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}

              {showOverrideButton && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onOverride}
                    className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100"
                  >
                    Continue Anyway
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Contact - ORANGE (Warning) */}
      {existingContact && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-orange-800 mb-1">
                ⚠️ Contact Already Exists
              </h4>
              <p className="text-sm text-orange-700 mb-2">
                This {existingContact.matchType} already exists under a different company:
              </p>

              <div className="bg-white border border-orange-200 rounded p-3">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {existingContact.companyName}
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Contact:</strong> {existingContact.matchedContact.name}
                    {existingContact.matchedContact.designation && (
                      <span> ({existingContact.matchedContact.designation})</span>
                    )}
                  </p>
                  {existingContact.matchedContact.phone && (
                    <p><strong>Phone:</strong> {existingContact.matchedContact.phone}</p>
                  )}
                  {existingContact.matchedContact.email && (
                    <p><strong>Email:</strong> {existingContact.matchedContact.email}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Eye}
                  onClick={() => onViewExisting(existingContact._id)}
                >
                  View Existing Client
                </Button>
                {showOverrideButton && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onOverride}
                    className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
                  >
                    Save as New Anyway
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicateWarning;
