document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to DOM elements ---
    // Make sure these IDs match your HTML file!

    // Earned Exits Elements (Paste)
    const pasteDataEarnedExitsEl = document.getElementById('pasteDataEarnedExits');
    const generateCsvEarnedExitsBtn = document.getElementById('generateCsvEarnedExits');
    const statusEarnedExitsEl = document.getElementById('statusEarnedExits');

    // Quan Cao Elements (Paste)
    const pasteDataQuanCaoEl = document.getElementById('pasteDataQuanCao');
    const generateCsvQuanCaoBtn = document.getElementById('generateCsvQuanCao');
    const statusQuanCaoEl = document.getElementById('statusQuanCao');

    // Opportunity Elements (File Upload - Using IDs from index.html)
    const opportunityFileEl = document.getElementById('csvFileInput'); // Updated ID
    const generateOpportunityCsvBtn = document.getElementById('generateCsv2'); // Updated ID
    const statusOpportunityEl = document.getElementById('status2'); // Updated ID
    // Radio buttons are queried inside the handler using name="sourceOption"


    // --- Helper Functions (Shared) ---

    /**
     * Splits a full name into first and last name.
     * Handles single names, multiple middle names/initials, and "(no last name given)".
     * If only one name is provided or "(no last name given)" is present, sets lastName to ".".
     * @param {string} fullName The full name string.
     * @returns {{firstName: string, lastName: string}} Object with firstName and lastName.
     */
    function splitName(fullName) {
        // Handle invalid input
        if (!fullName || typeof fullName !== 'string') {
            return { firstName: '', lastName: '' };
        }

        let processedName = fullName.trim();
        let firstName = '';
        let lastName = '';
        const noLastNameMarker = "(no last name given)";
        const noLastNameMarkerLower = noLastNameMarker.toLowerCase();

        // Check if the marker exists (case-insensitive)
        const markerIndex = processedName.toLowerCase().indexOf(noLastNameMarkerLower);

        if (markerIndex !== -1) {
            // --- Case 1: "(no last name given)" marker found ---
            firstName = processedName.substring(0, markerIndex).trim();
            lastName = ".";
            if (!firstName && processedName.toLowerCase() === noLastNameMarkerLower) {
                firstName = '';
            }
        } else {
            // --- Case 2: Marker not found, split by whitespace ---
            const nameParts = processedName.split(/\s+/);

            if (nameParts.length === 1) {
                if (nameParts[0] === "") {
                     firstName = '';
                     lastName = '';
                } else {
                    firstName = nameParts[0]; // This could be "FALSE" if that's the input
                    lastName = ".";
                }
            } else if (nameParts.length > 1) {
                firstName = nameParts.shift() || '';
                lastName = nameParts.join(' ') || '';
            } else {
                firstName = '';
                lastName = '';
            }
        }

        return { firstName, lastName };
    }


    /**
     * Triggers a browser download for the given CSV content.
     * @param {string} csvContent The CSV data as a string.
     * @param {string} filename The desired name for the downloaded file.
     */
    function downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up
        } else {
            // Fallback for older browsers
            alert("CSV download requires a modern browser.");
        }
    }

    /**
     * Gets the current date formatted as YYYYMMDD.
     * @returns {string} Formatted date string.
     */
    function getFormattedDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }


    // --- Logic for Task 1: Earned Exits (Paste) ---
    if (generateCsvEarnedExitsBtn) {
        generateCsvEarnedExitsBtn.addEventListener('click', () => {
            console.log("Generate Earned Exits button clicked.");
            if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = 'Processing Earned Exits...';
             if (!pasteDataEarnedExitsEl) {
                if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = 'Error: Paste area element not found.';
                console.error("Element with ID 'pasteDataEarnedExits' not found.");
                return;
            }
            const rawData = pasteDataEarnedExitsEl.value; // Keep leading/trailing whitespace for PapaParse
            if (!rawData.trim()) { // Check if it's effectively empty
                if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = 'Error: No data pasted for Earned Exits.';
                console.error("No data in 'pasteDataEarnedExits' textarea.");
                return;
            }
            if (typeof Papa === 'undefined') {
                if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = 'Error: PapaParse library is not loaded! Check HTML includes.';
                console.error("PapaParse library (Papa) is not defined.");
                return;
            }

            console.log("Parsing pasted Earned Exits data using Papa.parse...");
            Papa.parse(rawData, {
                delimiter: "\t", // Assuming tab-separated from spreadsheet paste
                header: false,
                skipEmptyLines: 'greedy', // Use 'greedy' to skip lines with only whitespace too
                dynamicTyping: false,
                complete: (results) => {
                    console.log("Earned Exits - PapaParse complete. Parsed results:", results);
                    let warningMessage = "";
                    if (results.errors.length > 0) {
                        console.warn("Earned Exits - PapaParse Parsing warnings:", results.errors);
                        warningMessage = `Warning: Issues parsing some rows. Check format.\n`;
                        // Show only first few errors to avoid flooding status
                        results.errors.slice(0, 3).forEach(err => { warningMessage += `  - Row ${err.row}: ${err.message}\n`; });
                        if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = warningMessage;
                    }
                    const inputData = results.data; // This is the array of rows AFTER skipEmptyLines

                    // Log the raw inputData array for debugging
                    console.log("Earned Exits - inputData array AFTER parsing (includes header if present):", JSON.stringify(inputData, null, 2));


                    if (!inputData || inputData.length === 0) {
                        if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = (warningMessage ? warningMessage + "\n" : "") + 'Error: No valid data rows found after parsing Earned Exits.';
                        console.log("Earned Exits - No data rows found in parsed results.");
                        return;
                    }
                    console.log(`Earned Exits - Found ${inputData.length} rows after initial parse (incl. potential header).`);
                     if (inputData.length > 0) {
                        // Log the first row that map() will process
                        console.log("Earned Exits - First row entering map() function:", JSON.stringify(inputData[0]));
                    }

                    let firstValidRowLogged_EE = false;

                    // Map over the inputData array directly. The logic inside handles skipping non-data rows.
                    const dataForCsv = inputData.map((row, index) => {
                        // rowIndexForLog is the 1-based index within the inputData array
                        // If header is present, row 1 is header, row 2 is first data row, etc.
                        const rowIndexForLog = index + 1;

                        // --- Blank/Invalid Row Check (Safety Net) ---
                        if (!Array.isArray(row)) {
                            console.warn(`EE - Skipping row ${rowIndexForLog} as it's not an array.`);
                            return null;
                        }
                        // isEffectivelyBlank check is mostly redundant due to skipEmptyLines: 'greedy'
                        // but kept as a safeguard.
                        const isEffectivelyBlank = row.length === 0 || row.every(cell => !String(cell).trim());
                        if (isEffectivelyBlank) {
                            console.log(`EE - Skipping row ${rowIndexForLog} as it's effectively blank (should have been caught by PapaParse).`);
                            return null;
                        }
                        // --- End Blank/Invalid Row Check ---

                        console.log(`EE - Processing row ${rowIndexForLog} from inputData:`, JSON.stringify(row), `Length: ${row.length}`);

                        // --- Define Indices ---
                        const std_nameIndex = 3, std_bizIndex = 6, std_phoneIndex = 8, std_emailIndex = 9;
                        const adj_nameIndex = 2, adj_bizIndex = 5, adj_phoneIndex = 7, adj_emailIndex = 8;
                        const minStdLength = Math.max(std_nameIndex, std_bizIndex, std_phoneIndex, std_emailIndex) + 1; // 10
                        const minAdjLength = Math.max(adj_nameIndex, adj_bizIndex, adj_phoneIndex, adj_emailIndex) + 1; // 9

                        let phone = '', email = '', fullName = '', businessName = '';
                        let indicesUsed = 'none';
                        let extractionSuccessful = false;

                        // --- Attempt 1: Standard Indices ---
                        if (row.length >= minStdLength) {
                            indicesUsed = 'standard';
                            let temp_phone = String(row[std_phoneIndex] || '').trim();
                            let temp_email = String(row[std_emailIndex] || '').trim();
                            let temp_fullName = String(row[std_nameIndex] || '').trim();
                            let temp_businessName = String(row[std_bizIndex] || '').trim();

                            let looksLikePhone_EE = /[0-9\-() +.]+/.test(temp_phone) && !/[a-zA-Z]{3,}/.test(temp_phone);
                            let looksLikeEmail_EE = temp_email && temp_email.includes('@') && temp_email.includes('.');

                            if (looksLikePhone_EE || looksLikeEmail_EE) {
                                phone = temp_phone;
                                email = temp_email;
                                fullName = temp_fullName;
                                businessName = temp_businessName;
                                extractionSuccessful = true;
                                console.log(`EE - Row ${rowIndexForLog}: Using standard indices. Phone='${phone}', Email='${email}'`);
                            } else {
                                console.log(`EE - Row ${rowIndexForLog}: Standard indices failed validation (Phone='${temp_phone}', Email='${temp_email}'). Will try adjusted.`);
                            }
                        } else {
                            console.log(`EE - Row ${rowIndexForLog}: Too short (${row.length}) for standard indices (required >= ${minStdLength}). Will try adjusted.`);
                        }

                        // --- Attempt 2: Adjusted Indices (Fallback) ---
                        if (!extractionSuccessful && row.length >= minAdjLength) {
                            indicesUsed = 'adjusted';
                            console.log(`EE - Row ${rowIndexForLog}: Attempting adjusted indices.`);
                            let temp_phone = String(row[adj_phoneIndex] || '').trim();
                            let temp_email = String(row[adj_emailIndex] || '').trim();
                            let temp_fullName = String(row[adj_nameIndex] || '').trim();
                            let temp_businessName = String(row[adj_bizIndex] || '').trim();

                            let looksLikePhone_EE = /[0-9\-() +.]+/.test(temp_phone) && !/[a-zA-Z]{3,}/.test(temp_phone);
                            let looksLikeEmail_EE = temp_email && temp_email.includes('@') && temp_email.includes('.');

                            if (looksLikePhone_EE || looksLikeEmail_EE) {
                                phone = temp_phone;
                                email = temp_email;
                                fullName = temp_fullName;
                                businessName = temp_businessName;
                                extractionSuccessful = true;
                                console.log(`EE - Row ${rowIndexForLog}: Using adjusted indices. Phone='${phone}', Email='${email}'`);
                            } else {
                                console.warn(`EE - Row ${rowIndexForLog}: Adjusted indices also failed validation (Phone='${temp_phone}', Email='${temp_email}'). Skipping row.`);
                            }
                        } else if (!extractionSuccessful) {
                             console.log(`EE - Row ${rowIndexForLog}: Conditions for attempting adjusted indices not met (Already successful: ${extractionSuccessful}, Length: ${row.length}, MinAdjLength: ${minAdjLength}). Skipping row.`);
                        }


                        // --- Final Check and Output ---
                        if (!extractionSuccessful) {
                            // Check if this is the very first row from inputData (index 0)
                            if (index === 0) {
                                console.warn(`EE - Skipping row ${rowIndexForLog} (index 0 in inputData - likely header) as no valid phone/email found using either index set. Last attempted: ${indicesUsed}.`);
                            } else {
                                console.warn(`EE - Skipping row ${rowIndexForLog} as no valid phone/email found using either index set. Last attempted: ${indicesUsed}.`);
                            }
                            return null; // Skip this row (could be header or invalid data)
                        }

                        // Critical check: is there actually a non-empty phone OR email?
                        if (!phone && !email) {
                            console.warn(`EE - Skipping row ${rowIndexForLog} (final check) because BOTH phone AND email are empty after successful extraction (using ${indicesUsed} indices). Name: '${fullName}'`);
                            return null;
                        }

                        // Data is considered valid
                        const source = 'Earned Exits';
                        const { firstName, lastName } = splitName(fullName);

                        const outputRowObject = {
                            'Phone': phone,
                            'Email': email,
                            'First Name': firstName,
                            'Last Name': lastName,
                            'Business Name': businessName,
                            'Source': source
                        };

                        // Log the *first* row that successfully makes it to this point
                        if (!firstValidRowLogged_EE) {
                             console.log(`EE - Mapped first valid row (from inputData row ${rowIndexForLog}, using ${indicesUsed} indices):`, outputRowObject);
                             firstValidRowLogged_EE = true;
                        }

                        return outputRowObject;
                    }).filter(row => row !== null); // Filter out rows that returned null (headers, invalid data, empty contacts)

                    console.log(`Earned Exits - Successfully mapped ${dataForCsv.length} rows.`);
                    if (dataForCsv.length === 0) {
                         const baseMessage = warningMessage ? warningMessage.split('\n')[0] : "";
                         const errorMessage = 'Error: No valid contact rows could be processed for Earned Exits CSV (check Phone/Email columns and format, ensure data isn\'t only in first few columns).';
                         if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = baseMessage ? `${baseMessage}\n${errorMessage}` : errorMessage;
                         console.error("Earned Exits - No rows left after mapping and filtering.");
                         return;
                    }
                    try {
                        const outputHeaders = ['Phone', 'Email', 'First Name', 'Last Name', 'Business Name', 'Source'];
                        const csvOutput = Papa.unparse(dataForCsv, { columns: outputHeaders, header: true });
                        const filename = `Contacts_Earned_Exits_${getFormattedDate()}.csv`;
                        downloadCSV(csvOutput, filename);
                        const baseMessage = warningMessage ? warningMessage.split('\n')[0] : "";
                        const successMessage = `Earned Exits CSV generated (${dataForCsv.length} rows). File: ${filename}`;
                        if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = baseMessage ? `${baseMessage}\n${successMessage}` : successMessage;
                    } catch (error) {
                        console.error("Error during Earned Exits CSV generation (unparse/download):", error);
                        if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = `Error generating final Earned Exits CSV: ${error.message}`;
                    }
                },
                error: (error) => {
                    console.error("Earned Exits - PapaParse setup error:", error);
                    if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = `Error parsing pasted Earned Exits data: ${error.message}`;
                }
            });
        });
    } else {
        console.error("Element with ID 'generateCsvEarnedExits' not found in the HTML!");
        if (statusEarnedExitsEl) statusEarnedExitsEl.textContent = "Error: Generate button not found.";
    }


    // --- Logic for Task 2: Quan Cao (Paste) ---
    // *** UPDATED SECTION ***
    if (generateCsvQuanCaoBtn) {
        generateCsvQuanCaoBtn.addEventListener('click', () => {
            console.log("Generate Quan Cao button clicked.");
            if (statusQuanCaoEl) statusQuanCaoEl.textContent = 'Processing Quan Cao...';
            if (!pasteDataQuanCaoEl) {
                 if (statusQuanCaoEl) statusQuanCaoEl.textContent = 'Error: Paste area element not found.';
                 console.error("Element with ID 'pasteDataQuanCao' not found.");
                 return;
            }
            const rawData = pasteDataQuanCaoEl.value; // Keep whitespace for Papa
            if (!rawData.trim()) {
                 if (statusQuanCaoEl) statusQuanCaoEl.textContent = 'Error: No data pasted for Quan Cao.';
                 console.error("No data in 'pasteDataQuanCao' textarea.");
                 return;
            }
            if (typeof Papa === 'undefined') {
                 if (statusQuanCaoEl) statusQuanCaoEl.textContent = 'Error: PapaParse library is not loaded! Check HTML includes.';
                 console.error("PapaParse library (Papa) is not defined.");
                 return;
            }

            console.log("Parsing pasted Quan Cao data using Papa.parse...");
            Papa.parse(rawData, {
                delimiter: "\t", header: false, skipEmptyLines: 'greedy', dynamicTyping: false,
                complete: (results) => {
                    console.log("Quan Cao - PapaParse complete. Parsed results:", results);
                    let warningMessage = "";
                    if (results.errors.length > 0) {
                        console.warn("Quan Cao - PapaParse Parsing warnings:", results.errors);
                        warningMessage = `Warning: Issues parsing some rows. Check format.\n`;
                        results.errors.slice(0, 3).forEach(err => { warningMessage += `  - Row ${err.row}: ${err.message}\n`; });
                        if (statusQuanCaoEl) statusQuanCaoEl.textContent = warningMessage;
                    }
                    const inputData = results.data;

                    // Log the raw inputData array for debugging
                    console.log("Quan Cao - inputData array AFTER parsing (includes header if present):", JSON.stringify(inputData, null, 2));


                    if (!inputData || inputData.length === 0) {
                        if (statusQuanCaoEl) statusQuanCaoEl.textContent = (warningMessage ? warningMessage + "\n" : "") + 'Error: No valid data rows found after parsing Quan Cao.';
                        console.log("Quan Cao - No data rows found in parsed results.");
                        return;
                    }
                    console.log(`Quan Cao - Found ${inputData.length} rows after initial parse (incl. potential header).`);

                    if (inputData.length > 0) {
                         console.log("Quan Cao - First row entering map() function:", JSON.stringify(inputData[0]));
                    }

                    let firstValidRowLogged_QC = false;

                    // Map over the inputData array directly. The logic inside handles skipping non-data rows.
                    const dataForCsv = inputData.map((row, index) => {
                        const rowIndexForLog = index + 1; // 1-based index within inputData

                        // --- Blank/Invalid Row Check (Safety Net) ---
                        if (!Array.isArray(row)) {
                            console.warn(`QC - Skipping row ${rowIndexForLog} as it's not an array.`);
                            return null;
                        }
                        const isEffectivelyBlank = row.length === 0 || row.every(cell => !String(cell).trim());
                        if (isEffectivelyBlank) {
                            console.log(`QC - Skipping row ${rowIndexForLog} as it's effectively blank (should have been caught by PapaParse).`);
                            return null;
                        }
                        // --- End Blank/Invalid Row Check ---

                        console.log(`QC - Processing row ${rowIndexForLog} from inputData:`, JSON.stringify(row), `Length: ${row.length}`);

                        // --- Define Indices (Quan Cao Specific) ---
                        const std_phoneIndex = 6, std_bizIndex = 9, std_nameIndex = 10;
                        const adj_phoneIndex = 3, adj_bizIndex = 6, adj_nameIndex = 7;
                        const minStdLength = Math.max(std_phoneIndex, std_bizIndex, std_nameIndex) + 1; // 11
                        const minAdjLength = Math.max(adj_phoneIndex, adj_bizIndex, adj_nameIndex) + 1; // 8

                        let phone = '', personFullName = '', businessName = ''; // Use personFullName for clarity
                        let indicesUsed = 'none';
                        let extractionSuccessful = false;

                        // --- Attempt 1: Standard Indices ---
                        if (row.length >= minStdLength) {
                            indicesUsed = 'standard';
                            let temp_phone = String(row[std_phoneIndex] || '').trim();
                            let temp_personFullName = String(row[std_nameIndex] || '').trim();
                            let temp_businessName = String(row[std_bizIndex] || '').trim();

                            // Validation: Only phone is strictly required and needs validation
                            let looksLikePhone_QC = /[0-9\-() +.]+/.test(temp_phone) && !/[a-zA-Z]{3,}/.test(temp_phone);

                            if (looksLikePhone_QC) { // Check only phone validation
                                phone = temp_phone;
                                personFullName = temp_personFullName;
                                businessName = temp_businessName;
                                extractionSuccessful = true;
                                console.log(`QC - Row ${rowIndexForLog}: Using standard indices. Phone='${phone}'`);
                            } else {
                                console.log(`QC - Row ${rowIndexForLog}: Standard indices failed phone validation (Phone='${temp_phone}'). Will try adjusted.`);
                            }
                        } else {
                            console.log(`QC - Row ${rowIndexForLog}: Too short (${row.length}) for standard indices (required >= ${minStdLength}). Will try adjusted.`);
                        }

                        // --- Attempt 2: Adjusted Indices (Fallback) ---
                        if (!extractionSuccessful && row.length >= minAdjLength) {
                            indicesUsed = 'adjusted';
                            console.log(`QC - Row ${rowIndexForLog}: Attempting adjusted indices.`);
                            let temp_phone = String(row[adj_phoneIndex] || '').trim();
                            let temp_personFullName = String(row[adj_nameIndex] || '').trim();
                            let temp_businessName = String(row[adj_bizIndex] || '').trim();

                            // Re-validate using adjusted data
                            let looksLikePhone_QC = /[0-9\-() +.]+/.test(temp_phone) && !/[a-zA-Z]{3,}/.test(temp_phone);

                            if (looksLikePhone_QC) { // Check only phone validation
                                phone = temp_phone;
                                personFullName = temp_personFullName;
                                businessName = temp_businessName;
                                extractionSuccessful = true;
                                console.log(`QC - Row ${rowIndexForLog}: Using adjusted indices. Phone='${phone}'`);
                            } else {
                                console.warn(`QC - Row ${rowIndexForLog}: Adjusted indices also failed phone validation (Phone='${temp_phone}'). Skipping row.`);
                            }
                        } else if (!extractionSuccessful) {
                             console.log(`QC - Row ${rowIndexForLog}: Conditions for attempting adjusted indices not met (Already successful: ${extractionSuccessful}, Length: ${row.length}, MinAdjLength: ${minAdjLength}). Skipping row.`);
                        }


                        // --- Final Check and Output ---
                        if (!extractionSuccessful) {
                            // Check if this is the very first row from inputData (index 0)
                            if (index === 0) {
                                console.warn(`QC - Skipping row ${rowIndexForLog} (index 0 in inputData - likely header) as no valid phone found using either index set. Last attempted: ${indicesUsed}.`);
                            } else {
                                console.warn(`QC - Skipping row ${rowIndexForLog} as no valid phone found using either index set. Last attempted: ${indicesUsed}.`);
                            }
                            return null; // Skip this row (could be header or invalid data)
                        }

                        // Critical check: is there actually a non-empty phone?
                        if (!phone) {
                            console.warn(`QC - Skipping row ${rowIndexForLog} (final check) because phone is empty after successful extraction (using ${indicesUsed} indices). Person Name: '${personFullName}'`);
                            return null;
                        }

                        // Data is considered valid
                        const email = ''; // No email for Quan Cao
                        const source = 'Quan Cao';
                        const { firstName, lastName } = splitName(personFullName);

                        const outputRowObject = {
                            'Phone': phone,
                            'Email': email,
                            'First Name': firstName,
                            'Last Name': lastName,
                            'Business Name': businessName,
                            'Source': source
                        };

                         if (!firstValidRowLogged_QC) {
                            console.log(`QC - Mapped first valid row (from inputData row ${rowIndexForLog}, using ${indicesUsed} indices):`, outputRowObject);
                            firstValidRowLogged_QC = true;
                        }

                        return outputRowObject;
                    }).filter(row => row !== null); // Filter out rows that returned null (headers, invalid data, empty contacts)


                    console.log(`Quan Cao - Successfully mapped ${dataForCsv.length} rows.`);
                    if (dataForCsv.length === 0) {
                        const baseMessage = warningMessage ? warningMessage.split('\n')[0] : "";
                        const errorMessage = 'Error: No valid contact rows could be processed for Quan Cao CSV (check Phone column and format).';
                        if (statusQuanCaoEl) statusQuanCaoEl.textContent = baseMessage ? `${baseMessage}\n${errorMessage}` : errorMessage;
                        console.error("Quan Cao - No rows left after mapping and filtering.");
                        return;
                    }
                    try {
                        const outputHeaders = ['Phone', 'Email', 'First Name', 'Last Name', 'Business Name', 'Source'];
                        const csvOutput = Papa.unparse(dataForCsv, { columns: outputHeaders, header: true });
                        const filename = `Contacts_Quan_Cao_${getFormattedDate()}.csv`;
                        downloadCSV(csvOutput, filename);
                        const baseMessage = warningMessage ? warningMessage.split('\n')[0] : "";
                        const successMessage = `Quan Cao CSV generated (${dataForCsv.length} rows). File: ${filename}`;
                        if (statusQuanCaoEl) statusQuanCaoEl.textContent = baseMessage ? `${baseMessage}\n${successMessage}` : successMessage;

                    } catch (error) {
                        console.error("Error during Quan Cao CSV generation (unparse/download):", error);
                        if (statusQuanCaoEl) statusQuanCaoEl.textContent = `Error generating final Quan Cao CSV: ${error.message}`;
                    }
                },
                error: (error) => {
                    console.error("Quan Cao - PapaParse setup error:", error);
                    if (statusQuanCaoEl) statusQuanCaoEl.textContent = `Error parsing pasted Quan Cao data: ${error.message}`;
                }
            });
        });
    } else {
        console.error("Element with ID 'generateCsvQuanCao' not found in the HTML!");
        if (statusQuanCaoEl) statusQuanCaoEl.textContent = "Error: Generate button not found.";
    }


    // --- Logic for Task 3: Opportunity Export (File Upload) ---
    // (Opportunity Export logic remains unchanged)
    if (generateOpportunityCsvBtn) {
        generateOpportunityCsvBtn.addEventListener('click', () => {
            console.log("Generate Opportunity Export button clicked.");
            if (statusOpportunityEl) statusOpportunityEl.textContent = 'Processing Opportunity file...';

            if (!opportunityFileEl || !opportunityFileEl.files || opportunityFileEl.files.length === 0) {
                if (statusOpportunityEl) statusOpportunityEl.textContent = 'Error: No source CSV file selected.';
                console.error("No file selected in 'csvFileInput' input.");
                return;
            }
            const inputFile = opportunityFileEl.files[0];

            const selectedSourceRadio = document.querySelector('input[name="sourceOption"]:checked');
            if (!selectedSourceRadio) {
                 if (statusOpportunityEl) statusOpportunityEl.textContent = 'Error: No Seller Referral Source selected.';
                 console.error("No radio button selected for 'sourceOption'.");
                 return;
            }
            const sellerReferralSource = selectedSourceRadio.value;
            console.log("Selected Seller Referral Source:", sellerReferralSource);

            if (typeof Papa === 'undefined') {
                if (statusOpportunityEl) statusOpportunityEl.textContent = 'Error: PapaParse library is not loaded! Check HTML includes.';
                console.error("PapaParse library (Papa) is not defined.");
                return;
            }

            console.log(`Parsing uploaded file "${inputFile.name}"...`);
            Papa.parse(inputFile, {
                header: true,
                skipEmptyLines: true, // Standard skip for CSV upload
                dynamicTyping: false, // Keep false for consistency
                transformHeader: header => header.trim().toLowerCase(), // Keep lowercase transform
                complete: (results) => {
                    console.log("Opportunity File - PapaParse complete. Parsed results:", results);

                    let warningMessage = ""; // Renamed for clarity
                    if (results.errors.length > 0) {
                        // Separate critical errors from warnings (like TooManyFields)
                        const criticalErrors = results.errors.filter(err => err.code !== 'TooManyFields' && err.code !== 'TooFewFields'); // Also ignore TooFewFields for now
                        if (criticalErrors.length > 0) {
                            console.error("Opportunity File - CRITICAL PapaParse Parsing errors:", criticalErrors);
                            let errorMsg = `Error parsing Opportunity file "${inputFile.name}". Check file format.\n`;
                            criticalErrors.slice(0, 3).forEach(err => { errorMsg += `  - Row ${err.row}: ${err.message}\n`; });
                            if (statusOpportunityEl) statusOpportunityEl.textContent = errorMsg;
                            return; // Stop processing on critical errors
                        } else if (results.errors.length > 0) {
                            // Log non-critical warnings but continue
                            console.warn("Opportunity File - Non-critical PapaParse warnings (e.g., field count mismatch):", results.errors);
                            warningMessage = ` (Warning: Some rows might have unexpected column counts, but processing continued.)`;
                        }
                    }

                    // Check for required headers after potential warnings
                    const requiredHeaders = ['contact id', 'business name', 'first name', 'last name'];
                    const actualHeaders = results.meta.fields;

                    // Handle case where actualHeaders might be undefined or empty
                    if (!actualHeaders || actualHeaders.length === 0) {
                         const errorMsg = `Error: Could not read headers from the uploaded CSV. Is the file empty or corrupted?`;
                         console.error(errorMsg);
                         if (statusOpportunityEl) statusOpportunityEl.textContent = errorMsg;
                         return;
                    }

                    const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

                    if (missingHeaders.length > 0) {
                         const errorMsg = `Error: Uploaded CSV is missing required columns: ${missingHeaders.join(', ')}. (Found: ${actualHeaders.join(', ')})`;
                         console.error(errorMsg, "Actual headers found:", actualHeaders);
                         if (statusOpportunityEl) statusOpportunityEl.textContent = errorMsg;
                         return;
                    }

                    const inputData = results.data;

                    if (!inputData || inputData.length === 0) {
                        if (statusOpportunityEl) statusOpportunityEl.textContent = 'Error: No valid data rows found in the uploaded file.' + warningMessage;
                        console.log("Opportunity File - No data rows found.");
                        return;
                    }

                    console.log(`Opportunity File - Found ${inputData.length} data rows.`);

                    const dataForCsv = inputData.map((inputRow, index) => {
                        const rowIndexForLog = index + 2; // CSV row number (approx, accounting for header)
                        const contactId = String(inputRow['contact id'] || '').trim(); // Ensure string and trim
                        const businessName = String(inputRow['business name'] || '').trim();
                        const firstName = String(inputRow['first name'] || '').trim();
                        const lastName = String(inputRow['last name'] || '').trim();

                        // --- Opportunity Name Logic ---
                        let opportunityName = businessName; // Already trimmed
                        if (!opportunityName) {
                            const fullNameFromNameFields = `${firstName} ${lastName}`.trim();
                            if (fullNameFromNameFields) {
                                opportunityName = fullNameFromNameFields;
                            } else {
                                // Fallback if no business or person name
                                opportunityName = `Opportunity ${contactId || ('Row ' + rowIndexForLog)}`;
                                console.warn(`Opportunity File - Row ${rowIndexForLog} (approx): Missing Business Name and First/Last Name. Using fallback Opportunity Name: ${opportunityName}`);
                            }
                        }

                        // --- Critical Field Check: Contact ID ---
                        if (!contactId) {
                            console.warn(`Opportunity File - Skipping row ${rowIndexForLog} (approx) due to missing Contact ID.`);
                            return null; // Skip row if Contact ID is missing
                        }

                        // --- Construct Output Row ---
                        const outputRow = {
                            'opportunity name': opportunityName,
                            'Contact ID': contactId,
                            'Pipeline': 'Sellers',
                            'Stage': 'Prospective seller auto follow up',
                            'Lead Value': '', // Keep empty as per original
                            'Seller Referral Source': sellerReferralSource,
                            'Opportunity Owner': 'Trent Lee',
                            'status': 'Open'
                        };

                        if (index === 0) { // Log first row mapping for debugging
                            console.log("Opportunity File - Input Row 0 (keys lowercase):", inputRow);
                            console.log("Opportunity File - Output Row 0:", outputRow);
                        }

                        return outputRow;
                    }).filter(row => row !== null); // Filter out skipped rows

                    console.log(`Opportunity File - Successfully mapped ${dataForCsv.length} rows for export.`);

                    if (dataForCsv.length === 0) {
                        if (statusOpportunityEl) statusOpportunityEl.textContent = 'Error: No valid Opportunity rows could be generated (check for Contact IDs).' + warningMessage;
                        console.error("Opportunity File - No rows left after mapping and filtering.");
                        return;
                    }

                    try {
                        console.log("Opportunity File - Calling Papa.unparse...");
                        const outputHeaders = [
                            'opportunity name', 'Contact ID', 'Pipeline', 'Stage',
                            'Lead Value', 'Seller Referral Source', 'Opportunity Owner', 'status'
                        ];
                        const csvOutput = Papa.unparse(dataForCsv, { columns: outputHeaders, header: true });

                        console.log("Opportunity File - Papa.unparse successful. Generating filename...");
                        const formattedDate = getFormattedDate();
                        const sourceSlug = sellerReferralSource.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''); // Sanitize slug
                        const filename = `Opportunities_Export_${sourceSlug}_${formattedDate}.csv`;
                        console.log("Opportunity File - Generated filename:", filename);

                        downloadCSV(csvOutput, filename);
                        if (statusOpportunityEl) statusOpportunityEl.textContent = `Opportunity Export CSV generated (${dataForCsv.length} rows). File: ${filename}${warningMessage}`;

                    } catch (error) {
                        console.error("Error during Opportunity Export CSV generation (unparse/download):", error);
                        if (statusOpportunityEl) statusOpportunityEl.textContent = `Error generating final Opportunity Export CSV: ${error.message}`;
                    }
                },
                error: (error, file) => {
                    console.error("Opportunity File - PapaParse error processing file:", error, file);
                    if (statusOpportunityEl) statusOpportunityEl.textContent = `Error processing file "${file ? file.name : 'unknown'}": ${error.message}.`;
                }
            });
        });
    } else {
        console.error("Element with ID 'generateCsv2' not found in the HTML!");
        if (statusOpportunityEl) statusOpportunityEl.textContent = "Error: Generate button not found.";
    }

}); // End of DOMContentLoaded listener
