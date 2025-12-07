const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Quotation PDF Generation Service
 * Generates professional PDF quotations with MEGA ENTERPRISE branding
 */

class QuotationPdfService {
  // Company constants
  static COMPANY_NAME = 'MEGA ENTERPRISE';
  static COMPANY_ADDRESS = '1ST LEVEL, PLOT NO PAP-57, MIDC WATER TANK, MIDC TALOJA, NAVI MUMBAI -410208';
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
   * Fetch image from URL and return as buffer
   * @param {string} url - Image URL
   * @returns {Promise<Buffer>} Image buffer
   */
  static fetchImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      if (!url) {
        reject(new Error('No URL provided'));
        return;
      }

      // Convert http to https for Cloudinary URLs
      const imageUrl = url.replace(/^http:/, 'https:');

      https.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Generate quotation PDF
   * @param {Object} data - Quotation data
   * @param {string} outputPath - Path where PDF will be saved
   * @returns {Promise<string>} Path to generated PDF
   */
  static async generateQuotationPDF(data, outputPath) {
    return new Promise(async (resolve, reject) => {
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
        const footerEndY = this.addFooterSections(doc, data, calcEndY);

        // Add Advertisement Section if products exist (async for image fetching)
        if (data.advertisementProducts && data.advertisementProducts.length > 0) {
          await this.addAdvertisementSection(doc, data, footerEndY);
        }

        this.addBottomFooter(doc);

        // Finalize PDF
        doc.end();

        writeStream.on('finish', async () => {
          try {
            // Post-process PDF to remove blank pages
            const pdfBytes = fs.readFileSync(outputPath);
            const pdfDoc = await PDFLibDocument.load(pdfBytes);
            let pages = pdfDoc.getPages();
            
            // Find and remove blank pages (pages with only footer, minimal content)
            // Only check last pages as they're most likely to be blank
            let removedCount = 0;
            const maxPagesToCheck = Math.min(3, pages.length - 1); // Check up to last 3 pages, never the first
            
            for (let checked = 0; checked < maxPagesToCheck; checked++) {
              pages = pdfDoc.getPages(); // Refresh pages array after each removal
              if (pages.length <= 1) break; // Never remove if only 1 page left
              
              const lastPageIndex = pages.length - 1;
              const lastPage = pages[lastPageIndex];
              
              try {
                // Get content streams from the page
                const contents = lastPage.node.get('Contents');
                let isBlank = false;
                
                if (!contents) {
                  // No content stream at all - definitely blank
                  isBlank = true;
                } else if (contents.objectType === 'PDFArray' || Array.isArray(contents)) {
                  // Multiple content streams - check how many
                  const contentArray = contents.objectType === 'PDFArray' ? contents.asArray() : contents;
                  // If very few content streams (just footer), might be blank
                  // Footer typically adds 1-2 small content streams
                  if (contentArray.length <= 2) {
                    // Check the total content size - footer is small
                    // We'll be more aggressive here since blank pages are a problem
                    isBlank = true;
                  }
                } else {
                  // Single content stream - likely just footer
                  // Check if this is a minimal page (footer only)
                  try {
                    const contentRef = contents.objectType === 'PDFRef' ? contents : null;
                    if (contentRef) {
                      const contentStream = pdfDoc.context.lookup(contentRef);
                      if (contentStream && contentStream.getContents) {
                        const bytes = contentStream.getContents();
                        // Footer-only pages typically have very small content (< 2000 bytes)
                        // Regular content pages have much more
                        if (bytes && bytes.length < 1500) {
                          isBlank = true;
                        }
                      }
                    }
                  } catch (e) {
                    // If we can't check content size, be conservative
                    isBlank = false;
                  }
                }
                
                if (isBlank) {
                  pdfDoc.removePage(lastPageIndex);
                  removedCount++;
                  console.log(`  🗑️ Removed blank page ${lastPageIndex + 1}`);
                } else {
                  // If this page isn't blank, stop checking
                  break;
                }
              } catch (error) {
                // If we can't check, stop and keep remaining pages
                console.error('Error checking page:', error.message);
                break;
              }
            }
            
            if (removedCount > 0) {
              console.log(`  ✅ Removed ${removedCount} blank page(s)`);
            }
            
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
    const logoX = 18; // Leftmost position
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
    const companyNameX = logoPath ? logoSize + 33 : 50; // Ensure no overlap with logo
    const companyNameY = logoPath ? 32 : 35; // Moved up a bit (was 50)
    doc.fontSize(28)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text(this.COMPANY_NAME, companyNameX, companyNameY, { characterSpacing: 2, lineBreak: false });

    // Company tagline - positioned after logo to avoid overlap
    const taglineX = logoPath ? logoSize + 34 : 50;
    doc.fontSize(12)
      .fillColor('white')
      .font('Helvetica')
      .fillOpacity(0.9)
      .text('Reach For Everything You Need', taglineX, 60, { characterSpacing: 1, lineBreak: false });
    doc.fillOpacity(1);

    // Contact info in header - positioned after logo to avoid overlap
    const addressX = logoPath ? logoSize + 34 : 50;
    doc.fontSize(10)
      .fillColor('white')
      .fillOpacity(0.95)
      .text(`${this.COMPANY_ADDRESS}`, addressX, 81, { lineBreak: false });
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
   * Supports both local development and Cloud Run (Docker) environments
   */
  static findLogo() {
    const possiblePaths = [
      // Production (Docker/Cloud Run) paths
      // Dockerfile: WORKDIR /app, COPY server/ ./ → files are at /app/
      '/app/uploads/mega-logo.png',
      '/app/uploads/logo.png',
      '/app/client/build/logo512.png',
      '/app/client/build/logo192.png',
      // Local development paths
      path.join(__dirname, '../../uploads/mega-logo.png'),
      path.join(__dirname, '../../uploads/logo.png'),
      path.join(__dirname, '../../../client/public/mega-logo.png'),
      path.join(__dirname, '../../../client/public/logo512.png'),
      path.join(__dirname, '../../../client/public/logo192.png')
    ];

    for (const logoPath of possiblePaths) {
      try {
        if (fs.existsSync(logoPath)) {
          return logoPath;
        }
      } catch (err) {
        // Skip paths that cause errors (permission issues, etc.)
        continue;
      }
    }

    // No logo found - PDF will render without logo (graceful fallback)
    console.warn('Logo not found in any expected location. PDF will render without logo.');
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
      // For height calculation, use the converted GST value
      const gstDisplayValue = item.gstPercent < 1 && item.gstPercent > 0 ? Math.round(item.gstPercent * 100) : Math.round(item.gstPercent);
      const gstHeight = doc.heightOfString(`${gstDisplayValue}%`, { width: columns.gst.width });
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
      // Fix GST display: if value is less than 1, it's likely a decimal (0.18) and should be converted to percentage (18)
      const displayGst = item.gstPercent < 1 && item.gstPercent > 0 ? Math.round(item.gstPercent * 100) : Math.round(item.gstPercent);
      doc.text(`${displayGst}%`, columns.gst.x + 10, textY, { width: columns.gst.width, lineBreak: true });
      doc.text(this.formatCurrency(item.amount), columns.amount.x + 5, textY, { width: columns.amount.width - 15, align: 'right', lineBreak: true });

      yPosition += actualRowHeight;
    });

    return yPosition + 15;
  }

  /**
   * Add calculations box (Total only - no GST calculation as rates vary by product)
   */
  static addCalculations(doc, data, tableEndY) {
    const pageHeight = doc.page.height;
    const calcHeight = 30; // Height needed for calculations section (just one line)
    const footerSectionHeight = 80; // Height needed for footer sections below
    const bottomFooterHeight = 45; // Height of bottom footer
    
    // Check if we need a new page for calculations
    let yPosition = tableEndY + 10;
    
    // Total space needed for calculations + footer sections + bottom footer
    const totalNeeded = calcHeight + footerSectionHeight + bottomFooterHeight;
    
    // Only add new page if there's truly not enough space for everything
    // Be very conservative to avoid blank pages
    if (yPosition + totalNeeded > pageHeight && yPosition > 300) {
      // Only add page if we're past the halfway point of the page
      doc.addPage();
      yPosition = 50;
    }
    
    const boxLeft = 350;
    const boxWidth = 195;

    // Total (Excl GST) - Bold and prominent
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(this.PRIMARY_COLOR);

    doc.text('TOTAL (Excl GST):', boxLeft, yPosition, { lineBreak: false });
    doc.text(this.formatCurrency(data.subtotal), boxLeft + 100, yPosition, { width: 95, align: 'right', lineBreak: false });

    return yPosition + 25;
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
    let yStart = calcEndY + 15; // Position after calculations (reduced gap)
    
    // Total space needed for footer sections
    const totalNeeded = footerHeight + bottomFooterHeight;
    
    // Available space on current page
    const availableSpace = pageHeight - yStart - bottomMargin;
    
    // Only add new page if footer sections absolutely won't fit (be conservative)
    // We need at least totalNeeded space
    if (availableSpace < totalNeeded && yStart > 200) {
      // Only add new page if we're not near the top of the page already
      doc.addPage();
      yStart = 50;
    } else if (availableSpace < totalNeeded) {
      // We're near the top but still don't have enough space - compact the footer
      // This shouldn't happen normally, but handle gracefully
      yStart = Math.max(50, pageHeight - totalNeeded - bottomMargin - 10);
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

    return yStart + footerHeight + 20;
  }

  /**
   * Add advertisement section with product grid (with images)
   */
  static async addAdvertisementSection(doc, data, startY) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    const bottomMargin = 50; // Space for footer

    // Skip if no products
    if (!data.advertisementProducts || data.advertisementProducts.length === 0) {
      return startY;
    }

    // Add spacing before section starts
    let currentY = startY + 20;

    // Banner styling
    const bannerHeight = 35;

    // Check if we have enough space for banner + at least one row
    const cardHeight = 105; // Slightly reduced
    const minSpaceNeeded = bannerHeight + 20 + cardHeight;
    
    if (currentY + minSpaceNeeded > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = margin;
    }

    // Add "We Also Provide" Banner
    doc.rect(margin, currentY, contentWidth, bannerHeight)
      .fillColor('#f0f4f8')
      .fill();

    doc.rect(margin, currentY, 5, bannerHeight)
      .fillColor(this.PRIMARY_COLOR)
      .fill();

    doc.rect(margin + contentWidth - 5, currentY, 5, bannerHeight)
      .fillColor(this.PRIMARY_COLOR)
      .fill();

    doc.font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(this.PRIMARY_COLOR)
      .text('WE ALSO PROVIDE', margin + 20, currentY + 10, {
        width: contentWidth - 40,
        align: 'center',
        characterSpacing: 2
      });

    currentY += bannerHeight + 15;

    // Grid configuration - 3 Columns
    const columns = 3;
    const gap = 15;
    const cardWidth = (contentWidth - (gap * (columns - 1))) / columns;
    const cardPadding = 8;
    const imageSize = 65;

    // Track the current row's Y position
    let rowStartY = currentY;
    let lastRowEndY = currentY;

    // Iterate through products
    for (let index = 0; index < data.advertisementProducts.length; index++) {
      const product = data.advertisementProducts[index];
      const colIndex = index % columns;
      
      // At the start of a new row (except first row), move Y down
      if (index > 0 && colIndex === 0) {
        rowStartY = lastRowEndY + gap;
        
        // Check if new row fits on current page
        if (rowStartY + cardHeight > pageHeight - bottomMargin) {
          doc.addPage();
          rowStartY = margin;
          
          // Add small continuation indicator
          doc.font('Helvetica')
            .fontSize(9)
            .fillColor('#666666')
            .text('Products (continued)', margin, rowStartY, { align: 'left' });
          rowStartY += 20;
        }
      }

      const x = margin + (colIndex * (cardWidth + gap));
      const cardY = rowStartY;

      // Draw Product Card
      doc.rect(x, cardY, cardWidth, cardHeight)
        .fillColor('#ffffff')
        .fill();

      doc.rect(x, cardY, cardWidth, cardHeight)
        .strokeColor('#d0d5dd')
        .lineWidth(1)
        .stroke();

      // Top accent line
      doc.rect(x, cardY, cardWidth, 3)
        .fillColor(this.PRIMARY_COLOR)
        .fill();

      // Product Image (left side)
      const imageX = x + cardPadding;
      const imageY = cardY + 10;

      try {
        // Get primary image URL
        let imageUrl = null;
        if (product.images && product.images.length > 0) {
          const primaryImage = product.images.find(img => img.isPrimary);
          imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
        }

        if (imageUrl) {
          // Fetch and render image
          const imageBuffer = await this.fetchImageFromUrl(imageUrl);
          doc.image(imageBuffer, imageX, imageY, {
            width: imageSize,
            height: imageSize,
            fit: [imageSize, imageSize]
          });
        } else {
          // No image available - draw placeholder
          doc.rect(imageX, imageY, imageSize, imageSize)
            .strokeColor('#e0e0e0')
            .lineWidth(1)
            .stroke();
          doc.fontSize(8)
            .fillColor('#999999')
            .text('No Image', imageX, imageY + 30, {
              width: imageSize,
              align: 'center'
            });
        }
      } catch (error) {
        // Image fetch failed - draw placeholder
        console.error(`Failed to load image for product ${product.name}:`, error.message);
        doc.rect(imageX, imageY, imageSize, imageSize)
          .strokeColor('#e0e0e0')
          .lineWidth(1)
          .stroke();
        doc.fontSize(8)
          .fillColor('#999999')
          .text('Image\nUnavailable', imageX, imageY + 25, {
            width: imageSize,
            align: 'center'
          });
      }

      // Content area (right side of image)
      const contentX = imageX + imageSize + 8;
      const cardContentWidth = cardWidth - imageSize - (cardPadding * 2) - 8;
      let contentY = cardY + 8;
      
      // Track the end of this row
      lastRowEndY = cardY + cardHeight;

      // Product Name (prominent, in theme blue color)
      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(this.PRIMARY_COLOR)
        .text(product.name, contentX, contentY, {
          width: cardContentWidth,
          height: 24,
          ellipsis: true,
          align: 'left'
        });

      contentY += 26;

      // Product Description (only if not empty)
      if (product.description && product.description.trim().length > 0) {
        doc.font('Helvetica')
          .fontSize(7)
          .fillColor('#555555')
          .text(
            product.description.substring(0, 60).replace(/\n/g, ' ') + (product.description.length > 60 ? '...' : ''),
            contentX,
            contentY,
            {
              width: cardContentWidth,
              height: 20,
              align: 'left',
              ellipsis: true
            }
          );
        contentY += 22;
      }

      // Product Specifications (properly handle Mongoose Map)
      if (product.specifications) {
        let specs = [];

        if (product.specifications instanceof Map) {
          specs = Array.from(product.specifications.entries())
            .filter(([key, value]) => !key.startsWith('$') && value !== null && value !== undefined);
        } else if (typeof product.specifications === 'object' && product.specifications !== null) {
          specs = Object.entries(product.specifications)
            .filter(([key, value]) => !key.startsWith('$') && value !== null && value !== undefined);
        }

        if (specs.length > 0) {
          doc.font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(this.PRIMARY_COLOR)
            .text('Specifications:', contentX, contentY, {
              width: cardContentWidth,
              align: 'left'
            });
          contentY += 10;

          specs.slice(0, 3).forEach(([key, value]) => {
            const specText = `• ${key}: ${value}`;
            doc.font('Helvetica')
              .fontSize(6.5)
              .fillColor('#666666')
              .text(specText, contentX, contentY, {
                width: cardContentWidth,
                height: 8,
                ellipsis: true,
                align: 'left'
              });
            contentY += 9;
          });
        }
      }
    }

    // Return the final Y position (last row end + small margin)
    return lastRowEndY + 10;
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
