var initialRows;
var ZAGlobal = {
    selectedRecords: [],
    allRecords: [],
    filteredRecords: [],
    processedRecords: [],
    waitingRecords: [],
    recordsPerPage: 10,
    currentPage: 1,
    totalPages: 0,

    reRenderTableBody: function () {
        $('._tbody').empty();
        var tbody = '';

        if (ZAGlobal.filteredRecords.length === 0 && ZAGlobal.processedRecords.length === 0) {
            $('._tbody').html('<tr><td colspan="9">No records available to approve/reject.</td></tr>');
        } else {
            // Apply pagination
            var startIndex = (ZAGlobal.currentPage - 1) * ZAGlobal.recordsPerPage;
            var endIndex = startIndex + ZAGlobal.recordsPerPage;
            var recordsToShow = ZAGlobal.filteredRecords.slice(startIndex, endIndex);

            recordsToShow.forEach(function (record) {

                var initiatedTime = new Date(record.initiated_time);
                var currentTime = new Date();
                var timeDiff = currentTime - initiatedTime;
                var daysAgo = Math.floor(timeDiff / (1000 * 3600 * 24));
                var options = {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                };
                var formattedDate = initiatedTime.toLocaleString('en-IN', options);

                tbody += `<tr data-id="${record.entity.id}" data-module="${record.module}">
                            <td><input type="checkbox" data-id="${record.entity.id}" data-module="${record.module}" ${ZAGlobal.selectedRecords.includes(record.entity.id) ? 'checked' : ''}></td>
                            <td>${record.entity.name}</td>
                            <td>${record.rule.name}</td>
                            <td>${record.module}</td>
                            <td>${record.criteria_statements || 'N/A'}</td>
                            <td>${formattedDate}</td>
                            <td>${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago</td>
                                <td>
                                <button class="approve-btn" data-id="${record.entity.id}">Approve</button>
                                <button class="delegate-btn" data-id="${record.entity.id}">Delegate</button>
                                <button class="reject-btn" data-id="${record.entity.id}">Reject</button>
                            </td>
                            <td>${record.is_approved ? 'Approved' : record.is_rejected ? 'Rejected' : record.is_delegated ? 'Delegated' : 'Waiting for approval'}</td>
                        </tr>`;
                // console.log(record);
            });

            ZAGlobal.processedRecords.forEach(function (record) {
                var initiatedTime = new Date(record.initiated_time);
                var currentTime = new Date();
                var timeDiff = currentTime - initiatedTime;
                var daysAgo = Math.floor(timeDiff / (1000 * 3600 * 24));
                var options = {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                };
                var formattedDate = initiatedTime.toLocaleString('en-IN', options);

                tbody += `<tr data-id="${record.entity.id}" data-module="${record.module}">
                            <td><input type="checkbox" data-id="${record.entity.id}" data-module="${record.module}" ${ZAGlobal.selectedRecords.includes(record.entity.id) ? '' : ''} disabled class="disabled-checkbox"></td>
                            <td>${record.entity.name}</td>
                            <td>${record.rule.name}</td>
                            <td>${record.module}</td>
                            <td>${record.criteria_statements || 'N/A'}</td>
                            <td>${formattedDate}</td>
                            <td>${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago</td>
                            <td>
                                <button class="approve-btn" data-id="${record.entity.id}" disabled>Approve</button>
                                <button class="delegate-btn" data-id="${record.entity.id}" disabled>Delegate</button>
                                <button class="reject-btn" data-id="${record.entity.id}" disabled>Reject</button>   
                            </td>
                            <td>${record.is_approved ? 'Approved' : record.is_rejected ? 'Rejected' : record.is_delegated ? 'Delegated' : 'Waiting for approval'}</td>
                            </tr>`;
            });

            $('._tbody').append(tbody);
        }
        ZAGlobal.updatePagination();
        resetHeaderCheckbox();
          // Sorting related.
          let initialTBody = document.querySelector("._tbody");
          initialRows = Array.from(initialTBody.rows);
          //sorting related

    },

    updatePagination: function () {
        var totalRecords = ZAGlobal.filteredRecords.length;
        ZAGlobal.totalPages = Math.ceil(totalRecords / ZAGlobal.recordsPerPage);

        var paginationHtml = `
            <select id="recordsPerPage">
                <option value="10" ${ZAGlobal.recordsPerPage === 10 ? 'selected' : ''}>10 Records per page</option>
                <option value="20" ${ZAGlobal.recordsPerPage === 20 ? 'selected' : ''}>20 Records per page</option>
                <option value="30" ${ZAGlobal.recordsPerPage === 30 ? 'selected' : ''}>30 Records per page</option>
                <option value="40" ${ZAGlobal.recordsPerPage === 40 ? 'selected' : ''}>40 Records per page</option>
                <option value="50" ${ZAGlobal.recordsPerPage === 50 ? 'selected' : ''}>50 Records per page</option>
                <option value="100" ${ZAGlobal.recordsPerPage === 100 ? 'selected' : ''}>100 Records per page</option>
            </select>
            <button id="prevPageBtn" ${ZAGlobal.currentPage === 1 ? 'disabled' : ''}></button>
            <span>${ZAGlobal.currentPage} - ${ZAGlobal.totalPages}</span>
            <button id="nextPageBtn" ${ZAGlobal.currentPage === ZAGlobal.totalPages ? 'disabled' : ''}> </button>
        `;
        $('#paginationFooter').html(paginationHtml);
        ZAGlobal.bindPaginationEvents();
    },

    bindPaginationEvents: function () {
        $('#recordsPerPage').on('change', function () {
            ZAGlobal.recordsPerPage = parseInt(this.value);
            ZAGlobal.currentPage = 1;
            ZAGlobal.reRenderTableBody();
        });

        $('#prevPageBtn').on('click', function () {
            if (ZAGlobal.currentPage > 1) {
                ZAGlobal.currentPage--;
                ZAGlobal.reRenderTableBody();
            }
        });

        $('#nextPageBtn').on('click', function () {
            if (ZAGlobal.currentPage < ZAGlobal.totalPages) {
                ZAGlobal.currentPage++;
                ZAGlobal.reRenderTableBody();
            }
        });
    }
};

