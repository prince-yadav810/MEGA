// File Path: server/src/services/duplicateDetectionService.js

const levenshtein = require('fast-levenshtein');
const Client = require('../models/Client');

/**
 * Duplicate Detection Service
 * Checks for existing clients using three methods:
 * 1. Exact company name match (case-insensitive)
 * 2. Fuzzy company name match (≥85% similarity using Levenshtein distance)
 * 3. Contact information match (phone/email in any client's contactPersons)
 */

class DuplicateDetectionService {
  constructor() {
    this.SIMILARITY_THRESHOLD = 0.85; // 85% similarity threshold
  }

  /**
   * Performs comprehensive duplicate detection
   * @param {Object} clientData - Client data to check for duplicates
   * @returns {Promise<Object>} { exactMatch, similarCompanies, existingContact }
   */
  async detectDuplicates(clientData) {
    try {
      const results = {
        exactMatch: null,
        similarCompanies: [],
        existingContact: null
      };

      // Get all active clients for comparison
      const allClients = await Client.find({ isActive: true });

      if (!clientData.companyName || allClients.length === 0) {
        return results;
      }

      // 1. Exact match detection
      results.exactMatch = this.findExactMatch(clientData.companyName, allClients);

      // 2. Fuzzy match detection (only if no exact match)
      if (!results.exactMatch) {
        results.similarCompanies = this.findSimilarCompanies(
          clientData.companyName,
          allClients
        );
      }

      // 3. Contact information match
      results.existingContact = await this.findExistingContact(
        clientData.contactPersons,
        allClients
      );

      return results;
    } catch (error) {
      console.error('Duplicate detection error:', error);
      // Return empty results on error, don't block the operation
      return {
        exactMatch: null,
        similarCompanies: [],
        existingContact: null
      };
    }
  }

  /**
   * Finds exact company name match (case-insensitive)
   * @param {string} companyName - Company name to search
   * @param {Array} clients - Array of client documents
   * @returns {Object|null} Matching client or null
   */
  findExactMatch(companyName, clients) {
    const normalizedName = this.normalizeCompanyName(companyName);

    const match = clients.find(client => {
      const clientNormalizedName = this.normalizeCompanyName(client.companyName);
      return clientNormalizedName === normalizedName;
    });

    if (match) {
      return {
        _id: match._id,
        companyName: match.companyName,
        address: match.address,
        contactPersons: match.contactPersons,
        businessType: match.businessType
      };
    }

    return null;
  }

