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

    reRenderTableBody: async function () {
        $('._tbody').empty();
        var tbody = '';

        const headerCheckbox = document.querySelector('#selectAllCheckbox');
        if (headerCheckbox) {
            headerCheckbox.disabled = false;
        }

        if (!ZAGlobal.domainName || !ZAGlobal.orgId) {
            try {
                const orgInfo = await ZOHO.CRM.CONFIG.getOrgInfo();
                ZAGlobal.domainName = orgInfo.org[0].country_code || 'in';
                ZAGlobal.orgId = orgInfo.org[0].domain_name;
            } catch (error) {
                ZAGlobal.triggerToast('Unable to fetch organization info.', 3000, 'error');
                return;
            }
        }
 
        if (ZAGlobal.filteredRecords.length === 0) {
            $('._tbody').html(`
                <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    <img class="img" src="no_record_img.jpg" alt="No records">
                    <div>No records available to approve/reject.</div>
                </td>
                </tr>
                `);
                if (headerCheckbox) {
                headerCheckbox.disabled = true;
                headerCheckbox.checked = false;
                headerCheckbox.indeterminate = false;
            }
            // ZAGlobal.updatePagination();
            // updateSelectedCount();
            return;
        } else {
            if (headerCheckbox) {
                headerCheckbox.disabled = false;
            }

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
                            <td><a href= "https://crm.zoho.${ZAGlobal.domainName}/crm/${ZAGlobal.orgId}/tab/${record.module}/${record.entity.id}" target="_blank" class="record-link">${record.entity.name}</a></td>
                            <td>${record.rule.name}</td>
                            <td>${record.module}</td>
                            <td>${formattedDate}</td>
                            <td>${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago</td>
                                <td class="action-buttons">
                                <button class="approve-btn" data-id="${record.entity.id}"><span class="btn-label">Approve</span></button>
                                  <span class="slash">/</span>
                                <button class="delegate-btn" data-id="${record.entity.id}"><span class="btn-label">Delegate</span></button>
                                  <span class="slash">/</span>
                                <button class="reject-btn" data-id="${record.entity.id}"><span class="btn-label">Reject</span></button>
                            </td>
                            </tr>`;
                            // console.log(record);
                            // <td>${record.is_approved ? 'Approved' : record.is_rejected ? 'Rejected' : record.is_delegated ? 'Delegated' : 'Waiting for approval'}</td>
            });


            $('._tbody').append(tbody);
        }
        ZAGlobal.updatePagination();
        resetHeaderCheckbox();
        updateSelectedCount();
        updateSelectAllCheckboxState();
        var label = ZAGlobal.userLang === 'zh_CN' ? "总记录数" : "Total Records";
        document.getElementById('totalRecordsCount').innerHTML = label + "：<strong>" + ZAGlobal.allRecords.length + "</strong>";
        // document.getElementById('totalRecordsCount').innerHTML = "Total Records : <strong>" + ZAGlobal.allRecords.length + "</strong>";
        // Sorting related.
        let initialTBody = document.querySelector("._tbody");
        initialRows = Array.from(initialTBody.rows);
    },

    updatePagination: function () {
        var totalRecords = ZAGlobal.filteredRecords.length;
        ZAGlobal.totalPages = Math.ceil(totalRecords / ZAGlobal.recordsPerPage);

        var paginationHtml = `No of records
            <select id="recordsPerPage">
                <option value="10" ${ZAGlobal.recordsPerPage === 10 ? 'selected' : ''}>10 </option>
                <option value="20" ${ZAGlobal.recordsPerPage === 20 ? 'selected' : ''}>20 </option>
                <option value="30" ${ZAGlobal.recordsPerPage === 30 ? 'selected' : ''}>30 </option>
                <option value="40" ${ZAGlobal.recordsPerPage === 40 ? 'selected' : ''}>40 </option>
                <option value="50" ${ZAGlobal.recordsPerPage === 50 ? 'selected' : ''}>50 </option>
                <option value="100" ${ZAGlobal.recordsPerPage === 100 ? 'selected' : ''}>100 </option>
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
            ZAGlobal.currentPage = 1; ``
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
        ZAGlobal.triggerToast('Failed to fetch user list. Please try again later.', 3000, 'warning');
    }
}

let boundSubmitHandler;
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

    //For Popup button style color change

    const submitBtn = document.getElementById('submitActionBtn');

    // Set text
    submitBtn.textContent = action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Delegate';

    // Reset previous styles
    submitBtn.classList.remove('approve-style', 'reject-style', 'delegate-style');

    // Apply new style based on action
    if (action === 'approve') {
        submitBtn.classList.add('approve-style');
    } else if (action === 'reject') {
        submitBtn.classList.add('reject-style');
    } else if (action === 'delegate') {
        submitBtn.classList.add('delegate-style');
    }
    // const submitBtn = document.getElementById('submitActionBtn');
    // const actionMap = {
    //     approve: { text: 'Approve', class: 'approve-style' },
    //     reject: { text: 'Reject', class: 'reject-style' },
    //     delegate: { text: 'Delegate', class: 'delegate-style' }
    // };
    // submitBtn.textContent = actionMap[action].text;
    // submitBtn.className = actionMap[action].class;

    const submitButton = document.getElementById('submitActionBtn');
    submitButton.removeEventListener('click', handleSubmitAction);

    if (boundSubmitHandler) {
        submitButton.removeEventListener('click', boundSubmitHandler);
    }

    boundSubmitHandler = () => handleSubmitAction(recordsToProcess, action);
    submitButton.addEventListener('click', boundSubmitHandler);
    // submitButton.addEventListener('click', () => handleSubmitAction(recordsToProcess, action));

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
        // document.getElementById('approvalRejectPopup').style.display = 'none';
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
                const res = await ZOHO.CRM.API.approveRecord(config);

            if (!res || res.code !== 'SUCCESS') {
                console.error(`Failed for record ${record.entity.id}`, res);
                continue; // Skip processing this record
            }

            // Update count only on success
            if (action === 'approve') approvedRecordsCount++;
            else if (action === 'reject') rejectedRecordsCount++;
            else if (action === 'delegate') delegatedRecordsCount++;

            const updatedRecord = ZAGlobal.waitingRecords.find(r => r.entity.id === res.details.id);
            if (updatedRecord) {
                updatedRecord.is_approved = action === 'approve';
                updatedRecord.is_rejected = action === 'reject';
                updatedRecord.is_delegated = action === 'delegate';

                // Remove from all relevant arrays
                ZAGlobal.processedRecords.push(updatedRecord);
                ZAGlobal.waitingRecords = ZAGlobal.waitingRecords.filter(r => r.entity.id !== res.details.id);
                ZAGlobal.filteredRecords = ZAGlobal.filteredRecords.filter(r => r.entity.id !== res.details.id);
                ZAGlobal.allRecords = ZAGlobal.allRecords.filter(r => r.entity.id !== res.details.id);
                ZAGlobal.selectedRecords = ZAGlobal.selectedRecords.filter(id => id !== res.details.id);
            }

            } catch (error) {
                console.log("Error in API call:", error);
                return;
            }
        }

    let toastMessage = '';
    if (action === 'approve') {
        toastMessage = `${approvedRecordsCount} record${approvedRecordsCount === 1 ? '' : 's'} ${approvedRecordsCount === 1 ? 'was' : 'were'} approved`;
    } else if (action === 'reject') {
        toastMessage = `${rejectedRecordsCount} record${rejectedRecordsCount === 1 ? '' : 's'} ${rejectedRecordsCount === 1 ? 'was' : 'were'} rejected`;
    } else if (action === 'delegate') {
        toastMessage = `${delegatedRecordsCount} record${delegatedRecordsCount === 1 ? '' : 's'} ${delegatedRecordsCount === 1 ? 'was' : 'were'} delegated`;
    }
    

    if (approvedRecordsCount || rejectedRecordsCount || delegatedRecordsCount) {
        document.getElementById('approvalRejectPopup').style.display = 'none';
        ZAGlobal.reRenderTableBody();
        ZAGlobal.triggerToast(toastMessage, 3000, action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'info');
    }}
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
        currentToast.toastElement.remove();
        currentToast = null;
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
        backgroundColor,
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

            ZAGlobal.reRenderTableBody();
            // console.log(ZAGlobal.allRecords.length);
            // document.getElementById('totalRecordsCount').innerHTML = "Total Records : <strong>" + ZAGlobal.allRecords.length + "</strong>";
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
        if ( module.creatable == true && module.visibility == 1) {
            // module.visible == true  &&
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
    } else {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords.filter(record => record.module === selectedModule);
    }

    ZAGlobal.reRenderTableBody();
}

