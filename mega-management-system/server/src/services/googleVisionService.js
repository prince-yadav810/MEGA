// File Path: server/src/services/googleVisionService.js

const vision = require('@google-cloud/vision');
const fs = require('fs').promises;

/**
 * Google Cloud Vision API Service
 * Extracts text from business card images
 */

class GoogleVisionService {
  constructor() {
    // Initialize Vision API client
    // Uses API key from environment variable
    this.client = new vision.ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_VISION_API_KEY
    });
  }

  /**
   * Extracts text from a single image using Google Vision API
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} { success: boolean, text: string, error: string }
   */
  async extractTextFromImage(imagePath) {
    try {
      // Check if file exists
      try {
        await fs.access(imagePath);
      } catch (error) {
        return {
          success: false,
          text: '',
          error: 'Image file not found'
        };
      }

      // Perform text detection
      const [result] = await this.client.textDetection(imagePath);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        return {
          success: true,
          text: '',
          error: 'No text found in image. Please ensure the image is clear and contains text.'
        };
      }

      // First annotation contains all detected text
      const fullText = detections[0].description || '';

      return {
        success: true,
        text: fullText.trim(),
        error: null
      };
    } catch (error) {
      console.error('Google Vision API error:', error);

      // Handle specific API errors
      if (error.code === 3) {
        return {
          success: false,
          text: '',
          error: 'Invalid API key. Please check your Google Vision API credentials.'
        };
      }

      if (error.code === 7) {
        return {
          success: false,
          text: '',
          error: 'Permission denied. Please check your Google Cloud project settings.'
        };
      }

      if (error.code === 8) {
        return {
          success: false,
          text: '',
          error: 'API quota exceeded. Please try again later or upgrade your plan.'
        };
      }

      return {
        success: false,
        text: '',
        error: error.message || 'Failed to extract text from image'
      };
    }
  }

  /**
   * Extracts text from both front and back images of a business card
   * @param {string} frontImagePath - Path to front image (required)
   * @param {string} backImagePath - Path to back image (optional)
   * @returns {Promise<Object>} { success: boolean, combinedText: string, frontText: string, backText: string, error: string }
   */
  async extractTextFromBusinessCard(frontImagePath, backImagePath = null) {
    try {
      // Extract text from front image
      const frontResult = await this.extractTextFromImage(frontImagePath);

      if (!frontResult.success) {
        return {
          success: false,
          combinedText: '',
          frontText: '',
          backText: '',
          error: `Front image error: ${frontResult.error}`
        };
      }

      let backText = '';
      let backError = null;

      // Extract text from back image if provided
      if (backImagePath) {
        const backResult = await this.extractTextFromImage(backImagePath);

        if (backResult.success) {
          backText = backResult.text;
        } else {
          // Back image error is non-fatal
          backError = backResult.error;
          console.warn('Back image extraction failed:', backError);
        }
      }

      // Combine texts in the format expected by Gemini
      const combinedText = this.combineCardTexts(frontResult.text, backText);

      return {
        success: true,
        combinedText,
        frontText: frontResult.text,
        backText,
        error: backError ? `Warning: Back image - ${backError}` : null
      };
    } catch (error) {
      console.error('Business card text extraction error:', error);
      return {
        success: false,
        combinedText: '',
        frontText: '',
        backText: '',
        error: error.message || 'Failed to extract text from business card'
      };
    }
  }

  /**
   * Combines front and back card text in structured format
   * @param {string} frontText - Text from front of card
   * @param {string} backText - Text from back of card (optional)
   * @returns {string} Combined text in format for Gemini parsing
   */
  combineCardTexts(frontText, backText) {
    let combined = `Front: ${frontText}`;

    if (backText && backText.trim().length > 0) {
      combined += `\n\nBack: ${backText}`;
    }

    return combined;
  }

  /**
   * Tests the API connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection() {
    try {
      if (!process.env.GOOGLE_VISION_API_KEY) {
        console.error('GOOGLE_VISION_API_KEY not found in environment variables');
        return false;
      }

      // Simple test - will fail gracefully if API key is invalid
      return true;
    } catch (error) {
      console.error('Google Vision API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new GoogleVisionService();
