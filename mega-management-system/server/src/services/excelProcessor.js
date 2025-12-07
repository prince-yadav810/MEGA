const xlsx = require('xlsx');
const moment = require('moment');

/**
 * Dynamic Excel Processor Service
 * Intelligently detects and extracts quotation data from Excel files
 * Handles variations in cell positions, column order, and table structure
 * NO AI/Vision APIs - Pure pattern-based intelligence
 */

class ExcelProcessor {
  /**
   * Process quotation Excel file with dynamic detection
   */
  static processQuotationExcel(filePath) {
    try {
      console.log('\n📊 Processing Excel file with dynamic detection...');

      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const range = xlsx.utils.decode_range(worksheet['!ref']);

      console.log(`  Sheet: ${sheetName}, Range: ${worksheet['!ref']}`);

      // Dynamic extraction with fallbacks
      const extractedData = {
        refNo: this.extractRefNoDynamic(worksheet, range),
        date: this.extractDateDynamic(worksheet, range),
        clientName: this.extractClientNameDynamic(worksheet, range),
        items: this.extractItemsDynamic(worksheet, range),
        paymentTerms: this.extractPaymentTerms(worksheet, range),
        offerValidity: this.extractOfferValidity(worksheet, range),
        subtotal: this.extractSubtotal(worksheet, range)
      };

      // Calculate totals (no GST calculation - GST rates vary by product)
      extractedData.gst = 0; // No overall GST calculation
      extractedData.grandTotal = extractedData.subtotal; // Grand total = subtotal (no GST added)

      this.validateExtractedData(extractedData);

      console.log('✅ Excel processing complete\n');
      return extractedData;

    } catch (error) {
      console.error('❌ Excel processing failed:', error.message);
      throw new Error(`Failed to process Excel file: ${error.message}`);
    }
  }

  // ============================================================================
  // HELPER METHODS - Search & Pattern Matching
  // ============================================================================