// Function to filter records based on the selected module
// function filterRecordsByModule(selectedModule) {
//     if (!selectedModule || selectedModule === 'AllModules') {
//         ZAGlobal.filteredRecords = ZAGlobal.allRecords;
//     } else {
//         ZAGlobal.filteredRecords = ZAGlobal.allRecords.filter(record => record.module === selectedModule);
//     }
//     ZAGlobal.reRenderTableBody();
// }

// Initialize the module selection behavior 
// function initializeModuleSelection(modules) {
//     populateModules(modules);
//     $('#module').on('change', handleModuleSelection);
// }


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

    ZAGlobal.reRenderTableBody();
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

    let counterElement = document.getElementById('selectedCounter');

    if (!counterElement) {
        counterElement = document.createElement('div');
        counterElement.id = 'selectedCounter';
        document.querySelector('#selectedRecordsCount')?.prepend(counterElement); 
    }

    if (count > 0) {
        counterElement.textContent = `${count} Record${count > 1 ? 's' : ''} selected`;
        counterElement.style.display = 'block';
    } else {
        counterElement.style.display = 'none';
    }
}


//To send the selected data to the selected record
// document.querySelector('tbody').addEventListener('change', function (event) {
//     if (event.target.type === 'checkbox') {
//         const recordId = event.target.dataset.id;
//         if (event.target.checked) {
//             ZAGlobal.selectedRecords.push(recordId);
//         } else {
//             const index = ZAGlobal.selectedRecords.indexOf(recordId);
//             if (index > -1) {
//                 ZAGlobal.selectedRecords.splice(index, 1);
//             }
//         }