async function populateUserList() {
    try {
        const res = await ZOHO.CRM.API.getAllUsers({ Type: "AllUsers" });

        if (res.users && res.users.length === 0) {
            ZAGlobal.triggerToast('No users found to assign.', 3000, 'warning');
            return;
        }
        $('#delegateSection').show();

        const userSelect = $('#userSelect');
        userSelect.empty();

        userSelect.append(new Option('Choose User', '', false, false));
        userSelect.find('option').first().attr('disabled', true);

        const activeUsers = res.users.filter(user => user.status === 'active');

        if (activeUsers.length === 0) {
            ZAGlobal.triggerToast('No active users found to assign.', 3000, 'warning');
        }

        activeUsers.forEach((user) => {
            if (user.full_name && user.email) {
                const optionText = `${user.full_name} - (${user.email})`;
                userSelect.append(new Option(optionText, user.id));
            }
        });

    } catch (error) {
        console.log('Error fetching users:', error);
        ZAGlobal.triggerToast('Failed to fetch user list. Please try again later.', 3000, 'warning');
    }
}

ZAGlobal.buttonAction = async function (action, recordId = null) {
    // console.log(`Action: ${action} for Record id ${recordId}`);     

    let recordsToProcess = [];
    if (recordId) {
        // Single record action
        const record = ZAGlobal.waitingRecords.find(rec => rec.entity.id == recordId);
        if (!record) {
            ZAGlobal.triggerToast('Record not found.', 3000, 'warning');
            return;
        }
        recordsToProcess.push(record);
    } else {
        // Bulk action
        const checkedRecords = ZAGlobal.selectedRecords.length;
        if (checkedRecords === 0) {
            ZAGlobal.triggerToast('Please select at least one record to approve/reject.', 3000, 'warning');
            return;
        }
        recordsToProcess = ZAGlobal.waitingRecords.filter(rec => ZAGlobal.selectedRecords.includes(rec.entity.id));
    }

    document.getElementById('approvalRejectPopup').style.display = 'none';
    document.getElementById('approvalRejectPopup').style.display = 'flex';
    document.getElementById('popupTitle').textContent = action === 'approve' ? 'Approve Records' : action === 'reject' ? 'Reject Records' : 'Delegate Records';
    document.getElementById('commentSection').style.display = action === 'reject' ? 'none' : 'block';
    document.getElementById('comment').value = '';
    document.getElementById('rejectionReason').value = 'selectReasonOption';
    document.getElementById('rejectionReasonSection').style.display = action === 'reject' ? 'block' : 'none';
    document.getElementById('otherReasonContainer').style.display = 'none';
    document.getElementById('submitActionBtn').textContent = action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Delegate';

    const submitButton = document.getElementById('submitActionBtn');
    submitButton.removeEventListener('click', handleSubmitAction);
    submitButton.addEventListener('click', () => handleSubmitAction(recordsToProcess, action));

    if (action !== 'delegate') {
        document.getElementById('delegateSection').style.display = 'none';
    }

    if (action === 'delegate') {
        document.getElementById('delegateSection').style.display = 'block';
        await populateUserList();
    }

    $('#rejectionReason').on('change', function () {
        const selectedReason = $(this).val();
        if (selectedReason === 'Other') {
            $('#otherReasonContainer').show();
        } else {
            $('#otherReasonContainer').hide();
        }
    });

    // Handle the Cancel button to close the popup
    document.getElementById('cancelPopupBtn').addEventListener('click', () => {
        document.getElementById('approvalRejectPopup').style.display = 'none';
        recordsToProcess = [];
    });

    // Handle the Submit button to approve or reject the records
    async function handleSubmitAction(records) {
        let comment = document.getElementById('comment').value.trim();
        let rejectionReason = '';
        let otherReason = '';
        let selectedUser = null;

        if (action === 'reject') {
            rejectionReason = $('#rejectionReason').val();
            if (rejectionReason === 'selectReasonOption') {
                ZAGlobal.triggerToast('Please select a rejection reason.', 3000, 'warning');
                return;
            }
            if (rejectionReason === 'Other') {
                otherReason = $('#otherReason').val().trim();
                if (!otherReason) {
                    ZAGlobal.triggerToast('Please specify the reason for rejection.', 3000, 'warning');
                    return;
                }
                comment = otherReason;
            }
        }

        if (action === 'delegate') {
            selectedUser = $('#userSelect').val();
            if (!selectedUser) {
                ZAGlobal.triggerToast('Please select a user to delegate the record.', 3000, 'warning');
                return;
            }
            comment = $('#comment').val().trim();
        }

        let approvedRecordsCount = 0;
        let rejectedRecordsCount = 0;
        let delegatedRecordsCount = 0;

        for (const record of records) {
            const config = {
                Entity: record.module,
                RecordID: record.entity.id,
                actionType: action,
                comments: comment,
                user: selectedUser || null
            };

            try {
                let res;
                if (action === 'delegate') {
                    res = await ZOHO.CRM.API.approveRecord(config);
                    delegatedRecordsCount++;
                    const delegatedRecord = ZAGlobal.waitingRecords.find(r => r.entity.id === res.details.id);
                    if (delegatedRecord) {
                        delegatedRecord.is_delegated = true;
                        ZAGlobal.processedRecords.push(delegatedRecord);
                        ZAGlobal.waitingRecords = ZAGlobal.waitingRecords.filter(r => r.entity.id !== res.details.id);
                        ZAGlobal.filteredRecords = ZAGlobal.filteredRecords.filter(r => r.entity.id !== res.details.id);
                        ZAGlobal.allRecords = ZAGlobal.allRecords.filter(r => r.entity.id !== res.details.id);
                        ZAGlobal.reRenderTableBody();
                    }
                    // console.log("Delegate response:", res); // Log the response for delegation
                } else {
                    res = await ZOHO.CRM.API.approveRecord(config);
                    if (action === 'approve') {
                        approvedRecordsCount++;
                    } else if (action === 'reject') {
                        rejectedRecordsCount++;
                    }
                    // console.log("Approve/Reject response:", res); 
                }

                if (!res || res.code !== 'SUCCESS') {
                    throw new Error(`Error processing the record. Response code: ${res.code}`);
                }

                const record = ZAGlobal.waitingRecords.find(r => r.entity.id === res.details.id);
                if (record) {
                    record.is_approved = action === 'approve';
                    record.is_rejected = action === 'reject';

                    ZAGlobal.processedRecords.push(record);

                    ZAGlobal.waitingRecords = ZAGlobal.waitingRecords.filter(r => r.entity.id !== res.details.id);
                    ZAGlobal.filteredRecords = ZAGlobal.filteredRecords.filter(r => r.entity.id !== res.details.id);
                    ZAGlobal.allRecords = ZAGlobal.allRecords.filter(r => r.entity.id !== res.details.id);
                    ZAGlobal.reRenderTableBody();
                }

            } catch (error) {
                console.log("Error in API call:", error);
                return;
            }
        }

        if (action === 'approve') {
            toastMessage = `${approvedRecordsCount} records were approved`;
        } else if (action === 'reject') {
            toastMessage = `${rejectedRecordsCount} records were rejected`;
        } else if (action === 'delegate') {
            toastMessage = `${delegatedRecordsCount} records were delegated`;
        }

        ZAGlobal.triggerToast(toastMessage, 3000, action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'info');

        document.getElementById('approvalRejectPopup').style.display = 'none';
        ZAGlobal.reRenderTableBody();
        recordsToProcess = [];
    }
}

