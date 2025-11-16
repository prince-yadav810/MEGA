const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Quotation PDF Generation Service
 * Generates professional PDF quotations with MEGA ENTERPRISE branding
 */

class QuotationPdfService {
  // Company constants
  static COMPANY_NAME = 'MEGA ENTERPRISE';
  static COMPANY_ADDRESS = '1ST LEVEL, PLOT NO PAP-57, MIDC WATER TANK, MIDC HINGNA, NAGPUR, MAHARASHTRA - 440028';
  static COMPANY_PHONE = '7506070157';
  static COMPANY_EMAIL = 'info@megaenterprise.com';
  static GST_NUMBER = '27DRGPD9065L1ZA';

  // Bank details
  static BANK_NAME = 'IDBI BANK';
  static ACCOUNT_NUMBER = '0047102000009430';
  static BRANCH = 'MIDC TALOJA';
  static IFSC_CODE = 'IBKL0000047';

  // Colors
  static PRIMARY_COLOR = '#4A628A';
  static SECONDARY_COLOR = '#7AB2D3';
  static TEXT_COLOR = '#333333';
  static LIGHT_GRAY = '#EEEEEE';

  /**
   * Generate quotation PDF
   * @param {Object} data - Quotation data
   * @param {string} outputPath - Path where PDF will be saved
   * @returns {Promise<string>} Path to generated PDF
   */
  static async generateQuotationPDF(data, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // Pipe to file
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        // Generate PDF content
        this.addHeader(doc, data);
        this.addQuotationDetails(doc, data);
        this.addItemsTable(doc, data);
        this.addCalculations(doc, data);
        this.addFooterSections(doc, data);
        this.addBottomFooter(doc);

        // Finalize PDF
        doc.end();

        writeStream.on('finish', () => {
          resolve(outputPath);
        });

        writeStream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header with logo and company details
   */
  static addHeader(doc, data) {
    const pageWidth = doc.page.width - 100;

    // Add logo if exists (try multiple locations)
    const logoPath = this.findLogo();
    if (logoPath) {
      try {
        doc.image(logoPath, 50, 50, { width: 60, height: 60 });
      } catch (error) {
        console.warn('Logo not found or invalid:', error.message);
      }
    }

    // Company name (large and bold)
    doc.fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text(this.COMPANY_NAME, 120, 50, { width: pageWidth - 70 });

    // Address
    doc.fontSize(8)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica')
      .text(this.COMPANY_ADDRESS, 120, 80, { width: pageWidth - 70, align: 'left' });

    // Contact info
    doc.fontSize(9)
      .font('Helvetica')
      .text(`Phone: ${this.COMPANY_PHONE} | Email: ${this.COMPANY_EMAIL}`, 120, 105);

    // Quotation title (centered)
    doc.fontSize(20)
      .fillColor(this.PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('QUOTATION', 50, 140, { width: pageWidth, align: 'center' });

    doc.moveDown(2);
  }

  /**
   * Find logo in various possible locations
   */
  static findLogo() {
    const possiblePaths = [
      path.join(__dirname, '../../../client/public/logo512.png'),
      path.join(__dirname, '../../../client/public/logo192.png'),
      path.join(__dirname, '../../../client/public/mega-logo.png'),
      path.join(__dirname, '../../uploads/logo.png')
    ];

    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        return logoPath;
      }
    }

    return null;
  }

  /**
   * Add quotation details (Ref No, Date, To)
   */
  static addQuotationDetails(doc, data) {
    const yPosition = 190;

    doc.fontSize(10)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica');

    // Ref No
    doc.font('Helvetica-Bold')
      .text('Ref No:', 50, yPosition)
      .font('Helvetica')
      .text(data.refNo, 110, yPosition);

    // Date
    const formattedDate = this.formatDate(data.date);
    doc.font('Helvetica-Bold')
      .text('Date:', 350, yPosition)
      .font('Helvetica')
      .text(formattedDate, 390, yPosition);

    // To (Client)
    doc.font('Helvetica-Bold')
      .text('To:', 50, yPosition + 20)
      .font('Helvetica')
      .text(data.clientName, 110, yPosition + 20);

    doc.moveDown(2);
  }

