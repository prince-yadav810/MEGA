// File Path: server/src/services/geminiService.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Google Gemini AI Service
 * Parses business card text into structured client data
 */

class GeminiService {
  constructor() {
    // Initialize Gemini API client
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using models/gemini-2.5-flash (free tier, fast, good for text parsing)
    // Note: Model names must include the "models/" prefix
    this.model = this.genAI.getGenerativeModel({
      model: 'models/gemini-2.5-flash'
    });
  }

  /**
   * Generates the structured prompt for Gemini to parse business card text
   * @param {string} cardText - Combined text from front and back of card
   * @returns {string} Formatted prompt for Gemini
   */
  generatePrompt(cardText) {
    return `You are a business card data extraction assistant. Extract information from the following business card text and return ONLY valid JSON with NO markdown, NO code blocks, NO backticks.

RULES:
1. Extract ALL phone numbers (mobile, office, landline) - clean format (remove spaces/dashes)
2. Extract ALL email addresses (lowercase)
3. Identify PRIMARY contact person (largest name or top designation)
4. Separate company info from personal contact info
5. Parse address into: street, city, state, pincode separately
6. If multiple people mentioned, include in contactPersons array
7. Mark most prominent person as isPrimary: true
8. If field uncertain, mark confidence as low

Business Card Text:
---
${cardText}
---

Return JSON in EXACT format:
{
  "companyName": "string",
  "businessType": "string or empty",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "India"
  },
  "companyWebsite": "string or empty",
  "contactPersons": [
    {
      "name": "string",
      "designation": "string",
      "phone": "string (10 digits cleaned)",
      "email": "string (lowercase)",
      "whatsappNumber": "string (same as phone if not specified)",
      "isPrimary": true
    }
  ],
  "notes": "any additional info (GST, certifications, etc)",
  "confidence": {
    "companyName": "high/medium/low",
    "address": "high/medium/low",
    "contactPersons": "high/medium/low"
  }
}

Confidence Rules:
- HIGH: Clear, unambiguous data
- MEDIUM: Data found but minor uncertainty
- LOW: Ambiguous or multiple interpretations

Return ONLY the JSON object, nothing else.`;
  }