$(document).on('click', '.approve-btn', function () {
    const recordId = $(this).data('id');
    ZAGlobal.buttonAction('approve', recordId);
});

$(document).on('click', '.reject-btn', function () {
    const recordId = $(this).data('id');
    ZAGlobal.buttonAction('reject', recordId);
});

$(document).on('click', '.delegate-btn', function () {
    const recordId = $(this).data('id');
    ZAGlobal.buttonAction('delegate', recordId);
});

document.getElementById('cancelPopupBtn').addEventListener('click', () => {
    document.getElementById('approvalRejectPopup').style.display = 'none';
});


let currentToast = null;

ZAGlobal.triggerToast = function (message, duration = 1000, type = 'info') {

    if (currentToast) {
        currentToast.hideToast();
    }
    const backgroundColor = (type === 'warning') ? '#FFA500' :
        (type === 'success') ? '#4CAF50' :
            (type === 'error') ? '#F44336' : '#2196F3';

    currentToast = Toastify({
        text: message,
        duration: duration,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        backgroundColor: backgroundColor,
        // close: true, 
        transition: "linear",
        onClick: function () { }
    });
    currentToast.showToast();
};

ZOHO.embeddedApp.on("PageLoad", function (data) {
    // if (data && data.Entity) {
    ZAGlobal.module = data.Entity;
    ZOHO.CRM.API.getApprovalRecords({ type: "awaiting" })
        .then(async function (toBeApproved) {
            ZAGlobal.filteredRecords = toBeApproved.data;
            ZAGlobal.allRecords = [...toBeApproved.data];
            ZAGlobal.waitingRecords = [...toBeApproved.data];
            await ZAGlobal.fetchAllCriteria();

            ZAGlobal.reRenderTableBody();
        })
        .catch(function (error) {
            console.log('Error fetching records:', error);
        });

    ZOHO.CRM.META.getModules().then(function (data) {
        if (data && Array.isArray(data.modules)) {
            populateModules(data.modules);
        }
    });
    filterRecords()
});

