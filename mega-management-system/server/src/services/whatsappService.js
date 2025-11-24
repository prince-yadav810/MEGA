// File Path: server/src/services/whatsappService.js

const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'mock';
    this.client = null;
    this.fromNumber = null;
    this.companyName = process.env.COMPANY_NAME || 'MEGA Enterprises';
    
    this.initializeProvider();
  }

  /**
   * Initialize WhatsApp provider based on configuration
   */
  initializeProvider() {
    try {
      if (this.provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio Sandbox default
        
        if (!accountSid || !authToken) {
          console.warn('⚠️  Twilio credentials missing. Falling back to MOCK mode.');
          console.warn('   Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env file');
          this.provider = 'mock';
          return;
        }
        
        this.client = twilio(accountSid, authToken);
        console.log('✅ WhatsApp Service initialized with Twilio');
        console.log(`📱 Using WhatsApp number: ${this.fromNumber}`);
      } else if (this.provider === 'mock') {
        console.log('🧪 WhatsApp Service initialized in MOCK mode (messages will be logged, not sent)');
      } else {
        console.warn(`⚠️  Unknown provider: ${this.provider}. Using MOCK mode.`);
        this.provider = 'mock';
      }
    } catch (error) {
      console.error('❌ Error initializing WhatsApp service:', error.message);
      console.warn('⚠️  Falling back to MOCK mode');
      this.provider = 'mock';
    }
  }

  /**
   * Process message template with variables
   * @param {string} template - Message template with {{variables}}
   * @param {object} variables - Object with variable values
   * @returns {string} - Processed message
   */
  processTemplate(template, variables = {}) {
    let message = template;
    
    // Default variables
    const defaults = {
      companyName: this.companyName,
      companyPhone: process.env.COMPANY_PHONE || '',
      ...variables
    };
    
    // Replace all {{variable}} placeholders
    Object.keys(defaults).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      message = message.replace(regex, defaults[key] || '');
    });
    
    return message.trim();
  }

  /**
   * Format phone number for WhatsApp
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Formatted WhatsApp number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    // Remove all non-numeric characters
    let cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    
    // If number doesn't start with +, assume Indian number and add +91
    if (!cleanNumber.startsWith('+')) {
      // Remove leading 0 if present
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      }
      cleanNumber = '+91' + cleanNumber;
    }
    
    // For Twilio, format as whatsapp:+number
    if (this.provider === 'twilio') {
      return `whatsapp:${cleanNumber}`;
    }
    
    return cleanNumber;
  }

  /**
   * Send WhatsApp message
   * @param {object} options - Message options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.message - Message body
   * @param {string} options.clientName - Client name (for logging)
   * @returns {Promise<object>} - Send result
   */
  async sendMessage({ to, message, clientName = 'Client' }) {
    try {
      const formattedTo = this.formatPhoneNumber(to);
      
      if (this.provider === 'twilio') {
        return await this.sendTwilioMessage(formattedTo, message, clientName);
      } else if (this.provider === 'mock') {
        return this.sendMockMessage(formattedTo, message, clientName);
      }
      
      throw new Error(`Unsupported provider: ${this.provider}`);
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error.message);
      throw error;
    }
  }

  /**
   * Send message via Twilio
   */
  async sendTwilioMessage(to, message, clientName) {
    try {
      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: to,
        body: message
      });
      
      console.log(`✅ WhatsApp message sent to ${clientName} (${to})`);
      console.log(`   Message SID: ${result.sid}`);
      console.log(`   Status: ${result.status}`);
      
      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid,
        status: result.status,
        to: to,
        timestamp: new Date(),
        errorMessage: null
      };
    } catch (error) {
      console.error(`❌ Twilio error sending to ${clientName}:`, error.message);
      
      // Handle specific Twilio errors
      let errorMessage = error.message;
      if (error.code === 63007) {
        errorMessage = 'Recipient has not joined the Twilio Sandbox. They need to send "join [code]" first.';
      } else if (error.code === 21211) {
        errorMessage = 'Invalid phone number format.';
      } else if (error.code === 21608) {
        errorMessage = 'WhatsApp not enabled for this number.';
      }
      
      return {
        success: false,
        provider: 'twilio',
        messageId: null,
        status: 'failed',
        to: to,
        timestamp: new Date(),
        errorMessage: errorMessage
      };
    }
  }

  /**
   * Mock message sending (for testing without API)
   */
  sendMockMessage(to, message, clientName) {
    console.log('\n' + '='.repeat(70));
    console.log('📱 MOCK WHATSAPP MESSAGE');
    console.log('='.repeat(70));
    console.log(`To: ${clientName} (${to})`);
    console.log(`From: ${this.companyName}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('-'.repeat(70));
    console.log(message);
    console.log('='.repeat(70) + '\n');
    
    return {
      success: true,
      provider: 'mock',
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      to: to,
      timestamp: new Date(),
      errorMessage: null
    };
  }

  /**
   * Send payment reminder message
   * @param {object} reminderData - Payment reminder data
   * @returns {Promise<object>} - Send result
   */
  async sendPaymentReminder(reminderData) {
    const {
      client,
      contactPerson,
      messageTemplate,
      invoiceNumber,
      invoiceAmount,
      dueDate
    } = reminderData;

    // Determine which phone number to use (WhatsApp preferred)
    const phoneNumber = contactPerson.whatsappNumber || contactPerson.phone;

    if (!phoneNumber) {
      throw new Error('No phone number available for contact person');
    }

    // Process template with variables
    const variables = {
      clientName: client.companyName || 'Valued Client',
      contactName: contactPerson.name || 'Sir/Madam',
      invoiceNumber: invoiceNumber || 'N/A',
      invoiceAmount: (invoiceAmount !== undefined && invoiceAmount !== null && invoiceAmount !== '' && invoiceAmount !== 0)
        ? `₹${Number(invoiceAmount).toLocaleString('en-IN')}`
        : 'N/A',
      dueDate: dueDate ? new Date(dueDate).toLocaleDateString('en-IN') : 'N/A'
    };

    // Debug log to see what values are being used
    console.log('📝 Template variables:', {
      clientName: variables.clientName,
      contactName: variables.contactName,
      invoiceNumber: variables.invoiceNumber,
      invoiceAmount: variables.invoiceAmount,
      dueDate: variables.dueDate,
      rawInvoiceNumber: invoiceNumber,
      rawInvoiceAmount: invoiceAmount
    });

    const message = this.processTemplate(messageTemplate, variables);
    console.log('📨 Final message:', message);
    
    // Send message
    return await this.sendMessage({
      to: phoneNumber,
      message: message,
      clientName: client.companyName
    });
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      provider: this.provider,
      isActive: this.provider !== 'mock' && this.client !== null,
      isMockMode: this.provider === 'mock',
      fromNumber: this.fromNumber,
      companyName: this.companyName
    };
  }

  /**
   * Test connection by sending a test message
   * @param {string} testNumber - Phone number to send test message
   */
  async testConnection(testNumber) {
    const testMessage = `🧪 Test message from ${this.companyName}\n\nThis is a test of the WhatsApp integration. If you received this, the system is working correctly!\n\nTime: ${new Date().toLocaleString()}`;
    
    return await this.sendMessage({
      to: testNumber,
      message: testMessage,
      clientName: 'Test Recipient'
    });
  }
}

// Export singleton instance
module.exports = new WhatsAppService();


