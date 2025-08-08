// Function to handle when the module is selected
function handleModuleSelection() {
    const selectedModule = $('#module').val();

    if (selectedModule === 'All_Modules') {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords;
    } else {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords.filter(record => record.module === selectedModule);
    }

    ZAGlobal.reRenderTableBody();
    applyTranslations(); 
}

ZAGlobal.selectAll = function () {
    const headerCheckbox = document.querySelector('#selectAllCheckbox');
    const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]:not(.disabled-checkbox):not(:checked)');

    // Handle "Select All" checkbox click
    headerCheckbox.addEventListener('change', () => {
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = headerCheckbox.checked;
            const recordId = checkbox.dataset.id;
            if (checkbox.checked) {
                if (!ZAGlobal.selectedRecords.includes(recordId)) {
                    ZAGlobal.selectedRecords.push(recordId);
                }
            } else {
                const index = ZAGlobal.selectedRecords.indexOf(recordId);
                if (index > -1) {
                    ZAGlobal.selectedRecords.splice(index, 1);
                }
            }
        });

        ZAGlobal.reRenderTableBody();
        updateSelectAllCheckboxState(rowCheckboxes, headerCheckbox);
    });

    updateSelectAllCheckboxState(rowCheckboxes, headerCheckbox);
    applyTranslations(); 
};

function updateHeaderCheckboxState(rowCheckboxes, headerCheckbox) {
    const checkedCheckboxes = Array.from(rowCheckboxes).filter(checkbox => checkbox.checked);
    if (checkedCheckboxes.length === rowCheckboxes.length) {
        headerCheckbox.checked = true;
        headerCheckbox.indeterminate = false;
    }
    else if (checkedCheckboxes.length === 0) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
    }
    else {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = true;
    }
}

function updateSelectAllCheckboxState() {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:not(:disabled)');
    const selectAllCheckbox = document.querySelector('#selectAllCheckbox');

    if (!selectAllCheckbox) return;

    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    const noneChecked = Array.from(checkboxes).every(checkbox => !checkbox.checked);

    if (allChecked) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    }
    else if (noneChecked) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

document.querySelector('tbody').addEventListener('change', function (event) {
    event.preventDefault();
    if (event.target.type === 'checkbox') {
        const recordId = event.target.dataset.id;
        // Add or remove the record from selectedRecords based on checkbox state
        if (event.target.checked) {
            ZAGlobal.selectedRecords.push(recordId);

        } else {
            const index = ZAGlobal.selectedRecords.indexOf(recordId);
            if (index > -1) {
                ZAGlobal.selectedRecords.splice(index, 1);
            }
        }

        // ZAGlobal.reRenderTableBody();
        updateSelectAllCheckboxState();
        updateSelectedCount();
    }
});

// Event listener for "Select All" checkbox
document.querySelector('#selectAllCheckbox').addEventListener('change', function (event) {
    event.preventDefault();
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:not(:disabled)');

    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const recordId = checkbox.dataset.id;
        // Add or remove the record from selectedRecords based on "Select All" state
        if (isChecked && !ZAGlobal.selectedRecords.includes(recordId)) {
            ZAGlobal.selectedRecords.push(recordId);
        } else if (!isChecked) {
            const index = ZAGlobal.selectedRecords.indexOf(recordId);
            if (index > -1) {
                ZAGlobal.selectedRecords.splice(index, 1);
            }
        }
    });

    // ZAGlobal.reRenderTableBody();
    updateSelectAllCheckboxState();
    updateSelectedCount();
});

function processAction(action, recordIds) {
    recordIds.forEach(recordId => {
        processRecord(recordId);
    });

    resetHeaderCheckbox();
    ZAGlobal.reRenderTableBody();
    updateSelectAllCheckboxState();
    updateSelectedCount();
    applyTranslations(); 

}

// Function to handle the processed records
function processRecord(recordId) {
    const recordRow = document.querySelector(`tr[data-id="${recordId}"]`);
    const checkbox = recordRow.querySelector('input[type="checkbox"]');
    checkbox.disabled = true;

    recordRow.classList.add('processed');

    document.querySelector('tbody').appendChild(recordRow);

    updateSelectAllCheckboxState();
    resetHeaderCheckbox();
}

// Function to reset the header checkbox to unchecked
function resetHeaderCheckbox() {
    const selectAllCheckbox = document.querySelector('#selectAllCheckbox');
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
}

function updateSelectedCount() {
    const count = ZAGlobal.selectedRecords.length;
    const counterElement = document.getElementById('selectedCounter');
    const clearBtn = document.getElementById('clearSelectedRecords');

    if (!counterElement) {
        const newCounter = document.createElement('div');
        newCounter.id = 'selectedCounter';
        document.querySelector('#selectedRecordsCount')?.prepend(newCounter);
    }

    const updatedCounter = document.getElementById('selectedCounter');

    if (count > 0) {
        let translatedText = t["custom.APPROVAL.selectedCounterText"].replace('${count}', count).replace('${plural}', count > 1 ? 's' : '');
        updatedCounter.textContent = translatedText;
        updatedCounter.style.display = 'block';
        if (clearBtn) clearBtn.style.display = 'inline-block';
    } else {
        updatedCounter.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
    }
}


document.getElementById('clearSelectedRecords')?.addEventListener('click', () => {
    ZAGlobal.selectedRecords = [];
     document.querySelectorAll('tbody input[type="checkbox"]:not(:disabled)').forEach(checkbox => {
        checkbox.checked = false;
    });
    resetHeaderCheckbox();
    updateSelectedCount();
});