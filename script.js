document.addEventListener('DOMContentLoaded', () => {
    const logInput = document.getElementById('log-input');
    const addButton = document.getElementById('add-button');
    const exportButton = document.getElementById('export-button');
    const logEntriesContainer = document.getElementById('log-entries');
    const categorySelect = document.getElementById('category-select');
    const themeToggleButton = document.getElementById('theme-toggle');
    const importButton = document.getElementById('import-button');
    const importFileInput = document.getElementById('import-file');
    const searchInput = document.getElementById('search-input');

    // Load entries from localStorage
    loadEntries();
    applySavedTheme(); // Apply saved theme on load

    // Add entry on button click
    addButton.addEventListener('click', addEntry);

    // Filter entries when category selection changes
    categorySelect.addEventListener('change', filterEntries);
    searchInput.addEventListener('input', filterEntries); // Filter as user types in search
    addButton.addEventListener('click', addEntry);

    // Add entry on Enter key press in the input field
    logInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addEntry();
        }
    });

    // Toggle theme on button click
    themeToggleButton.addEventListener('click', toggleTheme);

    // Trigger hidden file input when import button is clicked
    importButton.addEventListener('click', () => {
        importFileInput.click();
    });

    // Handle file selection for import
    importFileInput.addEventListener('change', handleFileImport);
    logInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addEntry();
        }
    });

    function addEntry() {
        const category = categorySelect.value;
        const text = logInput.value.trim();
        if (text === '') {
            return; // Don't add empty entries
        }

        const timestamp = new Date();
        const entry = {
            text: text,
            category: category, // Add category
            timestamp: timestamp.toISOString() // Store timestamp in ISO format
        };

        // Get existing entries, add the new one, and save
        const entries = getEntries();
        entries.push(entry);
        saveEntries(entries);

        // Refresh the display to include the new entry at the top
        filterEntries();

        // Clear the input field
        logInput.value = '';
        categorySelect.value = 'Air'; // Reset category dropdown to default 'Air'

        // No need to scroll, new entry appears at the top
    } // End of addEntry function

    // Export entries on export button click
    exportButton.addEventListener('click', exportEntries);

    function exportEntries() {
        const entries = getEntries();
        if (entries.length === 0) {
            alert("No entries to export.");
            return;
        }

        const jsonString = JSON.stringify(entries, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'activity_log.json';
        document.body.appendChild(a); // Append anchor to body
        a.click(); // Programmatically click the anchor to trigger download
        document.body.removeChild(a); // Remove anchor from body
        URL.revokeObjectURL(url); // Clean up the object URL
    } // End of exportEntries function

    function displayEntry(entry) {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('log-entry');
        // Use timestamp as a unique ID for the element
        entryDiv.dataset.timestamp = entry.timestamp;

        const contentWrapper = document.createElement('div'); // Wrapper for text and timestamp
        contentWrapper.style.flexGrow = '1'; // Allow wrapper to take space
        contentWrapper.style.display = 'flex'; // Use flex for category/text alignment
        contentWrapper.style.alignItems = 'center'; // Align items vertically
        contentWrapper.style.flexWrap = 'wrap'; // Allow wrapping if needed

        // Add category tag if present
        if (entry.category) {
            const categorySpan = document.createElement('span');
            categorySpan.classList.add('log-category');
            categorySpan.textContent = entry.category;
            contentWrapper.appendChild(categorySpan);
        }

        const textSpan = document.createElement('span');
        textSpan.classList.add('log-text');
        textSpan.textContent = entry.text;

        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('log-timestamp');
        const date = new Date(entry.timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const dateString = date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
        timestampSpan.textContent = `${timeString} ${dateString}`;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'X'; // Simple 'X' for delete
        deleteButton.title = 'Delete entry';
        deleteButton.addEventListener('click', () => {
            deleteEntry(entry.timestamp);
        });

        contentWrapper.appendChild(textSpan);
        // Create a separate div for timestamp to ensure it appears below
        const timestampDiv = document.createElement('div');
        timestampDiv.style.width = '100%'; // Make it take full width
        timestampDiv.appendChild(timestampSpan);
        contentWrapper.appendChild(timestampDiv);
        // Redundant line removed: timestampSpan is already inside timestampDiv

        entryDiv.appendChild(contentWrapper);
        entryDiv.appendChild(deleteButton);
        logEntriesContainer.appendChild(entryDiv);
    }

    function deleteEntry(timestamp) {
        // Confirm before deleting
        const confirmDelete = confirm("Are you sure you want to delete this entry?");
        if (confirmDelete) {
            // Remove from DOM
            const entryDiv = logEntriesContainer.querySelector(`[data-timestamp="${timestamp}"]`);
            if (entryDiv) {
                entryDiv.remove();
            }

            // Remove from localStorage
            let entries = getEntries();
            entries = entries.filter(entry => entry.timestamp !== timestamp);
            saveEntries(entries);
        }
    }

    function loadEntries() {
        filterEntries(); // Load and filter entries based on the current dropdown selection
    }

    function filterEntries() {
        const selectedCategory = categorySelect.value;
        const searchTerm = searchInput.value.toLowerCase().trim();
        const entries = getEntries();
        logEntriesContainer.innerHTML = ''; // Clear existing display

        // Reverse the entries to display newest first
        const reversedEntries = entries.slice().reverse();
        reversedEntries.forEach(entry => {
            const entryCategory = entry.category || ""; // Treat undefined/null category as empty string
            const entryText = entry.text.toLowerCase();

            // Check category match
            const categoryMatch = (selectedCategory === 'all' || entryCategory === selectedCategory);

            // Check search term match (if search term exists)
            const searchMatch = (!searchTerm || entryText.includes(searchTerm));

            // Display entry only if both category and search term match
            if (categoryMatch && searchMatch) {
                displayEntry(entry);
            }
        });
        // Scroll to the top after filtering/loading
        logEntriesContainer.scrollTop = 0;
    }

    function getEntries() {
        const entriesJson = localStorage.getItem('activityLogEntries');
        return entriesJson ? JSON.parse(entriesJson) : [];
    }

    function saveEntries(entries) {
        localStorage.setItem('activityLogEntries', JSON.stringify(entries));
    }

    // --- Theme Switching Functions ---

    function applySavedTheme() {
        const savedTheme = localStorage.getItem('activityLogTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme'); // Default to light
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        // Save the current theme preference
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('activityLogTheme', 'dark');
        } else {
            localStorage.setItem('activityLogTheme', 'light');
        }
    }

    // --- Import Function ---

    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) {
            return; // No file selected
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const importedEntries = JSON.parse(e.target.result);

                // Basic validation: check if it's an array
                if (!Array.isArray(importedEntries)) {
                    throw new Error("Invalid JSON format: Data must be an array.");
                }

                // Optional: More detailed validation per entry could be added here

                // Confirm before replacing existing data
                const replaceConfirm = confirm("Importing will replace all current entries. Are you sure you want to proceed?");

                if (replaceConfirm) {
                    saveEntries(importedEntries); // Save the imported entries
                    loadEntries(); // Reload and display the new entries
                    alert("Entries imported successfully!");
                }
            } catch (error) {
                alert(`Error importing file: ${error.message}`);
            } finally {
                // Reset file input value to allow importing the same file again if needed
                 importFileInput.value = null;
            }
        };

        reader.onerror = () => {
            alert("Error reading file.");
             importFileInput.value = null; // Reset on error too
        };

        reader.readAsText(file);
        } // End of handleFileImport function
    // Removed misplaced lines 258 and 259
});