async function filterRecords() {
    let filtered_flag = false;
    let Module = document.getElementById('modules-list');
    let searchKey = document.getElementById('record-name-filter-input');
    let recordName_filter_type = document.getElementById('record-name-filter');
    document.getElementById('cta-filter').addEventListener('click', async (e) => {
        e.preventDefault();
        let res = await ZOHO.CRM.API.getApprovalRecords({ type: "awaiting" });
        let data = res.data;
        if (searchKey.value == '') {
            ZAGlobal.triggerToast('Enter a key to search', 1000, 'info');
            searchKey.focus();
            return;
        }

        switch (recordName_filter_type.value) {
            case 'equals':
                ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (rec.entity.name.toLowerCase().includes(searchKey.value))));
                break;
            case 'not_equals':
                ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (!rec.entity.name.toLowerCase().includes(searchKey.value))))
                break;
            case 'starts_with':
                ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (rec.entity.name.toLowerCase().startsWith(searchKey.value))))
                break;
            case 'is':
                ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (rec.entity.name.toLowerCase() === searchKey.value.toLowerCase())))
                break;
            default:
                console.log('default case');
                break;
        }
        filtered_flag = true;
        ZAGlobal.reRenderTableBody();
    })
    document.getElementById('cta-clear-filter').addEventListener('click', (e) => {
        e.preventDefault();
        if (filtered_flag) {
            filtered_flag = false;
            searchKey.value = '';
            ZAGlobal.filteredRecords = ZAGlobal.allRecords;
            ZAGlobal.reRenderTableBody();
        } else {
            ZAGlobal.triggerToast('Nothing to Clear! No Filter Applied', 1000, 'info');
        }
    })
}