  /**
   * Finds similar company names using Levenshtein distance
   * @param {string} companyName - Company name to search
   * @param {Array} clients - Array of client documents
   * @returns {Array} Array of similar companies with similarity scores
   */
  findSimilarCompanies(companyName, clients) {
    const normalizedName = this.normalizeCompanyName(companyName);
    const similarities = [];

    clients.forEach(client => {
      const clientNormalizedName = this.normalizeCompanyName(client.companyName);

      // Skip if exact match (already handled)
      if (clientNormalizedName === normalizedName) {
        return;
      }

      // Calculate similarity score
      const similarity = this.calculateSimilarity(normalizedName, clientNormalizedName);

      // Add to results if above threshold
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        similarities.push({
          _id: client._id,
          companyName: client.companyName,
          address: client.address,
          contactPersons: client.contactPersons,
          businessType: client.businessType,
          similarity: Math.round(similarity * 100) // Convert to percentage
        });
      }
    });

    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Return top 3 matches
    return similarities.slice(0, 3);
  }

  /**
   * Finds existing contact by phone or email
   * @param {Array} contactPersons - Array of contact persons to check
   * @param {Array} clients - Array of client documents
   * @returns {Object|null} Client with matching contact or null
   */
  async findExistingContact(contactPersons, clients) {
    if (!contactPersons || contactPersons.length === 0) {
      return null;
    }

    // Extract all phones and emails from input
    const inputPhones = contactPersons
      .map(c => this.normalizePhone(c.phone))
      .filter(p => p.length >= 10);

    const inputEmails = contactPersons
      .map(c => this.normalizeEmail(c.email))
      .filter(e => e.length > 0);

    if (inputPhones.length === 0 && inputEmails.length === 0) {
      return null;
    }

    // Search through all clients
    for (const client of clients) {
      if (!client.contactPersons || client.contactPersons.length === 0) {
        continue;
      }

      // Check each contact person in the client
      for (const contact of client.contactPersons) {
        // Check phone match
        if (contact.phone) {
          const normalizedPhone = this.normalizePhone(contact.phone);
          if (inputPhones.includes(normalizedPhone)) {
            return {
              _id: client._id,
              companyName: client.companyName,
              address: client.address,
              matchedContact: {
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                designation: contact.designation
              },
              matchType: 'phone'
            };
          }
        }

        // Check WhatsApp number match
        if (contact.whatsappNumber) {
          const normalizedWhatsApp = this.normalizePhone(contact.whatsappNumber);
          if (inputPhones.includes(normalizedWhatsApp)) {
            return {
              _id: client._id,
              companyName: client.companyName,
              address: client.address,
              matchedContact: {
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                designation: contact.designation
              },
              matchType: 'whatsapp'
            };
          }
        }

        // Check email match
        if (contact.email) {
          const normalizedEmail = this.normalizeEmail(contact.email);
          if (inputEmails.includes(normalizedEmail)) {
            return {
              _id: client._id,
              companyName: client.companyName,
              address: client.address,
              matchedContact: {
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                designation: contact.designation
              },
              matchType: 'email'
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Normalizes company name for comparison
   * @param {string} name - Company name
   * @returns {string} Normalized name
   */
  normalizeCompanyName(name) {
    if (!name) return '';

    return name
      .toLowerCase()
      .trim()
      // Remove common company suffixes
      .replace(/\b(pvt\.?|ltd\.?|limited|llp|inc\.?|corp\.?|co\.?)\b/gi, '')
      // Remove special characters
      .replace(/[^a-z0-9\s]/g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalizes phone number for comparison
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone (digits only)
   */
  normalizePhone(phone) {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Remove country code if present
    if (digits.length > 10 && digits.startsWith('91')) {
      return digits.slice(2);
    }

    // Return last 10 digits
    if (digits.length > 10) {
      return digits.slice(-10);
    }

    return digits;
  }

  /**
   * Normalizes email for comparison
   * @param {string} email - Email address
   * @returns {string} Normalized email (lowercase, trimmed)
   */
  normalizeEmail(email) {
    if (!email) return '';
    return email.toLowerCase().trim();
  }

  /**
   * Calculates similarity score using Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = levenshtein.get(str1, str2);
    const similarity = 1 - distance / maxLength;

    return similarity;
  }

  /**
   * Checks if duplicate detection should block the save operation
   * @param {Object} duplicates - Duplicate detection results
   * @returns {boolean} True if should require override confirmation
   */
  requiresOverride(duplicates) {
    return !!(
      duplicates.exactMatch ||
      (duplicates.similarCompanies && duplicates.similarCompanies.length > 0) ||
      duplicates.existingContact
    );
  }

  /**
   * Generates user-friendly duplicate warning messages
   * @param {Object} duplicates - Duplicate detection results
   * @returns {Array} Array of warning messages
   */
  generateWarningMessages(duplicates) {
    const messages = [];

    if (duplicates.exactMatch) {
      messages.push({
        type: 'error',
        severity: 'high',
        message: `A company with the name "${duplicates.exactMatch.companyName}" already exists in the system.`,
        client: duplicates.exactMatch
      });
    }

    if (duplicates.similarCompanies && duplicates.similarCompanies.length > 0) {
      duplicates.similarCompanies.forEach(similar => {
        messages.push({
          type: 'warning',
          severity: 'medium',
          message: `Similar company found: "${similar.companyName}" (${similar.similarity}% match)`,
          client: similar
        });
      });
    }

    if (duplicates.existingContact) {
      const matchType = duplicates.existingContact.matchType;
      const contact = duplicates.existingContact.matchedContact;
      messages.push({
        type: 'warning',
        severity: 'medium',
        message: `This ${matchType} already exists under "${duplicates.existingContact.companyName}" (Contact: ${contact.name})`,
        client: duplicates.existingContact
      });
    }

    return messages;
  }
}

// Export singleton instance
module.exports = new DuplicateDetectionService();