  /**
   * Search for a cell containing specific text
   */
  static searchForLabel(worksheet, range, searchTerms, searchArea = null) {
    const area = searchArea || { rowStart: 0, rowEnd: range.e.r, colStart: 0, colEnd: range.e.c };

    for (let row = area.rowStart; row <= Math.min(area.rowEnd, range.e.r); row++) {
      for (let col = area.colStart; col <= Math.min(area.colEnd, range.e.c); col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell) {
          const cellText = String(cell).trim().toUpperCase();

          for (const term of searchTerms) {
            if (cellText.includes(term.toUpperCase())) {
              return { row, col, value: cell };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Get adjacent cell value
   */
  static getAdjacentCell(worksheet, row, col, direction = 'right') {
    const directions = {
      'right': { r: row, c: col + 1 },
      'down': { r: row + 1, c: col },
      'left': { r: row, c: col - 1 },
      'up': { r: row - 1, c: col }
    };

    const target = directions[direction];
    return this.getCellValue(worksheet, target.r, target.c);
  }

  /**
   * Search for numeric pattern
   */
  static searchForNumber(worksheet, range, pattern, searchArea = null) {
    const area = searchArea || { rowStart: 0, rowEnd: range.e.r, colStart: 0, colEnd: range.e.c };

    for (let row = area.rowStart; row <= Math.min(area.rowEnd, range.e.r); row++) {
      for (let col = area.colStart; col <= Math.min(area.colEnd, range.e.c); col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell) {
          const cellText = String(cell).trim();
          if (pattern.test(cellText)) {
            return { row, col, value: cell };
          }
        }
      }
    }
    return null;
  }

  // ============================================================================
  // DYNAMIC EXTRACTION METHODS
  // ============================================================================

  /**
   * Extract Reference Number - Dynamic Detection
   */
  static extractRefNoDynamic(worksheet, range) {
    console.log('  🔍 Searching for Reference Number...');

    // Strategy 1: Search for "REF NO" label
    const refLabel = this.searchForLabel(worksheet, range, ['REF NO', 'REF. NO', 'QUOTATION NO', 'QUOTE NO'],
      { rowStart: 0, rowEnd: 15, colStart: 0, colEnd: 10 });

    if (refLabel) {
      // Try right adjacent cell
      let refValue = this.getAdjacentCell(worksheet, refLabel.row, refLabel.col, 'right');
      if (refValue) {
        const refNo = String(refValue).trim();
        console.log(`  ✓ Ref No: ${refNo} (found via label at ${this.cellAddress(refLabel.row, refLabel.col)})`);
        return refNo;
      }

      // Try same row, column E or F
      refValue = this.getCellValue(worksheet, refLabel.row, 4) || this.getCellValue(worksheet, refLabel.row, 5);
      if (refValue) {
        const refNo = String(refValue).trim();
        console.log(`  ✓ Ref No: ${refNo} (found in row ${refLabel.row + 1})`);
        return refNo;
      }
    }

    // Strategy 2: Try fixed position E4
    const e4Value = this.getCellValue(worksheet, 3, 4); // Row 4, Col E
    if (e4Value && /^\d{5}$/.test(String(e4Value).trim())) {
      const refNo = String(e4Value).trim();
      console.log(`  ✓ Ref No: ${refNo} (found at E4 - fixed position)`);
      return refNo;
    }

    // Strategy 3: Search for 5-digit number in first 10 rows
    const numberResult = this.searchForNumber(worksheet, range, /^\d{5}$/,
      { rowStart: 0, rowEnd: 10, colStart: 0, colEnd: 10 });

    if (numberResult) {
      const refNo = String(numberResult.value).trim();
      console.log(`  ✓ Ref No: ${refNo} (found by pattern at ${this.cellAddress(numberResult.row, numberResult.col)})`);
      return refNo;
    }

    throw new Error('Reference number not found');
  }

  /**
   * Extract Client Name - Dynamic Detection
   */
  static extractClientNameDynamic(worksheet, range) {
    console.log('  🔍 Searching for Client Name...');

    // Strategy 1: Search for "TO," or "TO:" label
    const toLabel = this.searchForLabel(worksheet, range, ['TO,', 'TO:', 'TO'],
      { rowStart: 0, rowEnd: 15, colStart: 0, colEnd: 5 });

    if (toLabel) {
      // Try right adjacent cell
      let clientName = this.getAdjacentCell(worksheet, toLabel.row, toLabel.col, 'right');
      if (clientName && String(clientName).trim().length > 3) {
        const client = String(clientName).trim();
        if (!client.toUpperCase().includes('MEGA ENTERPRISE')) {
          console.log(`  ✓ Client: ${client} (found via "TO" label)`);
          return client;
        }
      }
    }

    // Strategy 2: Try fixed position B5
    const b5Value = this.getCellValue(worksheet, 4, 1); // Row 5, Col B
    if (b5Value && String(b5Value).trim().length > 3) {
      const client = String(b5Value).trim();
      if (!client.toUpperCase().includes('MEGA ENTERPRISE') &&
          !client.toUpperCase().match(/^(TO|CLIENT|NAME):?$/)) {
        console.log(`  ✓ Client: ${client} (found at B5 - fixed position)`);
        return client;
      }
    }

    // Strategy 3: Search for company keywords
    const companyPattern = /\b(LTD|LIMITED|PVT|PRIVATE|CONSTRUCTION|INFRASTRUCTURE|PROJECTS?|ENTERPRISES?|CORPORATION|COMPANY|INC)\b/i;

    for (let row = 3; row < Math.min(12, range.e.r); row++) {
      for (let col = 0; col < Math.min(6, range.e.c); col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell) {
          const cellText = String(cell).trim();
          if (cellText.length > 5 &&
              companyPattern.test(cellText) &&
              !cellText.toUpperCase().includes('MEGA ENTERPRISE')) {
            console.log(`  ✓ Client: ${cellText} (found by pattern at ${this.cellAddress(row, col)})`);
            return cellText;
          }
        }
      }
    }

    throw new Error('Client name not found');
  }

  /**
   * Extract Date - Dynamic Detection
   */
  static extractDateDynamic(worksheet, range) {
    console.log('  🔍 Searching for Date...');

    // Strategy 1: Search for "DATE" label
    const dateLabel = this.searchForLabel(worksheet, range, ['DATE', 'DATED'],
      { rowStart: 0, rowEnd: 15, colStart: 0, colEnd: 10 });

    if (dateLabel) {
      // Try right adjacent cell
      let dateValue = this.getAdjacentCell(worksheet, dateLabel.row, dateLabel.col, 'right');
      if (dateValue) {
        const parsedDate = this.parseDate(dateValue);
        if (parsedDate) {
          console.log(`  ✓ Date: ${parsedDate.toLocaleDateString('en-IN')} (found via label)`);
          return parsedDate;
        }
      }

      // Try same row, column E or F
      dateValue = this.getCellValue(worksheet, dateLabel.row, 4) || this.getCellValue(worksheet, dateLabel.row, 5);
      if (dateValue) {
        const parsedDate = this.parseDate(dateValue);
        if (parsedDate) {
          console.log(`  ✓ Date: ${parsedDate.toLocaleDateString('en-IN')} (found in row ${dateLabel.row + 1})`);
          return parsedDate;
        }
      }
    }

    // Strategy 2: Try fixed position E5
    const e5Value = this.getCellValue(worksheet, 4, 4); // Row 5, Col E
    if (e5Value) {
      const parsedDate = this.parseDate(e5Value);
      if (parsedDate) {
        console.log(`  ✓ Date: ${parsedDate.toLocaleDateString('en-IN')} (found at E5 - fixed position)`);
        return parsedDate;
      }
    }

    // Strategy 3: Search for date patterns in first 10 rows
    for (let row = 0; row < Math.min(10, range.e.r); row++) {
      for (let col = 0; col < Math.min(10, range.e.c); col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell) {
          const parsedDate = this.parseDate(cell);
          if (parsedDate) {
            console.log(`  ✓ Date: ${parsedDate.toLocaleDateString('en-IN')} (found by pattern at ${this.cellAddress(row, col)})`);
            return parsedDate;
          }
        }
      }
    }

    console.warn('  ⚠ Date not found, using current date');
    return new Date();
  }

  /**
   * Extract Items - Dynamic Table Detection
   */
  static extractItemsDynamic(worksheet, range) {
    console.log('  📋 Searching for items table...');

    // Step 1: Find table header row dynamically
    const tableHeader = this.findTableHeader(worksheet, range);
    if (!tableHeader) {
      throw new Error('Could not find table header row');
    }

    console.log(`  ✓ Table header at Row ${tableHeader.row + 1}`);
    console.log(`  ✓ Column mapping:`, tableHeader.columns);

    // Step 2: Extract items using dynamic column mapping
    const items = [];
    let rowIndex = tableHeader.row + 1;

    while (rowIndex <= range.e.r) {
      const srNoCol = tableHeader.columns.srNo;
      if (srNoCol === null) break;

      const srNoValue = this.getCellValue(worksheet, rowIndex, srNoCol);
      if (!srNoValue) break;

      const srNo = this.parseNumber(srNoValue);
      if (srNo === null || srNo === 0) {
        rowIndex++;
        continue;
      }

      // Extract using dynamic column positions
      const description = this.getCellValue(worksheet, rowIndex, tableHeader.columns.description);
      const quantity = this.getCellValue(worksheet, rowIndex, tableHeader.columns.quantity);
      const unit = this.getCellValue(worksheet, rowIndex, tableHeader.columns.unit);
      const rate = this.getCellValue(worksheet, rowIndex, tableHeader.columns.rate);
      const gstPercent = this.getCellValue(worksheet, rowIndex, tableHeader.columns.gst);
      const amount = this.getCellValue(worksheet, rowIndex, tableHeader.columns.amount);

      if (!description || String(description).trim() === '') {
        rowIndex++;
        continue;
      }

      items.push({
        srNo: srNo,
        description: String(description).trim(),
        quantity: this.parseNumber(quantity) || 1,
        unit: unit ? String(unit).trim() : 'NOS',
        rate: this.parseNumber(rate) || 0,
        gstPercent: this.parseNumber(gstPercent) || 0,
        amount: this.parseNumber(amount) || 0
      });

      rowIndex++;

      if (items.length >= 100) {
        console.warn('  ⚠ Reached maximum of 100 items');
        break;
      }
    }

    if (items.length === 0) {
      throw new Error('No line items found in table');
    }

    console.log(`  ✓ Extracted ${items.length} items`);
    return items;
  }

  /**
   * Find table header row and map columns dynamically
   */
  static findTableHeader(worksheet, range) {
    // Search rows 5-20 for header row
    for (let row = 5; row <= Math.min(20, range.e.r); row++) {
      const rowData = {};

      // Get all cell values in this row
      for (let col = 0; col <= Math.min(10, range.e.c); col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell) {
          rowData[col] = String(cell).trim().toUpperCase();
        }
      }

      // Try to identify columns
      const columns = this.identifyColumns(rowData);
      if (columns && columns.srNo !== null && columns.description !== null) {
        return { row, columns };
      }
    }

    return null;
  }

  /**
   * Identify column positions from header row data
   */
  static identifyColumns(rowData) {
    const columns = {
      srNo: null,
      description: null,
      quantity: null,
      unit: null,
      rate: null,
      gst: null,
      amount: null
    };

    for (const [col, value] of Object.entries(rowData)) {
      const colIndex = parseInt(col);

      // Sr No variations
      if (value.match(/^(SR\.?|S\.?\s*NO\.?|SR\.?\s*NO\.?|SERIAL|#)$/i)) {
        columns.srNo = colIndex;
      }
      // Description variations
      else if (value.match(/^(DESC|DESCRIPTION|DISCRIPTION|PARTICULARS?|ITEMS?|DETAILS?|PRODUCT)$/i)) {
        columns.description = colIndex;
      }
      // Quantity variations
      else if (value.match(/^(QTY|QUANTITY|QTY\.|QUAN\.)$/i)) {
        columns.quantity = colIndex;
      }
      // Unit variations
      else if (value.match(/^(UNIT|UOM|U\.M\.?|UNITS?)$/i)) {
        columns.unit = colIndex;
      }
      // Rate variations
      else if (value.match(/^(RATE|PRICE|UNIT\s*PRICE|RATE\/UNIT)$/i)) {
        columns.rate = colIndex;
      }
      // GST variations
      else if (value.match(/^(GST|TAX|GST\s*%|TAX\s*%|VAT|GST\s*\%?)$/i)) {
        columns.gst = colIndex;
      }
      // Amount variations - more flexible to match "AMOUNT (EXCL GST)" etc
      else if (value.match(/^AMOUNT/i) || value.match(/^(TOTAL|AMT|VALUE)$/i)) {
        columns.amount = colIndex;
      }
    }

    // Minimum required: Sr No and Description (we'll infer amount if needed)
    if (columns.srNo !== null && columns.description !== null) {
      return columns;
    }

    return null;
  }

  /**
   * Extract Subtotal - Search for TOTAL
   */
  static extractSubtotal(worksheet, range) {
    console.log('  💰 Searching for subtotal...');

    // Search entire sheet for "TOTAL" keyword
    for (let row = 0; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell && String(cell).trim().toUpperCase() === 'TOTAL') {
          // Found TOTAL, now search same row for the amount
          for (let checkCol = col; checkCol <= Math.min(col + 5, range.e.c); checkCol++) {
            const amountCell = this.getCellValue(worksheet, row, checkCol);
            const amount = this.parseNumber(amountCell);

            if (amount !== null && amount > 0) {
              console.log(`  ✓ Subtotal: ₹${amount.toLocaleString('en-IN')} (Row ${row + 1}, Col ${String.fromCharCode(65 + checkCol)})`);
              return amount;
            }
          }
        }
      }
    }

    throw new Error('Subtotal not found');
  }

  /**
   * Extract Payment Terms
   */
  static extractPaymentTerms(worksheet, range) {
    for (let row = 0; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell) {
          const value = String(cell).trim();
          if (value.toUpperCase().startsWith('PAYMENT')) {
            console.log(`  ✓ Payment Terms: ${value}`);
            return value;
          }
        }
      }
    }