//         ZAGlobal.reRenderTableBody();
//         const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
//         const headerCheckbox = document.querySelector('#selectAllCheckbox');
//         updateHeaderCheckboxState(rowCheckboxes, headerCheckbox);
//     }
// });

ZOHO.embeddedApp.init().then(function () {
    ZOHO.CRM.CONFIG.getCurrentUser().then(function (data) {
        var userLanguage = data.users[0].locale;

        if (userLanguage === 'zh_CN' || userLanguage === 'zh_TW') {
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
    document.getElementById('title').innerHTML = "批量记录批准";
    document.querySelector('.approve').innerText = "批准";
    document.querySelector('.reject').innerText = "拒绝";
    document.getElementById('totalRecordsCount').innerHTML = "总记录数：<strong>" + ZAGlobal.allRecords.length + "</strong>";
    document.getElementById('cancelPopupBtn').textContent = "取消";     
    document.querySelector('label[for="comment"]').textContent = "评论";
    document.getElementById('comment').placeholder = "在此添加您的评论（可选）";
    document.querySelector('label[for="userSelect"]').textContent = "用户";
    document.querySelector('label[for="rejectionReason"]').textContent = "拒绝原因";
    document.getElementById('popupTitle').innerHTML = "批量记录批准";
    

    



    //table header
    document.querySelector('#recordNameHeader .tbl-heading').innerText = "记录名称";
    document.querySelector('#approvalProcessNameHeader .tbl-heading').innerText = "审批流程名称";
    document.querySelector('#moduleIdHeader .tbl-heading').innerText = "模块";
    document.querySelector('#dateCreatedBy .tbl-heading').innerText = "创建时间";
    document.querySelector('.no-of-days .tbl-heading').innerText = "创建时间";
    document.querySelector('#action').innerText = "行动";

    document.querySelectorAll('.dropdown-menu').forEach(menu => {
    const ascItem = menu.querySelector('.asc');
    const descItem = menu.querySelector('.desc');
    const unsortItem = menu.querySelector('.unsort');

    if (ascItem) ascItem.innerHTML = '<i class="fa-solid fa-arrow-up"></i> 升序（A-Z）';
    if (descItem) descItem.innerHTML = '<i class="fa-solid fa-arrow-down"></i> 降序（Z-A）';
    if (unsortItem) unsortItem.innerHTML = '<i class="fa-solid fa-xmark"></i> 取消排序';
});

    document.querySelectorAll('.approve-btn .btn-label').forEach(el => el.innerText = "批准");
    document.querySelectorAll('.delegate-btn .btn-label').forEach(el => el.innerText = "委派");
    document.querySelectorAll('.reject-btn .btn-label').forEach(el => el.innerText = "拒绝");
}
    
    // document.getElementById('searchbtn').innerText = "搜索";
    // document.getElementById('resetTableBtn').innerText = "重置";
    // document.querySelector('._comments').placeholder = "评论";
    // document.getElementById('doneBtn').innerText = "完毕";
    // document.getElementById('clearBtn').innerText = "取消";
    // document.querySelector('.moduleclass').innerHTML = "选择特定模块";
    // document.getElementById('popup_header').innerText = "过滤器列表";



// async function filterRecords() {
//     let filtered_flag = false;
//     let Module = document.getElementById('modules-list');
//     let searchKey = document.getElementById('record-name-filter-input');
//     let recordName_filter_type = document.getElementById('record-name-filter');

//     document.getElementById('cta-filter').addEventListener('click', async (e) => {
//         e.preventDefault();
//         let res = await ZOHO.CRM.API.getApprovalRecords({ type: "awaiting" });
//         let data = res.data;

//         if (searchKey.value.trim() === '') {
//             ZAGlobal.triggerToast('Enter a key to search', 1000, 'info');
//             searchKey.focus();
//             return;
//         }

//         const searchValue = searchKey.value.trim().toLowercase();

//         switch (recordName_filter_type.value) {
//             case 'equals':
//                 ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (rec.entity.name.toLowerCase().includes(searchValue))));
//                 break;
//             case 'not_equals':
//                 ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (!rec.entity.name.toLowerCase().includes(searchValue))))
//                 break;
//             case 'starts_with':
//                 ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (rec.entity.name.toLowerCase().startsWith(searchValue))))
//                 break;
//             case 'is':
//                 ZAGlobal.filteredRecords = data.filter(rec => ((rec.module === Module.value) && (rec.entity.name.toLowerCase() === searchValue)))
//                 break;
//             default:
//                 console.log('default case');
//                 break;
//         }
//         filtered_flag = true;
//         ZAGlobal.reRenderTableBody();
//     })
//     document.getElementById('cta-clear-filter').addEventListener('click', (e) => {
//         e.preventDefault();
//         if (filtered_flag) {
//             filtered_flag = false;
//             searchKey.value = '';
//             ZAGlobal.filteredRecords = ZAGlobal.allRecords;
//             ZAGlobal.reRenderTableBody();
//         } else {
//             ZAGlobal.triggerToast('Nothing to Clear! No Filter Applied', 1000, 'info');
//         }
//     })
// }


// document.getElementById('filter-icon').addEventListener('click', (e) => {
//     e.preventDefault();
//     document.querySelector('#moduleContainer').classList.toggle('disabled');
//     document.querySelector('.filter-div').classList.toggle('hidden');
// })

async function filterRecords() {
    let filtered_flag = false;
    let Module = document.getElementById('modules-list');
    let searchKey = document.getElementById('record-name-filter-input');
    let recordName_filter_type = document.getElementById('record-name-filter');

    document.getElementById('cta-filter').addEventListener('click', async (e) => {
        e.preventDefault();

        let res = await ZOHO.CRM.API.getApprovalRecords({ type: "awaiting" });
        let data = res.data;

        if (searchKey.value.trim() === '') {
            ZAGlobal.triggerToast('Enter a key to search', 1000, 'info');
            searchKey.focus();
            return;
        }

        const searchValue = searchKey.value.trim().toLowerCase();

        switch (recordName_filter_type.value) {
            case 'equals':
                ZAGlobal.filteredRecords = data.filter(rec =>
                    rec.module === Module.value &&
                    rec.entity.name.toLowerCase().includes(searchValue)
                );
                break;
            case 'not_equals':
                ZAGlobal.filteredRecords = data.filter(rec =>
                    rec.module === Module.value &&
                    !rec.entity.name.toLowerCase().includes(searchValue)
                );
                break;
            case 'starts_with':
                ZAGlobal.filteredRecords = data.filter(rec =>
                    rec.module === Module.value &&
                    rec.entity.name.toLowerCase().startsWith(searchValue)
                );
                break;
            case 'is':
                ZAGlobal.filteredRecords = data.filter(rec =>
                    rec.module === Module.value &&
                    rec.entity.name.toLowerCase() === searchValue
                );
                break;
            default:
                console.log('Unknown filter type');
                break;
        }

        filtered_flag = true;
        ZAGlobal.reRenderTableBody();
    });

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
    });
}

document.getElementById('filter-icon').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#moduleContainer').classList.toggle('disabled');
    document.querySelector('.filter-div').classList.toggle('hidden');
});



