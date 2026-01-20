// File Path: server/src/services/geminiService.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Google Gemini AI Service
 * Parses business card text into structured client data
 * 
 * Robustness features:
 * - 2-tier model fallback chain (optimized for cost)
 * - Fast retry with short delays (2 attempts, 500ms/1s)
 * - 10 second request timeout
 * - Graceful degradation with raw text
 */

class GeminiService {
  constructor() {
    // Initialize Gemini API client
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Model fallback chain (in order of preference)
    // Reduced to 2 models for faster fallback and lower costs
    this.modelFallbackChain = [
      'gemini-2.0-flash',       // Primary: Fast, cheap, current
      'gemini-1.5-flash'        // Fallback: Stable alternative
    ];

    // Request timeout in milliseconds (10 seconds)
    this.REQUEST_TIMEOUT = 10000;

    // Current model index (starts with primary)
    this.currentModelIndex = 0;

    // Initialize with primary model
    this.model = this.genAI.getGenerativeModel({
      model: this.modelFallbackChain[0]
    });

    // Track which models are available (populated on first use)
    this.availableModels = null;
  }

  /**
   * Get the next available model in the fallback chain
   * @returns {Object|null} Model instance or null if no more fallbacks
   */
  getNextFallbackModel() {
    this.currentModelIndex++;
    if (this.currentModelIndex >= this.modelFallbackChain.length) {
      this.currentModelIndex = 0; // Reset for next request
      return null;
    }

    const modelName = this.modelFallbackChain[this.currentModelIndex];
    console.log(`⚠️ Trying fallback model: ${modelName}`);

    return this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Reset model to primary for next request
   */
  resetToDefaultModel() {
    this.currentModelIndex = 0;
    this.model = this.genAI.getGenerativeModel({
      model: this.modelFallbackChain[0]
    });
  }

  /**
   * Sleep utility for exponential backoff
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable (transient)
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    const message = error.message?.toLowerCase() || '';

    // NOT retryable - fail fast on these
    if (message.includes('api key') || message.includes('invalid')) return false;
    if (message.includes('quota exceeded') && !message.includes('per minute')) return false;
    if (message.includes('permission denied')) return false;

    // Retryable - transient errors
    if (message.includes('timeout')) return true;
    if (message.includes('network')) return true;
    if (message.includes('econnreset')) return true;
    if (message.includes('503')) return true;
    if (message.includes('500')) return true;
    if (message.includes('per minute')) return true; // Rate limit per minute is retryable
    if (error.code === 'ETIMEDOUT') return true;
    if (error.code === 'ECONNRESET') return true;

    return false;
  }

  /**
   * Check if error suggests trying a different model
   * @param {Error} error - The error to check
   * @returns {boolean} True if should try fallback model
   */
  shouldTryFallbackModel(error) {
    const message = error.message?.toLowerCase() || '';
    return message.includes('not found') ||
      message.includes('404') ||
      message.includes('model') ||
      message.includes('deprecated');
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
8. Detect client type based on keywords:
   - SUPPLIER indicators: "Manufacturer", "Supplier", "Wholesaler", "Distributor", "Factory", "Producer", "Vendor"
   - BUYER indicators: "Retailer", "Dealer", "Shop", "Store", "Purchaser", "Client"
   - If unclear or could be both, use "both"
9. Extract products/services/items mentioned (as array): Look for specific products, materials, services offered/needed
10. If field uncertain, mark confidence as low

Business Card Text:
---
${cardText}
---

Return JSON in EXACT format:
{
  "companyName": "string",
  "businessType": "string or empty",
  "clientType": "supplier or buyer or both",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "India"
  },
  "companyWebsite": "string or empty",
  "products": ["array of products/services/items mentioned"],
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
    "clientType": "high/medium/low",
    "products": "high/medium/low",
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
   * Features:
   * - Exponential backoff retry (3 attempts: 1s, 2s, 4s)
   * - Model fallback chain on model errors
   * - Graceful degradation with raw text
   * 
   * @param {string} cardText - Combined text from business card
   * @param {number} retryCount - Current retry attempt (max 3)
   * @param {Object} currentModel - Model to use (for fallback)
   * @returns {Promise<Object>} { success: boolean, data: Object, confidence: Object, error: string }
   */
  async parseBusinessCardText(cardText, retryCount = 0, currentModel = null) {
    const MAX_RETRIES = 2; // Reduced from 3 for faster response
    const model = currentModel || this.model;

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

      // Call Gemini API with timeout
      console.log(`🤖 Calling Gemini API (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

      // Add timeout to prevent long-running requests (reduces Cloud Run costs)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 10s')), this.REQUEST_TIMEOUT)
      );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const parsedData = this.parseGeminiResponse(text);

      if (!parsedData.success) {
        // Retry with exponential backoff if parsing failed
        if (retryCount < MAX_RETRIES - 1) {
          const delay = (retryCount + 1) * 500; // 500ms, 1s (faster retries)
          console.warn(`⚠️ Parsing attempt ${retryCount + 1} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.parseBusinessCardText(cardText, retryCount + 1, model);
        }

        // All retries failed - return with raw text for manual entry
        console.error('❌ All parsing attempts failed');
        this.resetToDefaultModel();
        return {
          success: false,
          data: null,
          confidence: null,
          error: parsedData.error,
          rawText: cardText,
          fallbackToManual: true
        };
      }

      // Success! Validate and clean the parsed data
      const validatedData = this.validateAndCleanData(parsedData.data);
      console.log('✅ Business card parsed successfully');
      this.resetToDefaultModel();

      return {
        success: true,
        data: validatedData.data,
        confidence: validatedData.confidence,
        error: null
      };
    } catch (error) {
      console.error(`❌ Gemini API error (attempt ${retryCount + 1}):`, error.message);

      // Handle non-retryable errors immediately
      if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
        this.resetToDefaultModel();
        return {
          success: false,
          data: null,
          confidence: null,
          error: 'Invalid Gemini API key. Please check your configuration.',
          rawText: cardText,
          fallbackToManual: true
        };
      }

      if (error.message?.includes('quota') && !error.message?.includes('per minute')) {
        this.resetToDefaultModel();
        return {
          success: false,
          data: null,
          confidence: null,
          error: 'Gemini API quota exceeded. Please try again later or upgrade your plan.',
          rawText: cardText,
          fallbackToManual: true
        };
      }

      // Try fallback model if current model not found
      if (this.shouldTryFallbackModel(error)) {
        const fallbackModel = this.getNextFallbackModel();
        if (fallbackModel) {
          console.log('🔄 Trying fallback model...');
          return this.parseBusinessCardText(cardText, 0, fallbackModel);
        }
      }

      // Retry with exponential backoff for transient errors
      if (this.isRetryableError(error) && retryCount < MAX_RETRIES - 1) {
        const delay = (retryCount + 1) * 500; // 500ms, 1s (faster retries)
        console.warn(`⚠️ Retryable error, waiting ${delay}ms before retry...`);
        await this.sleep(delay);
        return this.parseBusinessCardText(cardText, retryCount + 1, model);
      }

      // All retries exhausted
      console.error('❌ All retry attempts exhausted');
      this.resetToDefaultModel();
      return {
        success: false,
        data: null,
        confidence: null,
        error: error.message || 'Failed to parse business card text',
        rawText: cardText,
        fallbackToManual: true,
        suggestion: 'AI parsing failed. You can use the extracted text for manual entry.'
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
      clientType: this.normalizeClientType(data.clientType),
      address: {
        street: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        pincode: data.address?.pincode || '',
        country: data.address?.country || 'India'
      },
      companyWebsite: data.companyWebsite || '',
      products: Array.isArray(data.products) ? data.products.filter(p => p && p.trim()) : [],
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
      clientType: this.normalizeConfidence(data.confidence?.clientType),
      products: this.normalizeConfidence(data.confidence?.products),
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
   * Normalizes client type to supplier/buyer/both
   * @param {string} clientType - Raw client type value
   * @returns {string} Normalized client type
   */
  normalizeClientType(clientType) {
    if (!clientType) return 'both';

    const normalized = clientType.toLowerCase().trim();
    if (['supplier', 'buyer', 'both'].includes(normalized)) {
      return normalized;
    }

    // Default to 'both' if unrecognized
    return 'both';
  }

  /**
   * Tests the API connection and finds available models
   * @returns {Promise<Object>} { connected: boolean, availableModels: string[], error: string }
   */
  async testConnection() {
    const results = {
      connected: false,
      availableModels: [],
      testedModels: {},
      error: null
    };

    try {
      if (!process.env.GEMINI_API_KEY) {
        results.error = 'GEMINI_API_KEY not found in environment variables';
        console.error('❌', results.error);
        return results;
      }

      console.log('🔍 Testing Gemini API connection (quick test)...');

      // Only test primary model for faster startup (reduces cold start time)
      const primaryModel = this.modelFallbackChain[0];
      try {
        const testModel = this.genAI.getGenerativeModel({ model: primaryModel });

        // Use timeout for connection test too
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        );

        const result = await Promise.race([
          testModel.generateContent('Hi'),
          timeoutPromise
        ]);
        const response = await result.response;

        if (response.text().length > 0) {
          results.testedModels[primaryModel] = 'available';
          results.availableModels.push(primaryModel);
          // Assume fallback model is also available if primary works
          results.availableModels.push(this.modelFallbackChain[1]);
          console.log(`  ✅ ${primaryModel}: Available`);
        }
      } catch (modelError) {
        if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
          results.testedModels[primaryModel] = 'not_found';
          console.log(`  ⚠️ ${primaryModel}: Not found`);
        } else if (modelError.message?.includes('quota') || modelError.message?.includes('429')) {
          results.testedModels[primaryModel] = 'quota_exceeded';
          results.availableModels.push(primaryModel);
          console.log(`  ⚠️ ${primaryModel}: Available (quota limited)`);
        } else {
          results.testedModels[primaryModel] = 'error';
          console.log(`  ❌ ${primaryModel}: Error - ${modelError.message}`);
        }
      }

      results.connected = results.availableModels.length > 0;
      this.availableModels = results.availableModels;

      if (results.connected) {
        console.log(`\n✅ Gemini API connected. Available models: ${results.availableModels.join(', ')}`);
      } else {
        results.error = 'No Gemini models available. Check your API key and quota.';
        console.error('\n❌', results.error);
      }

      return results;
    } catch (error) {
      results.error = error.message;
      console.error('❌ Gemini API connection test failed:', error.message);
      return results;
    }
  }

  /**
   * Get list of available models (from last test)
   * @returns {string[]} Array of available model names
   */
  getAvailableModels() {
    return this.availableModels || [];
  }
}

// Export singleton instance
module.exports = new GeminiService();
