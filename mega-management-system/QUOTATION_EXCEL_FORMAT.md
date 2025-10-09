# Quotation Excel Upload Format

## Required Columns

The Excel file should contain the following columns (column names can vary as shown in alternatives):

### 1. Quote Number / Quotation Number / Number
- **Required**: Yes
- **Type**: Text
- **Example**: Q-2024-001
- **Description**: Unique identifier for the quotation

### 2. Client / Client Name
- **Required**: Yes
- **Type**: Text
- **Example**: ABC Industries
- **Description**: Name of the client

### 3. Title / Details / Quotation Details / Description
- **Required**: Yes
- **Type**: Text
- **Example**: Industrial Hoses & Connectors
- **Description**: Brief description of what the quotation is for

### 4. Amount / Total Amount
- **Required**: Yes
- **Type**: Text or Number
- **Example**: ₹2,50,000 or 250000
- **Description**: Total amount of the quotation (with or without currency symbol)

### 5. Status
- **Required**: No (defaults to "pending")
- **Type**: Text
- **Valid Values**: pending, approved, rejected, expired
- **Example**: pending
- **Description**: Current status of the quotation

### 6. Valid Until / Valid Till / Expiry Date
- **Required**: Yes
- **Type**: Date
- **Example**: 2024-12-31 or 31/12/2024
- **Description**: Date until which the quotation is valid

### 7. Items / Item Count
- **Required**: No (defaults to 0)
- **Type**: Number
- **Example**: 12
- **Description**: Number of items in the quotation

### 8. Created Date / Date
- **Required**: No (defaults to current date)
- **Type**: Date
- **Example**: 2024-12-01 or 01/12/2024
- **Description**: Date when the quotation was created

## Sample Excel Format

| Quote Number | Client | Title | Amount | Status | Valid Until | Items | Created Date |
|-------------|--------|-------|--------|--------|-------------|-------|--------------|
| Q-2024-001 | ABC Industries | Industrial Hoses & Connectors | ₹2,50,000 | pending | 2024-12-31 | 12 | 2024-12-01 |
| Q-2024-002 | XYZ Corporation | Safety Equipment Package | ₹1,85,000 | approved | 2024-12-28 | 8 | 2024-11-28 |
| Q-2024-003 | DEF Engineering | Hydraulic System Components | ₹3,75,000 | rejected | 2024-12-25 | 15 | 2024-11-25 |

## Important Notes

1. **Header Row**: The first row should contain column headers
2. **Unique Quote Numbers**: Each quotation number must be unique. If a duplicate is found during upload, the existing quotation will be updated
3. **Date Formats**: Dates can be in various formats (DD/MM/YYYY, YYYY-MM-DD, Excel date serial numbers)
4. **Status Values**: Status must be one of: pending, approved, rejected, expired (case-insensitive)
5. **Amount Format**: Amount can include currency symbols and commas (e.g., ₹2,50,000 or 250000)
6. **File Types**: Supported formats are .xls and .xlsx

## Upload Process

1. Click the "Upload Excel" button on the Quotations page
2. Select your Excel file (.xls or .xlsx)
3. The system will:
   - Parse the Excel file
   - Validate all required fields
   - Check for duplicate quotation numbers
   - Save new quotations or update existing ones
   - Display a success message with statistics
4. The quotations list will automatically refresh to show the imported data

## Error Handling

If there are errors during upload, you will receive a detailed report showing:
- Parse errors: Issues with reading data from specific rows
- Save errors: Issues with saving specific quotations to the database

The upload will continue processing valid rows even if some rows have errors.
