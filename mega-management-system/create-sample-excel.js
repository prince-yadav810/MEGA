const XLSX = require('./server/node_modules/xlsx');

// Sample data
const data = [
  {
    'Quote Number': 'Q-2024-001',
    'Client': 'ABC Industries',
    'Title': 'Industrial Hoses & Connectors',
    'Amount': '₹250000',
    'Status': 'pending',
    'Valid Until': '2024-12-31',
    'Items': 12,
    'Created Date': '2024-12-01'
  },
  {
    'Quote Number': 'Q-2024-002',
    'Client': 'XYZ Corporation',
    'Title': 'Safety Equipment Package',
    'Amount': '₹185000',
    'Status': 'approved',
    'Valid Until': '2024-12-28',
    'Items': 8,
    'Created Date': '2024-11-28'
  },
  {
    'Quote Number': 'Q-2024-003',
    'Client': 'DEF Engineering',
    'Title': 'Hydraulic System Components',
    'Amount': '₹375000',
    'Status': 'pending',
    'Valid Until': '2024-12-25',
    'Items': 15,
    'Created Date': '2024-11-25'
  },
  {
    'Quote Number': 'Q-2024-004',
    'Client': 'GHI Manufacturing',
    'Title': 'Pneumatic Tools Set',
    'Amount': '₹125000',
    'Status': 'pending',
    'Valid Until': '2025-01-15',
    'Items': 6,
    'Created Date': '2024-12-02'
  },
  {
    'Quote Number': 'Q-2024-005',
    'Client': 'JKL Industries',
    'Title': 'Custom Fabrication Work',
    'Amount': '₹500000',
    'Status': 'rejected',
    'Valid Until': '2024-12-20',
    'Items': 20,
    'Created Date': '2024-11-20'
  }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Quotations');

// Write to file
XLSX.writeFile(wb, 'sample_quotations.xlsx');

console.log('✅ Excel file created: sample_quotations.xlsx');
console.log('You can now upload this file to test the quotation upload feature.');