  /**
   * Parses business card text into structured client data using Gemini
   * @param {string} cardText - Combined text from business card
   * @param {number} retryCount - Current retry attempt (max 1 retry)
   * @returns {Promise<Object>} { success: boolean, data: Object, confidence: Object, error: string }
   */
  async parseBusinessCardText(cardText, retryCount = 0) {
    try {
      if (!cardText || cardText.trim().length === 0) {
        return {
          success: false,
          data: null,
          confidence: null,
          error: 'No text provided for parsing'
        };
      }

      // Generate prompt
      const prompt = this.generatePrompt(cardText);

      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const parsedData = this.parseGeminiResponse(text);

      if (!parsedData.success) {
        // Retry once if parsing failed
        if (retryCount === 0) {
          console.warn('First parsing attempt failed, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return this.parseBusinessCardText(cardText, 1);
        }

        return {
          success: false,
          data: null,
          confidence: null,
          error: parsedData.error,
          rawText: cardText // Return raw text for manual entry fallback
        };
      }

      // Validate and clean the parsed data
      const validatedData = this.validateAndCleanData(parsedData.data);

      return {
        success: true,
        data: validatedData.data,
        confidence: validatedData.confidence,
        error: null
      };
    } catch (error) {
      console.error('Gemini API error:', error);

      // Handle API errors
      if (error.message && error.message.includes('API key')) {
        return {
          success: false,
          data: null,
          confidence: null,
          error: 'Invalid Gemini API key. Please check your configuration.'
        };
      }

      if (error.message && error.message.includes('quota')) {
        return {
          success: false,
          data: null,
          confidence: null,
          error: 'Gemini API quota exceeded. Please try again later.'
        };
      }

      // Retry once on network/temporary errors
      if (retryCount === 0) {
        console.warn('Gemini API call failed, retrying...', error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.parseBusinessCardText(cardText, 1);
      }

      return {
        success: false,
        data: null,
        confidence: null,
        error: error.message || 'Failed to parse business card text',
        rawText: cardText
      };
    }
  }

  /**
   * Parses and cleans Gemini's JSON response
   * @param {string} responseText - Raw response from Gemini
   * @returns {Object} { success: boolean, data: Object, error: string }
   */
  parseGeminiResponse(responseText) {
    try {
      // Remove markdown code blocks if present
      let cleanText = responseText.trim();

      // Remove ```json and ``` markers
      cleanText = cleanText.replace(/```json\s*/gi, '');
      cleanText = cleanText.replace(/```\s*/g, '');

      // Remove any leading/trailing whitespace
      cleanText = cleanText.trim();

      // Parse JSON
      const parsed = JSON.parse(cleanText);

      // Basic validation
      if (!parsed.companyName || !parsed.contactPersons || !Array.isArray(parsed.contactPersons)) {
        return {
          success: false,
          data: null,
          error: 'Invalid data structure: missing required fields'
        };
      }

      return {
        success: true,
        data: parsed,
        error: null
      };
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Raw response:', responseText);

      return {
        success: false,
        data: null,
        error: 'Failed to parse AI response as JSON. The AI may have returned malformed data.'
      };
    }
  }

  /**
   * Validates and cleans the parsed data
   * @param {Object} data - Parsed data from Gemini
   * @returns {Object} { data: Object, confidence: Object }
   */
  validateAndCleanData(data) {
    // Ensure required fields exist
    const cleanData = {
      companyName: data.companyName || '',
      businessType: data.businessType || '',
      address: {
        street: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        pincode: data.address?.pincode || '',
        country: data.address?.country || 'India'
      },
      companyWebsite: data.companyWebsite || '',
      contactPersons: [],
      notes: data.notes || ''
    };

    // Clean and validate contact persons
    if (data.contactPersons && Array.isArray(data.contactPersons)) {
      cleanData.contactPersons = data.contactPersons.map((contact, index) => ({
        name: contact.name || '',
        designation: contact.designation || '',
        phone: this.cleanPhoneNumber(contact.phone),
        email: this.cleanEmail(contact.email),
        whatsappNumber: this.cleanPhoneNumber(contact.whatsappNumber || contact.phone),
        isPrimary: index === 0 ? true : (contact.isPrimary || false)
      }));

      // Ensure at least one primary contact
      const hasPrimary = cleanData.contactPersons.some(c => c.isPrimary);
      if (!hasPrimary && cleanData.contactPersons.length > 0) {
        cleanData.contactPersons[0].isPrimary = true;
      }
    }

    // If no contact persons found, create an empty one
    if (cleanData.contactPersons.length === 0) {
      cleanData.contactPersons.push({
        name: '',
        designation: '',
        phone: '',
        email: '',
        whatsappNumber: '',
        isPrimary: true
      });
    }

    // Extract confidence scores
    const confidence = {
      companyName: this.normalizeConfidence(data.confidence?.companyName),
      address: this.normalizeConfidence(data.confidence?.address),
      contactPersons: this.normalizeConfidence(data.confidence?.contactPersons)
    };

    return { data: cleanData, confidence };
  }

  /**
   * Cleans phone number to 10-digit format
   * @param {string} phone - Phone number string
   * @returns {string} Cleaned phone number
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If starts with country code (91 for India), remove it
    if (digits.length > 10 && digits.startsWith('91')) {
      return digits.slice(2);
    }

    // Return last 10 digits if longer
    if (digits.length > 10) {
      return digits.slice(-10);
    }

    return digits;
  }

  /**
   * Cleans email address
   * @param {string} email - Email address string
   * @returns {string} Cleaned email in lowercase
   */
  cleanEmail(email) {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  /**
   * Normalizes confidence level to high/medium/low
   * @param {string} confidence - Raw confidence value
   * @returns {string} Normalized confidence level
   */
  normalizeConfidence(confidence) {
    if (!confidence) return 'low';

    const normalized = confidence.toLowerCase();
    if (['high', 'medium', 'low'].includes(normalized)) {
      return normalized;
    }

    return 'low';
  }

  /**
   * Tests the API connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not found in environment variables');
        return false;
      }

      // Simple test prompt
      const result = await this.model.generateContent('Hello');
      const response = await result.response;

      return response.text().length > 0;
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new GeminiService();