// Sorting Related Works - Starts

let tblHeader = document.querySelector("thead");
let tblBody = document.querySelector("._tbody");
let allHeadersList = Array.from(tblHeader.querySelectorAll("tr")[0].children);
let selectedItems = []; 

tblHeader.addEventListener("click", (e) => {
    if (e.target === allHeadersList[0] || e.target === document.querySelector('#selectAllCheckbox')) {
        e.stopImmediatePropagation();
        return;
    }
    let dropdown = (e.target.closest("th")).querySelector(".dropdown-menu")
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";


    let currentDropDown = e.target.closest("th").querySelector(".dropdown-menu");
    if (currentDropDown) {
        (document.querySelectorAll(".dropdown-menu")).forEach(element => {
            if ((element.style.display === "flex") && (currentDropDown !== element)) {
                element.style.display = "none";
            }
        });

        currentDropDown.addEventListener("click", (event) => {
            let clickedBtn = event.target.closest("li");
            if (!clickedBtn) 
            return;

            let selectedValue = clickedBtn.innerText.trim();
            selectedItems.push(selectedValue);
            document.querySelectorAll('.dropdown-menu li').forEach(item => {
                if (selectedItems.includes(item.innerText.trim())) {
                    item.classList.add('disabled'); // Add disabled class to prevent selection
                } else {
                    item.classList.remove('disabled'); // Remove disabled class if not selected
                }
            });

            document.querySelectorAll(".dropdown-menu li").forEach(item => item.classList.remove("selected"));
            clickedBtn.classList.add("selected");

            // currentDropDown.querySelectorAll("li").forEach(item => {
            //     item.classList.remove("selected");
            // });
            // clickedBtn.classList.add("selected");

            
            let allRows = Array.from(tblBody.rows);
            let descArr = [];
            let indexOfColumn = allHeadersList.indexOf(currentDropDown.closest("th"));
            let allValuesAreSame = true;
            
            // Highlight current column
            allHeadersList.forEach(header => header.classList.remove("active-sorted-column"));
            currentDropDown.closest("th").classList.add("active-sorted-column");
            for (let i = 0; i < allRows.length; i++) {
                let cellA = allRows[i].cells[indexOfColumn].innerText;
                if (i > 0) {
                    let cellB = allRows[i - 1].cells[indexOfColumn].innerText;
                    if (cellA !== cellB) {
                        allValuesAreSame = false;
                        break;
                    }
                }
            }

            // if (allValuesAreSame) {
            //     return; 
            // }       
            
            allRows.sort((rowA, rowB) => {
                let cellA = rowA.cells[indexOfColumn].innerText;
                let cellB = rowB.cells[indexOfColumn].innerText;
                // return cellA.localeCompare(cellB);

                if (cellA.includes("days ago") && cellB.includes('days ago')){
                    let daysA = parseInt(cellA.split(' ')[0]);
                    let daysB = parseInt(cellB.split(' ')[0]);
                    return daysA - daysB;
            }
            if (cellA.includes(',') && cellB.includes(',')) {
                let dateA = new Date(cellA);
                let dateB = new Date(cellB);
                return dateA - dateB;   
            }
            return cellA.localeCompare(cellB);
            });
            if (event.target.classList.contains("desc") || event.target.classList.contains("fa-arrow-down")) {
                allRows.sort((rowA, rowB) => {
                    let cellA = rowA.cells[indexOfColumn].innerText;
                    let cellB = rowB.cells[indexOfColumn].innerText;
                    // return cellA.localeCompare(cellB);
    
                    if (cellA.includes("days ago") && cellB.includes('days ago')){
                        let daysA = parseInt(cellA.split(' ')[0]);
                        let daysB = parseInt(cellB.split(' ')[0]);
                        return daysB - daysA;
                }
                if (cellA.includes(',') && cellB.includes(',')) {
                    let dateA = new Date(cellA);
                    let dateB = new Date(cellB);
                    return dateB - dateA;   
                }
                return cellB.localeCompare(cellA);
                });
                allRows.forEach(row =>{
                    tblBody.appendChild(row);
                });
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
                allHeadersList.forEach(header => header.classList.remove("active-sorted-column"));
            }
            setTimeout(() => {
                currentDropDown.style.display = "none";  // Delay hiding to ensure it's after selection
            }, 10);
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