// Display the active Modules  
function populateModules(modules) {
    const select = document.getElementById('module');
    select.innerHTML = '';

    const allModulesOption = document.createElement('option');
    allModulesOption.value = 'AllModules';
    allModulesOption.textContent = "All Modules";
    allModulesOption.selected = true;
    select.appendChild(allModulesOption);

    modules.forEach(module => {
        if (module.visible == true && module.visibility == 1 && module.creatable == true) {
            const option = document.createElement('option');
            option.value = module.api_name;
            option.textContent = module.actual_plural_label;
            select.appendChild(option);
            const optionClone = option.cloneNode(true);   // Sakthi's Code
            document.getElementById('modules-list').appendChild(optionClone);
        }
    });

    $('#module').select2({
        allowClear: true,
        width: '100%',
        dropdownAutoWidth: true,
        closeOnSelect: true,
        language: {
            noResults: function () {
                return "No results found";
            }
        }
    });

    $('#module').on('change', function () {
        handleModuleSelection();
    });
}

// Function to handle when the module is selected
function handleModuleSelection() {
    const selectedModule = $('#module').val();

    if (selectedModule === 'AllModules') {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords;
        ZAGlobal.reRenderTableBody();
    } else if (selectedModule) {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords.filter(record => record.module === selectedModule);
        ZAGlobal.reRenderTableBody();
    }
}

// Function to filter records based on the selected module
function filterRecordsByModule(selectedModule) {
    if (!selectedModule || selectedModule === 'AllModules') {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords;
    } else {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords.filter(record => record.module === selectedModule);
    }
    ZAGlobal.reRenderTableBody();
}

// Initialize the module selection behavior
function initializeModuleSelection(modules) {
    populateModules(modules);
    $('#module').on('change', handleModuleSelection);
}

document.getElementById('filter-icon').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#moduleContainer').classList.toggle('disabled');
    document.querySelector('.filter-div').classList.toggle('hidden');
})


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

        ZAGlobal.reRenderTableBody();
        updateSelectAllCheckboxState(); 
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

    ZAGlobal.reRenderTableBody();
    updateSelectAllCheckboxState();
});

