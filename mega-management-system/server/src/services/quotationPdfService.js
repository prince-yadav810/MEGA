const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
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
  static PRIMARY_COLOR = '#2c5282';
  static SECONDARY_COLOR = '#1a365d';
  static TEXT_COLOR = '#333333';
  static LIGHT_GRAY = '#EEEEEE';
  static HEADER_DARK = '#1a365d';
  static HEADER_LIGHT = '#2c5282';

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
          },
          bufferPages: true // Enable page buffering for better control
        });

        // Pipe to file
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        // Generate PDF content with automatic page breaks
        this.addHeader(doc, data);
        this.addQuotationDetails(doc, data);
        const tableEndY = this.addItemsTable(doc, data);
        const calcEndY = this.addCalculations(doc, data, tableEndY);
        this.addFooterSections(doc, data, calcEndY);
        this.addBottomFooter(doc);

        // Finalize PDF
        doc.end();

        writeStream.on('finish', async () => {
          try {
            // Post-process PDF to remove blank pages
            const pdfBytes = fs.readFileSync(outputPath);
            const pdfDoc = await PDFLibDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();
            
            // Find and remove blank pages (pages with only footer, minimal content)
            const pagesToRemove = [];
            
            // Check each page (except first) to see if it's blank
            for (let i = pages.length - 1; i >= 1; i--) {
              try {
                const page = pages[i];
                const contentStream = page.node.get('Contents');
                
                // Check if page has substantial content
                // A blank page would have minimal content (just footer)
                let isBlank = false;
                
                if (contentStream) {
                  // Check content stream size/length
                  // If it's an array (multiple content streams), check length
                  if (Array.isArray(contentStream)) {
                    // If only 1-2 content streams, might be just footer
                    // But be conservative - only mark as blank if we're very sure
                    if (contentStream.length <= 1) {
                      // Might be blank, but let's check the actual content
                      // For now, we'll be conservative and not remove
                      isBlank = false;
                    }
                  } else {
                    // Single content stream - check if it's minimal
                    // This is harder to determine, so we'll be conservative
                    isBlank = false;
                  }
                } else {
                  // No content stream - definitely blank
                  isBlank = true;
                }
                
                // Only remove if we're confident it's blank
                // And only remove from the end (last pages that are likely blank)
                if (isBlank && i === pages.length - 1) {
                  // Only remove last page if it's clearly blank
                  pagesToRemove.push(i);
                }
              } catch (error) {
                // If we can't check, keep the page to be safe
                continue;
              }
            }
            
            // Remove pages in reverse order (to maintain indices)
            pagesToRemove.sort((a, b) => b - a).forEach(pageIndex => {
              try {
                pdfDoc.removePage(pageIndex);
              } catch (error) {
                // Ignore errors when removing pages
              }
            });
            
            // Save the cleaned PDF
            const cleanedPdfBytes = await pdfDoc.save();
            fs.writeFileSync(outputPath, cleanedPdfBytes);
            
            resolve(outputPath);
          } catch (error) {
            // If post-processing fails, still resolve with original PDF
            console.error('Error removing blank pages:', error);
            resolve(outputPath);
          }
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
   * Add header with gradient background and diagonal clip
   */
  static addHeader(doc, data) {
    const pageWidth = doc.page.width;
    const headerHeight = 120;

    // Draw gradient-like effect with two overlapping shapes
    doc.save();
    // Darker bottom layer
    doc.moveTo(0, 0)
      .lineTo(pageWidth, 0)
      .lineTo(pageWidth, headerHeight - 20)
      .lineTo(0, headerHeight)
      .closePath()
      .fillColor(this.HEADER_DARK)
      .fill();

    // Lighter gradient overlay (top portion)
    doc.moveTo(0, 0)
      .lineTo(pageWidth, 0)
      .lineTo(pageWidth, headerHeight - 50)
      .lineTo(0, headerHeight - 30)
      .closePath()
      .fillColor(this.HEADER_LIGHT)
      .fillOpacity(0.3)
      .fill();
    doc.fillOpacity(1); // Reset opacity
    doc.restore();

    // Add decorative stars (small white circles)
    const stars = [
      { x: 60, y: 20, r: 1.5 },
      { x: 150, y: 30, r: 1 },
      { x: 90, y: 45, r: 2 },
      { x: 240, y: 25, r: 1.2 },
      { x: 200, y: 50, r: 1.8 },
      { x: 320, y: 35, r: 1 },
      { x: 380, y: 22, r: 1.5 },
      { x: 420, y: 48, r: 1.2 },
      { x: 480, y: 28, r: 2 },
      { x: 520, y: 40, r: 1 },
      { x: 550, y: 18, r: 1.5 },
      { x: 100, y: 65, r: 0.8 }
    ];

    stars.forEach(star => {
      doc.circle(star.x, star.y, star.r)
        .fillColor('white')
        .fillOpacity(0.4)
        .fill();
    });
    doc.fillOpacity(1); // Reset opacity

    // Add logo at leftmost position (rounded square, not circular)
    const logoPath = this.findLogo();
    const logoSize = 70; // Logo size in points (made bigger)
    const logoX = 7; // Leftmost position
    const logoY = 32; // Moved lower (was 15)
    const logoCornerRadius = 8; // Rounded corner radius for square logo
    
    if (logoPath) {
      // Create rounded rectangle with all corners properly rounded
      doc.save();
      const r = logoCornerRadius;
      const x = logoX;
      const y = logoY;
      const w = logoSize;
      const h = logoSize;
      
      // Create a proper rounded rectangle clipping path
      // This ensures all 4 corners (including bottom corners) are rounded
      doc
        .moveTo(x + r, y)                    // Start just after top-left curve
        .lineTo(x + w - r, y)                // Top edge
        .quadraticCurveTo(x + w, y, x + w, y + r)  // Top-right corner
        .lineTo(x + w, y + h - r)            // Right edge
        .quadraticCurveTo(x + w, y + h, x + w - r, y + h)  // Bottom-right corner
        .lineTo(x + r, y + h)                // Bottom edge
        .quadraticCurveTo(x, y + h, x, y + h - r)  // Bottom-left corner
        .lineTo(x, y + r)                    // Left edge
        .quadraticCurveTo(x, y, x + r, y)    // Top-left corner
        .closePath()                         // Close the path
        .clip();                             // Apply clipping
      
      // Draw the logo image - it will be clipped to the rounded rectangle
      doc.image(logoPath, logoX, logoY, {
        width: logoSize,
        height: logoSize,
        fit: [logoSize, logoSize]
      });
      
      doc.restore();
    }

    // Company name (white text on dark background) - positioned after logo with proper spacing
    const companyNameX = logoPath ? logoSize + 15 : 50; // Ensure no overlap with logo
    const companyNameY = logoPath ? 39 : 35; // Moved up a bit (was 50)
    doc.fontSize(28)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text(this.COMPANY_NAME, companyNameX, companyNameY, { characterSpacing: 2, lineBreak: false });

    // Company tagline - positioned after logo to avoid overlap
    const taglineX = logoPath ? logoSize + 15 : 50;
    doc.fontSize(12)
      .fillColor('white')
      .font('Helvetica')
      .fillOpacity(0.9)
      .text('Reach For Everything You Need', taglineX, 68, { characterSpacing: 1, lineBreak: false });
    doc.fillOpacity(1);

    // Contact info in header - positioned after logo to avoid overlap
    const addressX = logoPath ? logoSize + 15 : 50;
    doc.fontSize(10)
      .fillColor('white')
      .fillOpacity(0.95)
      .text(`${this.COMPANY_ADDRESS}`, addressX, 88, { lineBreak: false });
    doc.fillOpacity(1);

    // Quotation title (below header, styled)
    const titleY = headerHeight + 25;
    doc.fontSize(28)
      .fillColor(this.PRIMARY_COLOR)
      .font('Helvetica')
      .text('QUOTATION', 50, titleY, { width: pageWidth - 100, align: 'center', characterSpacing: 2, lineBreak: false });

    // Underline for title
    const titleWidth = 120;
    const centerX = pageWidth / 2;
    doc.moveTo(centerX - titleWidth / 2, titleY + 32)
      .lineTo(centerX + titleWidth / 2, titleY + 32)
      .strokeColor(this.PRIMARY_COLOR)
      .lineWidth(3)
      .stroke();
  }

  /**
   * Find logo in various possible locations
   */
  static findLogo() {
    const possiblePaths = [
      // Priority: MEGA Enterprise logo in uploads directory
      path.join(__dirname, '../../uploads/mega-logo.png'),
      path.join(__dirname, '../../uploads/logo.png'),
      path.join(__dirname, '../../../client/public/mega-logo.png'),
      path.join(__dirname, '../../../client/public/logo512.png'),
      path.join(__dirname, '../../../client/public/logo192.png')
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
    const yPosition = 200;
    const pageWidth = doc.page.width;

    // Info box with subtle background
    doc.rect(50, yPosition - 5, pageWidth - 100, 50)
      .fillColor('#f8f9fa')
      .fill();

    doc.fontSize(11)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica');

    // Ref No
    doc.fontSize(9)
      .fillColor('#666666')
      .text('REF NO.', 60, yPosition, { lineBreak: false });
    doc.fontSize(12)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica-Bold')
      .text(data.refNo, 60, yPosition + 12, { lineBreak: false });

    // Date (positioned more to the right)
    const formattedDate = this.formatDate(data.date);
    doc.fontSize(9)
      .fillColor('#666666')
      .font('Helvetica')
      .text('DATE', pageWidth - 150, yPosition, { lineBreak: false });
    doc.fontSize(12)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica-Bold')
      .text(formattedDate, pageWidth - 150, yPosition + 12, { lineBreak: false });

    // To (Client) - with styled label
    doc.fontSize(10)
      .fillColor(this.PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('TO:', 60, yPosition + 35, { lineBreak: false });
    doc.fontSize(12)
      .fillColor(this.TEXT_COLOR)
      .text(data.clientName, 85, yPosition + 35, { lineBreak: false });
  }

  /**
   * Add items table
   */
  static addItemsTable(doc, data) {
    const tableTop = 270;
    const tableLeft = 50;
    const pageWidth = doc.page.width - 100;
    const headerHeight = 28;
    const rowHeight = 23;

    // Column widths (adjusted for better Amount column padding)
    const columns = {
      srNo: { x: tableLeft, width: 35 },
      description: { x: tableLeft + 35, width: 175 },
      quantity: { x: tableLeft + 210, width: 45 },
      unit: { x: tableLeft + 255, width: 45 },
      rate: { x: tableLeft + 300, width: 65 },
      gst: { x: tableLeft + 365, width: 45 },
      amount: { x: tableLeft + 410, width: 85 }
    };

    // Table header background (simple, no gradient)
    doc.rect(tableLeft, tableTop, pageWidth, headerHeight)
      .fillColor(this.HEADER_DARK)
      .fill();

    // Table headers with uppercase and letter spacing
    doc.fontSize(10)
      .fillColor('white')
      .font('Helvetica-Bold');

    const headerY = tableTop + 9;
    doc.text('SR', columns.srNo.x + 10, headerY, { width: columns.srNo.width, characterSpacing: 0.5, lineBreak: false });
    doc.text('DESCRIPTION', columns.description.x + 10, headerY, { width: columns.description.width, characterSpacing: 0.5, lineBreak: false });
    doc.text('QTY', columns.quantity.x + 10, headerY, { width: columns.quantity.width, characterSpacing: 0.5, lineBreak: false });
    doc.text('UNIT', columns.unit.x + 10, headerY, { width: columns.unit.width, characterSpacing: 0.5, lineBreak: false });
    doc.text('RATE', columns.rate.x + 10, headerY, { width: columns.rate.width, characterSpacing: 0.5, lineBreak: false });
    doc.text('GST%', columns.gst.x + 10, headerY, { width: columns.gst.width, characterSpacing: 0.5, lineBreak: false });
    doc.text('AMOUNT', columns.amount.x + 5, headerY, { width: columns.amount.width - 15, align: 'right', characterSpacing: 0.5, lineBreak: false });

    // Table rows with alternating colors (gray and white like Excel)
    let yPosition = tableTop + headerHeight;
    const pageHeight = doc.page.height;
    const footerSpace = 180; // Space needed for calculations and footer sections
    const minSpaceForRow = 30; // Minimum space needed for a row

    // Set font properties for height calculation
    doc.font('Helvetica')
      .fontSize(10);

    data.items.forEach((item, index) => {
      // Check if we need a new page before adding this row
      if (yPosition + minSpaceForRow > pageHeight - footerSpace) {
        // Add new page
        doc.addPage();
        yPosition = 50; // Start from top margin
        
        // Redraw table header on new page
        doc.rect(tableLeft, yPosition, pageWidth, headerHeight)
          .fillColor(this.HEADER_DARK)
          .fill();
        
        doc.fontSize(10)
          .fillColor('white')
          .font('Helvetica-Bold');
        
        const headerY = yPosition + 9;
        doc.text('SR', columns.srNo.x + 10, headerY, { width: columns.srNo.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('DESCRIPTION', columns.description.x + 10, headerY, { width: columns.description.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('QTY', columns.quantity.x + 10, headerY, { width: columns.quantity.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('UNIT', columns.unit.x + 10, headerY, { width: columns.unit.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('RATE', columns.rate.x + 10, headerY, { width: columns.rate.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('GST%', columns.gst.x + 10, headerY, { width: columns.gst.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('AMOUNT', columns.amount.x + 5, headerY, { width: columns.amount.width - 15, align: 'right', characterSpacing: 0.5, lineBreak: false });
        
        yPosition += headerHeight;
      }

      // Calculate the height needed for each cell's text
      const cellPadding = 8; // Top and bottom padding
      const minRowHeight = 23; // Minimum row height
      
      // Calculate text heights for each cell (allowing text to wrap)
      const srNoHeight = doc.heightOfString((index + 1).toString(), { width: columns.srNo.width });
      const descriptionHeight = doc.heightOfString(item.description || '', { width: columns.description.width - 10 });
      const quantityHeight = doc.heightOfString(item.quantity.toString(), { width: columns.quantity.width });
      const unitHeight = doc.heightOfString(item.unit || '', { width: columns.unit.width });
      const rateHeight = doc.heightOfString(this.formatCurrency(item.rate), { width: columns.rate.width });
      const gstHeight = doc.heightOfString(`${item.gstPercent}%`, { width: columns.gst.width });
      const amountHeight = doc.heightOfString(this.formatCurrency(item.amount), { width: columns.amount.width - 15 });
      
      // Find the maximum height among all cells in this row
      const maxCellHeight = Math.max(
        srNoHeight,
        descriptionHeight,
        quantityHeight,
        unitHeight,
        rateHeight,
        gstHeight,
        amountHeight,
        minRowHeight - (cellPadding * 2) // Ensure at least minimum height
      );
      
      // Calculate actual row height (max cell height + padding)
      const actualRowHeight = Math.max(maxCellHeight + (cellPadding * 2), minRowHeight);

      // Check if this row would overflow the page
      if (yPosition + actualRowHeight > pageHeight - footerSpace) {
        // Add new page
        doc.addPage();
        yPosition = 50; // Start from top margin
        
        // Redraw table header on new page
        doc.rect(tableLeft, yPosition, pageWidth, headerHeight)
          .fillColor(this.HEADER_DARK)
          .fill();
        
        doc.fontSize(10)
          .fillColor('white')
          .font('Helvetica-Bold');
        
        const headerY = yPosition + 9;
        doc.text('SR', columns.srNo.x + 10, headerY, { width: columns.srNo.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('DESCRIPTION', columns.description.x + 10, headerY, { width: columns.description.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('QTY', columns.quantity.x + 10, headerY, { width: columns.quantity.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('UNIT', columns.unit.x + 10, headerY, { width: columns.unit.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('RATE', columns.rate.x + 10, headerY, { width: columns.rate.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('GST%', columns.gst.x + 10, headerY, { width: columns.gst.width, characterSpacing: 0.5, lineBreak: false });
        doc.text('AMOUNT', columns.amount.x + 5, headerY, { width: columns.amount.width - 15, align: 'right', characterSpacing: 0.5, lineBreak: false });
        
        yPosition += headerHeight;
      }

      // Alternating row background colors (gray and white)
      const rowBgColor = index % 2 === 0 ? '#f5f5f5' : 'white'; // Light gray and white
      doc.rect(tableLeft, yPosition, pageWidth, actualRowHeight)
        .fillColor(rowBgColor)
        .fill();

      // Row border
      if (index < data.items.length - 1) {
        doc.moveTo(tableLeft, yPosition + actualRowHeight)
          .lineTo(tableLeft + pageWidth, yPosition + actualRowHeight)
          .strokeColor('#e0e0e0')
          .lineWidth(0.5)
          .stroke();
      }

      // Row data - use index + 1 for clean serial numbers (removes any "1" prefix issue)
      // Center text vertically in the cell
      const textY = yPosition + cellPadding;
      doc.fillColor(this.TEXT_COLOR)
        .font('Helvetica')
        .fontSize(10);
      
      // Draw text in each cell (text will wrap automatically)
      doc.text((index + 1).toString(), columns.srNo.x + 10, textY, { width: columns.srNo.width, lineBreak: true });
      doc.text(item.description || '', columns.description.x + 10, textY, { width: columns.description.width - 10, lineBreak: true });
      doc.text(item.quantity.toString(), columns.quantity.x + 10, textY, { width: columns.quantity.width, lineBreak: true });
      doc.text(item.unit || '', columns.unit.x + 10, textY, { width: columns.unit.width, lineBreak: true });
      doc.text(this.formatCurrency(item.rate), columns.rate.x + 10, textY, { width: columns.rate.width, lineBreak: true });
      doc.text(`${item.gstPercent}%`, columns.gst.x + 10, textY, { width: columns.gst.width, lineBreak: true });
      doc.text(this.formatCurrency(item.amount), columns.amount.x + 5, textY, { width: columns.amount.width - 15, align: 'right', lineBreak: true });

      yPosition += actualRowHeight;
    });

    return yPosition + 15;
  }

  /**
   * Add calculations box (Subtotal, GST, Grand Total)
   */
  static addCalculations(doc, data, tableEndY) {
    const pageHeight = doc.page.height;
    const calcHeight = 60; // Height needed for calculations section
    const bottomMargin = 50; // Bottom margin
    
    // Check if we need a new page for calculations
    let yPosition = tableEndY + 10;
    
    // Only add new page if calculations won't fit on current page
    // Be conservative - only add page if absolutely necessary
    if (yPosition + calcHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPosition = 50;
    }
    
    const boxLeft = 350;
    const boxWidth = 195;

    doc.fontSize(10)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica');

    // Subtotal
    doc.text('Subtotal (Excl GST):', boxLeft, yPosition, { lineBreak: false });
    doc.text(this.formatCurrency(data.subtotal), boxLeft + 100, yPosition, { width: 95, align: 'right', lineBreak: false });

    // GST
    doc.text('GST @ 18%:', boxLeft, yPosition + 18, { lineBreak: false });
    doc.text(this.formatCurrency(data.gst), boxLeft + 100, yPosition + 18, { width: 95, align: 'right', lineBreak: false });

    // Separator line
    doc.moveTo(boxLeft, yPosition + 32)
      .lineTo(boxLeft + boxWidth, yPosition + 32)
      .strokeColor(this.TEXT_COLOR)
      .lineWidth(0.5)
      .stroke();

    // Grand Total
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(this.PRIMARY_COLOR);

    doc.text('GRAND TOTAL:', boxLeft, yPosition + 38, { lineBreak: false });
    doc.text(this.formatCurrency(data.grandTotal), boxLeft + 100, yPosition + 38, { width: 95, align: 'right', lineBreak: false });

    return yPosition + 55;
  }

  /**
   * Add footer sections (Bank Details, Terms, Signature)
   */
  static addFooterSections(doc, data, calcEndY) {
    // Position footer sections after calculations, not at absolute bottom
    const pageHeight = doc.page.height;
    const footerHeight = 75; // Height of footer sections
    const bottomFooterHeight = 40; // Height of bottom footer
    const bottomMargin = 50;
    
    // Calculate Y position - ensure it fits on current page
    let yStart = calcEndY + 20; // Position after calculations
    
    // Check if we're already on a new page (if calcEndY is near top, we just added a page)
    const isNewPage = calcEndY < 100;
    
    // Only add new page if footer sections won't fit AND we're not already on a new page
    if (yStart + footerHeight + bottomFooterHeight > pageHeight - bottomMargin) {
      if (!isNewPage) {
        // Only add new page if we're not already on a fresh page
        doc.addPage();
        yStart = 50;
      } else {
        // We're already on a new page, try to fit footer here
        // Adjust position to fit if possible
        const maxY = pageHeight - footerHeight - bottomFooterHeight - bottomMargin;
        if (yStart > maxY) {
          yStart = Math.max(50, maxY);
        }
      }
    }

    doc.fontSize(9)
      .fillColor(this.TEXT_COLOR)
      .font('Helvetica');

    // Bank Details (Left) - with box and left border like HTML
    const bankBoxWidth = 160;
    const bankBoxHeight = 65;

    // White box background with shadow
    doc.rect(50, yStart - 8, bankBoxWidth, bankBoxHeight)
      .fillColor('white')
      .fill();
    doc.rect(50, yStart - 8, bankBoxWidth, bankBoxHeight)
      .strokeColor('#e8e8e8')
      .lineWidth(1)
      .stroke();

    // Blue left border accent
    doc.rect(50, yStart - 8, 4, bankBoxHeight)
      .fillColor(this.PRIMARY_COLOR)
      .fill();

    doc.font('Helvetica-Bold')
      .fillColor(this.PRIMARY_COLOR)
      .fontSize(9)
      .text('BANK DETAILS', 62, yStart, { lineBreak: false, characterSpacing: 1 });

    doc.font('Helvetica')
      .fillColor(this.TEXT_COLOR)
      .fontSize(7);
    doc.text(this.COMPANY_NAME, 62, yStart + 14, { lineBreak: false });
    doc.text(`Bank: ${this.BANK_NAME}`, 62, yStart + 25, { lineBreak: false });
    doc.text(`A/c No.: ${this.ACCOUNT_NUMBER}`, 62, yStart + 36, { lineBreak: false });
    doc.text(`IFSC: ${this.IFSC_CODE}`, 62, yStart + 47, { lineBreak: false });

    // Terms & Conditions (Center) - with box and left border like HTML
    const termsBoxX = 225;
    const termsBoxWidth = 170;
    const termsBoxHeight = 65;

    // White box background with shadow
    doc.rect(termsBoxX, yStart - 8, termsBoxWidth, termsBoxHeight)
      .fillColor('white')
      .fill();
    doc.rect(termsBoxX, yStart - 8, termsBoxWidth, termsBoxHeight)
      .strokeColor('#e8e8e8')
      .lineWidth(1)
      .stroke();

    // Blue left border accent
    doc.rect(termsBoxX, yStart - 8, 4, termsBoxHeight)
      .fillColor(this.PRIMARY_COLOR)
      .fill();

    doc.font('Helvetica-Bold')
      .fillColor(this.PRIMARY_COLOR)
      .fontSize(9)
      .text('TERMS & CONDITIONS', termsBoxX + 12, yStart, { lineBreak: false, characterSpacing: 1 });

    doc.font('Helvetica')
      .fillColor('#666666')
      .fontSize(7);
    doc.text('GST EXTRA AS APPLICABLE', termsBoxX + 12, yStart + 14, { lineBreak: false });
    doc.text(data.paymentTerms || 'PAYMENT IMMEDIATE', termsBoxX + 12, yStart + 25, { lineBreak: false });
    doc.text(data.offerValidity || 'OFFER VALIDITY 1 WEEK', termsBoxX + 12, yStart + 36, { lineBreak: false });
    doc.text('TRANSPORT EXTRA', termsBoxX + 12, yStart + 47, { lineBreak: false });

    // Signature (Right)
    doc.font('Helvetica-Bold')
      .fillColor(this.PRIMARY_COLOR)
      .fontSize(9)
      .text('For, MEGA ENTERPRISE', 420, yStart, { lineBreak: false });

    doc.moveTo(420, yStart + 38)
      .lineTo(540, yStart + 38)
      .strokeColor(this.PRIMARY_COLOR)
      .lineWidth(2)
      .stroke();

    doc.font('Helvetica')
      .fillColor('#666666')
      .fontSize(8)
      .text('Authorised Signatory', 420, yStart + 42, { lineBreak: false });
  }

  /**
   * Add bottom footer with GST number and contact (on all pages)
   */
  static addBottomFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    const pageWidth = doc.page.width;
    const footerHeight = 40;

    // Add footer to all pages
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const pageHeight = doc.page.height;
      const footerY = pageHeight - footerHeight;

      // Dark blue footer background
      doc.rect(0, footerY, pageWidth, footerHeight)
        .fillColor(this.HEADER_DARK)
        .fill();

      // GST Number and Contact in footer
      doc.fontSize(9)
        .fillColor('white')
        .font('Helvetica')
        .text(`GST NO: ${this.GST_NUMBER} | Phone: ${this.COMPANY_PHONE} | Email: ${this.COMPANY_EMAIL}`, 0, footerY + 10, {
          align: 'center',
          width: pageWidth,
          lineBreak: false,
          characterSpacing: 0.3
        });

      // Page number (dynamic based on total pages)
      doc.fontSize(8)
        .text(`Page ${i + 1} of ${pageCount}`, 0, footerY + 24, { align: 'center', width: pageWidth, lineBreak: false });
    }
    
    // Switch back to last page
    doc.switchToPage(pageCount - 1);
  }

  /**
   * Format currency in Indian Rupees (without superscript issues)
   */
  static formatCurrency(amount) {
    // Convert to number if it's a string, removing any non-numeric characters
    let numAmount = amount;
    if (typeof amount === 'string') {
      // Remove all non-numeric characters except decimal point and minus sign
      // Also remove any superscript characters that might be in the string
      const cleaned = amount.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '').replace(/[^\d.-]/g, '');
      numAmount = parseFloat(cleaned);
    }
    
    // Ensure it's a valid number
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      numAmount = 0;
    }
    
    // Round to nearest integer
    numAmount = Math.round(Number(numAmount));
    
    // Format number manually - convert to string and add commas for thousands
    const numStr = numAmount.toString();
    
    // Add comma separators for thousands (standard format: 1,234,567)
    const formatted = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return with "Rs" instead of ₹ symbol to avoid any rendering issues
    return `Rs ${formatted}`;
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