    console.log('  ⚠ Payment terms not found, using default');
    return 'PAYMENT IMMEDIATE';
  }

  /**
   * Extract Offer Validity
   */
  static extractOfferValidity(worksheet, range) {
    for (let row = 0; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cell = this.getCellValue(worksheet, row, col);
        if (cell) {
          const value = String(cell).trim();
          if (value.toUpperCase().includes('VALIDITY') || value.toUpperCase().startsWith('OFFER')) {
            console.log(`  ✓ Offer Validity: ${value}`);
            return value;
          }
        }
      }
    }

    console.log('  ⚠ Offer validity not found, using default');
    return 'OFFER VALIDITY 1 WEEKS';
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get cell value by row and column index
   */
  static getCellValue(worksheet, row, col) {
    const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellRef];
    return cell ? cell.v : null;
  }

  /**
   * Get cell address (like "E4")
   */
  static cellAddress(row, col) {
    return xlsx.utils.encode_cell({ r: row, c: col });
  }

  /**
   * Parse number from cell value
   */
  static parseNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    // Remove currency symbols, commas, spaces, %
    const cleaned = String(value).replace(/[₹,\s%]/g, '').trim();
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse date from various formats
   */
  static parseDate(value) {
    if (!value) return null;

    // If already a Date object
    if (value instanceof Date) {
      return value;
    }

    // If Excel serial number (number > 1000)
    if (typeof value === 'number' && value > 1000) {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date;
    }

    // Try parsing string with moment
    const parsed = moment(value, [
      'DD.MM.YYYY',
      'DD/MM/YYYY',
      'DD-MM-YYYY',
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'D.M.YYYY',
      'D/M/YYYY'
    ], true);

    return parsed.isValid() ? parsed.toDate() : null;
  }

  /**
   * Validate extracted data
   */
  static validateExtractedData(data) {
    const errors = [];

    if (!data.refNo) {
      errors.push('Reference number is missing');
    }

    if (!data.clientName) {
      errors.push('Client name is missing');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('No line items found');
    }

    if (!data.subtotal || data.subtotal <= 0) {
      errors.push('Invalid subtotal');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

module.exports = ExcelProcessor;