function processAction(action, recordIds) {
    recordIds.forEach(recordId => {
        processRecord(recordId);
    });

    resetHeaderCheckbox();
    ZAGlobal.reRenderTableBody();
    updateSelectAllCheckboxState();

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

//To send the selected data to the selected record
document.querySelector('tbody').addEventListener('change', function (event) {
    if (event.target.type === 'checkbox') {
        const recordId = event.target.dataset.id;
        if (event.target.checked) {
            ZAGlobal.selectedRecords.push(recordId);
        } else {
            const index = ZAGlobal.selectedRecords.indexOf(recordId);
            if (index > -1) {
                ZAGlobal.selectedRecords.splice(index, 1);
            }
        }

        ZAGlobal.reRenderTableBody();
        const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        const headerCheckbox = document.querySelector('#selectAllCheckbox');
        updateHeaderCheckboxState(rowCheckboxes, headerCheckbox);
    }
});

ZOHO.embeddedApp.init().then(function () {
    ZOHO.CRM.CONFIG.getCurrentUser().then(function (data) {
        var userLanguage = data.users[0].locale;

        if (userLanguage === 'zh_CN') {
            loadChineseTranslations();
        } else {
            loadEnglishTranslations();
        }

    }).catch(function (error) {
        console.error('Error fetching current user:', error);
    });
}).catch(function (error) {
    console.error('Error initializing SDK:', error);
});

function loadEnglishTranslations() {
    // console.log("Defualt eng lan");
}

function loadChineseTranslations() {
    console.log("Loading Chinese translations...");
    document.getElementById('searchBar').placeholder = "搜索";
    document.getElementById('searchbtn').innerText = "搜索";
    document.getElementById('resetTableBtn').innerText = "重置";
    document.querySelector('.approve').innerText = "批准";
    document.querySelector('.reject').innerText = "拒绝";
    document.querySelector('._comments').placeholder = "评论";
    document.getElementById('recordNameHeader').innerText = "记录名称";
    document.getElementById('approvalProcessNameHeader').innerText = "审批流程名称";
    document.getElementById('recordIdHeader').innerText = "记录ID";
    document.getElementById('statusHeader').innerText = "状态";
    document.getElementById('doneBtn').innerText = "完毕";
    document.getElementById('clearBtn').innerText = "取消";
    document.querySelector('.moduleclass').innerHTML = "选择特定模块";
    document.getElementById('popup_header').innerText = "过滤器列表";
}

// console.log(res.data[0].criteria.group[0].field.api_name);

ZAGlobal.fetchAllCriteria = async function () {
    const ownerCache = {};

    const fetchPromises = ZAGlobal.filteredRecords.map(async (record) => {
        const config = { id: record.id };

        try {
            const res = await ZOHO.CRM.API.getApprovalById(config);
            const criteria = res.data[0].criteria;
            let criteriaStatement = 'N/A';

            // === GROUPED CRITERIA ===
            if (criteria?.group && Array.isArray(criteria.group)) {
                const groupOperator = criteria.group_operator || 'AND';

                const groupStatements = await Promise.all(
                    criteria.group.map(async (item) => await ZAGlobal.parseCriteriaItem(item, ownerCache))
                );

                // === Show only the first rule (cleaned summary)
                const firstVisible = (() => {
                    const raw = groupStatements[0];
                    const summaryMatch = raw.match(/<!--SUMMARY:(.*?)-->/);
                    if (summaryMatch) return summaryMatch[1];
                    return raw.replace(/<[^>]*>/g, '');
                })();

                // === Full popover content
                const popoverFull = groupStatements
                    .map(statement => `<li>${statement}</li>`)
                    .join(`<li style="list-style: none; text-align: center; font-weight: bold;">${groupOperator}</li>`);

                // === Show full popover only if grouped
                const popoverHTML = `
                    <div class="criteria-inline">
                        <div class="criteria-first-line">${firstVisible}</div>
                          <div class="popover-wrapper">
                        <span class="criteria-popover-trigger">Show more</span>
                        <div class="criteria-popover">
                            <ul class="criteria-list">${popoverFull}</ul>
                        </div>
                        </div>
                    </div>
                `;

                criteriaStatement = popoverHTML;
            }

            // === SINGLE CRITERIA ===
            else if (criteria?.field && criteria?.value !== undefined) {
                const singleStatement = await ZAGlobal.parseCriteriaItem(criteria, ownerCache);

                // Clean summary for display
                const firstVisible = (() => {
                    const summaryMatch = singleStatement.match(/<!--SUMMARY:(.*?)-->/);
                    if (summaryMatch) return summaryMatch[1];
                    return singleStatement.replace(/<[^>]*>/g, '');
                })();

                // === No popover — simple div
                const plainHTML = `
                    <div class="criteria-inline">
                        <div class="criteria-first-line">${firstVisible}</div>
                    </div>
                `;

                criteriaStatement = plainHTML;
            }

            record.criteria_statements = criteriaStatement;

        } catch (err) {
            console.error('Error fetching criteria for record ID:', record.id, err);
            record.criteria_statements = 'N/A';
        }
    });

    await Promise.all(fetchPromises);
};

ZAGlobal.parseCriteriaItem = async function (item, ownerCache) {
    const fieldApi = item.field?.api_name || item.api_name;
    const label = item.field?.label || item.field_label || fieldApi;
    const value = item.value || item.value;
    const comparator = item.comparator || 'equals';

    const userFields = ['Owner', 'Created_By', 'Modified_By', 'Last_Activity_By'];
    const isUserField = userFields.includes(fieldApi);

    // === Resolve user fields to name(s)
    if (isUserField) {
        if (Array.isArray(value)) {
            const names = await Promise.all(value.map(id => ZAGlobal.getUserName(id, ownerCache)));
            const summary = names.join(', ');
            return `${label} is<ul>${names.map(v => `<li>${v}</li>`).join('')}</ul><!--SUMMARY:${label} is ${summary}-->`;
        } else {
            const name = await ZAGlobal.getUserName(value, ownerCache);
            return `${label} is '${name}'<!--SUMMARY:${label} is ${name}-->`;
        }
    }

    if (Array.isArray(value)) {
        const summary = value.join(', ');
        return `${label} is<ul>${value.map(v => `<li>${v}</li>`).join('')}</ul><!--SUMMARY:${label} is ${summary}-->`;
    } else {
        return `${label} is '${value}'<!--SUMMARY:${label} is ${value}-->`;
    }
};


// === Helper to fetch full name from user ID ===
ZAGlobal.getUserName = async function (id, ownerCache) {
    if (ownerCache[id]) return ownerCache[id];

    try {
        const res = await ZOHO.CRM.API.getUser({ ID: id });
        // console.log(res);

        const name = res.users?.[0]?.full_name || id;
        ownerCache[id] = name;
        return name;
    } catch (e) {
        console.warn('Could not resolve user ID:', id);
        return id;
    }
};

// To show the popover up or down 
document.addEventListener('mouseover', function (e) {
    if (e.target.classList.contains('criteria-popover-trigger')) {
        const trigger = e.target;
        const wrapper = trigger.parentElement;
        const popover = wrapper.querySelector('.criteria-popover');

        if (!popover) return;

        popover.classList.remove('open-up');

        // Small delay to wait for layout to paint
        setTimeout(() => {
            const rect = popover.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow < 100 && spaceAbove > 100) {
                popover.classList.add('open-up');
            }
        }, 10);
    }
});