  /**
   * Add items table
   */
  static addItemsTable(doc, data) {
    const tableTop = 250;
    const tableLeft = 50;
    const pageWidth = doc.page.width - 100;

    // Column widths
    const columns = {
      srNo: { x: tableLeft, width: 30 },
      description: { x: tableLeft + 30, width: 180 },
      quantity: { x: tableLeft + 210, width: 40 },
      unit: { x: tableLeft + 250, width: 40 },
      rate: { x: tableLeft + 290, width: 60 },
      gst: { x: tableLeft + 350, width: 50 },
      amount: { x: tableLeft + 400, width: 95 }
    };

    // Table header background
    doc.rect(tableLeft, tableTop, pageWidth, 20)
      .fillColor(this.PRIMARY_COLOR)
      .fill();

    // Table headers
    doc.fontSize(9)
      .fillColor('white')
      .font('Helvetica-Bold');

    doc.text('Sr', columns.srNo.x + 5, tableTop + 6, { width: columns.srNo.width });
    doc.text('Description', columns.description.x + 5, tableTop + 6, { width: columns.description.width });
    doc.text('Qty', columns.quantity.x + 5, tableTop + 6, { width: columns.quantity.width });
    doc.text('Unit', columns.unit.x + 5, tableTop + 6, { width: columns.unit.width });
    doc.text('Rate', columns.rate.x + 5, tableTop + 6, { width: columns.rate.width });
    doc.text('GST%', columns.gst.x + 5, tableTop + 6, { width: columns.gst.width });
    doc.text('Amount', columns.amount.x + 5, tableTop + 6, { width: columns.amount.width, align: 'right' });

    // Table rows
    doc.fillColor(this.TEXT_COLOR)
      .font('Helvetica')
      .fontSize(8);

    let yPosition = tableTop + 25;
    const rowHeight = 20;

    data.items.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > doc.page.height - 200) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(tableLeft, yPosition - 2, pageWidth, rowHeight)
          .fillColor(this.LIGHT_GRAY)
          .fill();
        doc.fillColor(this.TEXT_COLOR);
      }

      // Row data
      doc.text(item.srNo, columns.srNo.x + 5, yPosition, { width: columns.srNo.width });
      doc.text(item.description, columns.description.x + 5, yPosition, { width: columns.description.width });
      doc.text(item.quantity, columns.quantity.x + 5, yPosition, { width: columns.quantity.width });
      doc.text(item.unit, columns.unit.x + 5, yPosition, { width: columns.unit.width });
      doc.text(this.formatCurrency(item.rate), columns.rate.x + 5, yPosition, { width: columns.rate.width });
      doc.text(`${item.gstPercent}%`, columns.gst.x + 5, yPosition, { width: columns.gst.width });
      doc.text(this.formatCurrency(item.amount), columns.amount.x + 5, yPosition, { width: columns.amount.width - 10, align: 'right' });

      yPosition += rowHeight;
    });

    // Bottom border
    doc.moveTo(tableLeft, yPosition)
      .lineTo(tableLeft + pageWidth, yPosition)
      .strokeColor(this.PRIMARY_COLOR)
      .lineWidth(1)
      .stroke();

    return yPosition + 10;
  }

  /**
   * Add calculations box (Subtotal, GST, Grand Total)
   */
  static addCalculations(doc, data) {
    const yPosition = doc.y + 20;
    const boxLeft = 350;
    const boxWidth = 195;

    doc.fontSize(10)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica');

    // Subtotal
    doc.text('Subtotal (Excl GST):', boxLeft, yPosition);
    doc.text(this.formatCurrency(data.subtotal), boxLeft + 100, yPosition, { width: 95, align: 'right' });

    // GST
    doc.text('GST @ 18%:', boxLeft, yPosition + 20);
    doc.text(this.formatCurrency(data.gst), boxLeft + 100, yPosition + 20, { width: 95, align: 'right' });

    // Separator line
    doc.moveTo(boxLeft, yPosition + 35)
      .lineTo(boxLeft + boxWidth, yPosition + 35)
      .strokeColor(this.TEXT_COLOR)
      .lineWidth(0.5)
      .stroke();

    // Grand Total
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(this.PRIMARY_COLOR);

    doc.text('GRAND TOTAL:', boxLeft, yPosition + 42);
    doc.text(this.formatCurrency(data.grandTotal), boxLeft + 100, yPosition + 42, { width: 95, align: 'right' });

    return yPosition + 70;
  }

  /**
   * Add footer sections (Bank Details, Terms, Signature)
   */
  static addFooterSections(doc, data) {
    const yStart = doc.y + 30;
    const pageWidth = doc.page.width - 100;

    doc.fontSize(9)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica');

    // Bank Details (Left)
    doc.font('Helvetica-Bold')
      .text('BANK DETAILS', 50, yStart);

    doc.font('Helvetica')
      .fontSize(8)
      .text(this.COMPANY_NAME, 50, yStart + 15)
      .text(`Bank Name: ${this.BANK_NAME}`, 50, yStart + 28)
      .text(`A/c No.: ${this.ACCOUNT_NUMBER}`, 50, yStart + 41)
      .text(`Branch: ${this.BRANCH}`, 50, yStart + 54)
      .text(`IFS Code: ${this.IFSC_CODE}`, 50, yStart + 67);

    // Terms & Conditions (Center)
    doc.font('Helvetica-Bold')
      .fontSize(9)
      .text('TERMS & CONDITION', 220, yStart, { width: 150, align: 'center' });

    doc.font('Helvetica')
      .fontSize(8)
      .text('• GST EXTRA AS APPLICABLE', 200, yStart + 15)
      .text(`• ${data.paymentTerms}`, 200, yStart + 28)
      .text(`• ${data.offerValidity}`, 200, yStart + 41)
      .text('• TRANSPORT EXTRA', 200, yStart + 54);

    // Signature (Right)
    doc.font('Helvetica-Bold')
      .fontSize(9)
      .text('For, Mega Enterprise.', 400, yStart);

    doc.font('Helvetica')
      .fontSize(8)
      .text('_____________________', 400, yStart + 50)
      .text('Authorised Signatory.', 400, yStart + 65);
  }

  /**
   * Add bottom footer with GST number and contact
   */
  static addBottomFooter(doc) {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const footerY = pageHeight - 60;

    // GST Number
    doc.fontSize(8)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica')
      .text(`GST NO: ${this.GST_NUMBER}`, 50, footerY, { align: 'center', width: pageWidth - 100 });

    // Separator line
    doc.moveTo(50, footerY + 15)
      .lineTo(pageWidth - 50, footerY + 15)
      .strokeColor(this.PRIMARY_COLOR)
      .lineWidth(1)
      .stroke();

    // Contact info
    doc.fontSize(8)
      .fillColor(this.TEXT_COLOR)
      .text(`Contact: 📞 ${this.COMPANY_PHONE} | 📧 ${this.COMPANY_EMAIL}`, 50, footerY + 20, { align: 'center', width: pageWidth - 100 });

    // Page number
    doc.text('Page 1 of 1', 50, footerY + 33, { align: 'center', width: pageWidth - 100 });
  }

  /**
   * Format currency in Indian Rupees
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

module.exports = QuotationPdfService;
