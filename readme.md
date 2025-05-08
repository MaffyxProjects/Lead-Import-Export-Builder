# CSV Generator Tool Documentation

**Version:** vFinal-BlankHandled

## Table of Contents

1.  [Overview](#1-overview)
2.  [How It Works](#2-how-it-works)
    *   [Core Technologies](#core-technologies)
    *   [File Structure](#file-structure)
    *   [Client-Side Operation](#client-side-operation)
3.  [Functionality Details](#3-functionality-details)
    *   [Section 1: Generate Contact CSV from Pasted Data](#section-1-generate-contact-csv-from-pasted-data)
        *   [Earned Exits Source](#earned-exits-source)
        *   [Quan Cao Source](#quan-cao-source)
        *   [Common Logic for Pasted Data](#common-logic-for-pasted-data)
    *   [Section 2: Generate Opportunity CSV from Uploaded File](#section-2-generate-opportunity-csv-from-uploaded-file)
4.  [Key Helper Functions](#4-key-helper-functions)
    *   [`splitName(fullName)`](#splitnamefullname)
    *   `downloadCSV(csvContent, filename)`
    *   `getFormattedDate()`
5.  Error Handling & Status Messages

## 1. Overview

The "Contact & Opportunity CSV Generator" is a web-based tool designed to help format data into specific CSV templates, making it ready for import into other systems. It addresses two primary use cases:

*   **Generating Contact CSVs:** From data pasted directly from Google Sheets (or other tab-separated sources). It supports two distinct source formats: "Earned Exits" and "Quan Cao".
*   **Generating Opportunity CSVs:** From an uploaded CSV file containing contact IDs and business names.

The tool runs entirely in the user's browser, ensuring data privacy as no information is sent to any server.

## 2. How It Works

### Core Technologies

*   **HTML (`index.html`):** Provides the structure and user interface elements (text areas, buttons, file inputs).
*   **CSS (`style.css`):** Styles the HTML elements for a clean and user-friendly appearance.
*   **JavaScript (`script.js`):** Contains all the client-side logic for:
    *   Handling user interactions (button clicks, file uploads).
    *   Reading data from input fields.
    *   Processing and transforming the data according to predefined rules.
    *   Generating CSV content.
    *   Initiating file downloads.
*   **PapaParse (`papaparse.min.js`):** A powerful in-browser CSV parsing and unparsing library. It's used to:
    *   Parse tab-separated data pasted by the user.
    *   Parse uploaded CSV files.
    *   Convert processed data arrays back into CSV formatted strings for download.

### File Structure

*   `index.html`: The main HTML file that the user opens in their browser.
*   `style.css`: Contains all the styling rules for the application.
*   `script.js`: The core JavaScript file driving the tool's functionality.
*   `papaparse.min.js`: The minified PapaParse library.

### Client-Side Operation

All processing happens within the user's web browser. When data is pasted or a file is uploaded, JavaScript reads this data, processes it using the logic defined in `script.js` and PapaParse, and then generates a new CSV file that the browser prompts the user to download. No data is transmitted over the network to a server.

## 3. Functionality Details

### Section 1: Generate Contact CSV from Pasted Data

![Section 1](https://github.com/MaffyxProjects/Lead-Import-Export-Builder/blob/main/Screenshot%202025-05-08%20151638.png?raw=true)

This section allows users to paste tab-separated data (typically copied from Google Sheets) and convert it into a standardized Contact CSV.

#### Earned Exits Source

*   **Input:** Expects data with the following columns (0-indexed if pasted directly):
    *   Column `D` (index 3): Full Name
    *   Column `G` (index 6): Business Name
    *   Column `I` (index 8): Phone
    *   Column `J` (index 9): Email
*   **Processing:**
    *   The script attempts to extract data using these "standard" indices.
    *   If a row doesn't seem to yield valid phone or email data with standard indices (or is too short), it tries "adjusted" indices as a fallback:
        *   Full Name: index 2
        *   Business Name: index 5
        *   Phone: index 7
        *   Email: index 8
    *   A row is considered valid if it has a non-empty phone number OR a non-empty email address after extraction.
    *   Full names are split into "First Name" and "Last Name" using the `splitName` helper.
*   **Output CSV Columns:** `Phone`, `Email`, `First Name`, `Last Name`, `Business Name`, `Source` (fixed to "Earned Exits").
*   **Filename:** `Contacts_Earned_Exits_YYYYMMDD.csv`

#### Quan Cao Source

*   **Input:** Expects data with the following columns (0-indexed if pasted directly):
    *   Column `G` (index 6): Phone
    *   Column `J` (index 9): Business Name
    *   Column `K` (index 10): Full Name
*   **Processing:**
    *   Similar to Earned Exits, it first tries "standard" indices.
    *   Fallback "adjusted" indices:
        *   Phone: index 3
        *   Business Name: index 6
        *   Full Name: index 7
    *   A row is considered valid if it has a non-empty, valid-looking phone number. Email is not expected for this source.
    *   Full names are split.
*   **Output CSV Columns:** `Phone`, `Email` (always blank), `First Name`, `Last Name`, `Business Name`, `Source` (fixed to "Quan Cao").
*   **Filename:** `Contacts_Quan_Cao_YYYYMMDD.csv`

#### Common Logic for Pasted Data

*   **Parsing:** Pasted data is parsed by PapaParse, assuming tab (`\t`) as the delimiter.
*   **Empty Lines:** `skipEmptyLines: 'greedy'` is used in PapaParse to ignore lines that are completely empty or contain only whitespace.
*   **Header Handling:** The script is designed to be robust against the presence of a header row in the pasted data. The index-based extraction and validation logic implicitly skips rows that don't match expected data patterns (like a header).
*   **Validation:** For Earned Exits, either phone or email must be present. For Quan Cao, phone must be present and look like a phone number (contains digits, hyphens, parentheses, spaces, dots, and not multiple consecutive letters).

### Section 2: Generate Opportunity CSV from Uploaded File

![Section 2](https://github.com/MaffyxProjects/Lead-Import-Export-Builder/blob/main/Screenshot%202025-05-08%20151643.png?raw=true)

This section creates an Opportunity CSV based on an existing CSV file provided by the user.

*   **Input:**
    *   A CSV file.
    *   The user must select a "Seller Referral Source" (Earned Exits or Quan Cao) via radio buttons. This value will be added to every row in the output.
    *   The uploaded CSV **must** contain columns (case-insensitive, leading/trailing spaces in headers are trimmed):
        *   `Contact Id`
        *   `Business Name`
        *   `First Name`
        *   `Last Name`
*   **Processing:**
    *   PapaParse parses the uploaded CSV, automatically detecting headers and converting them to lowercase.
    *   For each row:
        *   `Contact Id` is mandatory. Rows without it are skipped.
        *   `opportunity name` is generated:
            1.  Uses `Business Name` if available.
            2.  If `Business Name` is empty, it uses `First Name` + `Last Name`.
            3.  If all are empty, it defaults to "Opportunity [Contact Id]" or "Opportunity Row [Number]".
        *   Static values are filled in for:
            *   `Pipeline`: "Sellers"
            *   `Stage`: "Prospective seller auto follow up"
            *   `Lead Value`: (empty)
            *   `Opportunity Owner`: "Trent Lee"
            *   `status`: "Open"
*   **Output CSV Columns:** `opportunity name`, `Contact ID`, `Pipeline`, `Stage`, `Lead Value`, `Seller Referral Source`, `Opportunity Owner`, `status`.
*   **Filename:** `Opportunities_Export_[SelectedSource]_YYYYMMDD.csv` (e.g., `Opportunities_Export_Earned_Exits_20231027.csv`)

## 4. Key Helper Functions

These JavaScript functions are defined in `script.js` and used across different parts of the tool.

### `splitName(fullName)`

*   Takes a full name string.
*   Splits it into `firstName` and `lastName`.
*   Handles single names (lastName becomes "."), names with multiple parts, and the specific marker `(no last name given)` (case-insensitive), where `lastName` also becomes ".".
*   Returns an object: `{ firstName: string, lastName: string }`.

### `downloadCSV(csvContent, filename)`

*   Takes the generated CSV string and a desired filename.
*   Creates a Blob from the CSV content.
*   Uses a temporary `<a>` (anchor) element to trigger a browser download of the Blob as a file.

### `getFormattedDate()`

*   Returns the current date as a string in `YYYYMMDD` format. Used for naming the output files.

## 5. Error Handling & Status Messages

*   The tool provides feedback to the user via status messages displayed below each section's generate button.
*   Messages indicate:
    *   Processing status.
    *   Successful generation, including the number of rows processed and the filename.
    *   Errors encountered (e.g., no data pasted, PapaParse errors, missing required columns in uploaded files, no valid rows found after processing).
*   Console logs (`console.log`, `console.warn`, `console.error`) are used extensively in `script.js` for debugging purposes, providing detailed insight into the processing steps and data transformations.
*   For pasted data, PapaParse errors (e.g., malformed rows) are reported as warnings, and the tool attempts to process the valid parts.
*   For uploaded Opportunity CSVs, missing required headers (`contact id`, `business name`, `first name`, `last name`) are critical errors that halt processing. Other parsing issues like mismatched field counts might be reported as warnings if processing can still continue.

---
&copy; CSV Generator Tool Documentation