// Sorting Related Works - Starts

let tblHeader = document.querySelector("thead");
let tblBody = document.querySelector("._tbody");
let allHeadersList = Array.from(tblHeader.querySelectorAll("tr")[0].children);

tblHeader.addEventListener("click", (e) => {
    // e.preventDefault();
    if (e.target === allHeadersList[0] || e.target === document.querySelector('#selectAllCheckbox')) {
        e.stopImmediatePropagation();
        return;
    }
    let dropdown = (e.target.closest("th")).querySelector(".dropdown-menu")
    if (dropdown) dropdown.style.display = "flex";
    let currentDropDown = e.target.closest("th").querySelector(".dropdown-menu");
    if (currentDropDown) {
        (document.querySelectorAll(".dropdown-menu")).forEach(element => {
            if ((element.style.display === "flex") && (currentDropDown !== element)) {
                element.style.display = "none";
            }
        });

        currentDropDown.addEventListener("click", (event) => {
            console.log(currentDropDown);

            let allRows = Array.from(tblBody.rows);
            let indexOfColumn = allHeadersList.indexOf(currentDropDown.closest("th"));
            allRows.sort((rowA, rowB) => {
                let cellA = rowA.cells[indexOfColumn].innerText;
                let cellB = rowB.cells[indexOfColumn].innerText;
                return cellA.localeCompare(cellB);
            });
            if (event.target.classList.contains("desc") || event.target.classList.contains("fa-arrow-down")) {
                for (let i = allRows.length - 1; i >= 0; i--) {
                    tblBody.appendChild(allRows[i]);
                }
            }
            else if (event.target.classList.contains("asc") || event.target.classList.contains("fa-arrow-up")) {
                allRows.forEach(row => {
                    tblBody.appendChild(row)
                });

            }
            else if (event.target.classList.contains("unsort")) {
                initialRows.forEach(row => {
                    tblBody.appendChild(row)
                });
            }
        });
    }
});

window.addEventListener("click", (e) => {
    const isInsideTh = e.target.closest("th");
    if (!isInsideTh) {
        document.querySelectorAll(".dropdown-menu").forEach(element => {
            element.style.display = (element.style.display === "flex") ? "none" : "";
        });
    }
});

// sorting related ends here.
