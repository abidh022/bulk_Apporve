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

        // Render filtered records in the main table
        if (ZAGlobal.filteredRecords.length === 0 && ZAGlobal.processedRecords.length === 0) {
            $('._tbody').html('<tr><td colspan="5">No records available to approve/reject.</td></tr>');
        } else {
            // Apply pagination
            var startIndex = (ZAGlobal.currentPage - 1) * ZAGlobal.recordsPerPage;
            var endIndex = startIndex + ZAGlobal.recordsPerPage;
            var recordsToShow = ZAGlobal.filteredRecords.slice(startIndex, endIndex);
            // var allRecordsToShow = recordsToShow.concat(ZAGlobal.processedRecords);

            recordsToShow.forEach(function (record) {
                tbody += `<tr data-id="${record.entity.id}" data-module="${record.module}">
                            <td><input type="checkbox" data-id="${record.entity.id}" data-module="${record.module}" ${ZAGlobal.selectedRecords.includes(record.entity.id) ? 'checked' : ''}></td>
                            <td>${record.entity.name}</td>
                            <td>${record.rule.name}</td>
                            <td>${record.module}</td>
                            <td>
                                <button class="approve-btn" data-id="${record.entity.id}">Approve</button>
                                <button class="delegate-btn" data-id="${record.entity.id}">Delegate</button>
                                <button class="reject-btn" data-id="${record.entity.id}">Reject</button>
                            </td>
                            <td>${record.is_approved ? 'Approved' : record.is_rejected ? 'Rejected' : 'Waiting for approval'}</td>
                        </tr>`;
            });

            ZAGlobal.processedRecords.forEach(function (record) {
                tbody += `<tr data-id="${record.entity.id}" data-module="${record.module}">
                            <td><input type="checkbox" data-id="${record.entity.id}" data-module="${record.module}" ${ZAGlobal.selectedRecords.includes(record.entity.id) ? 'checked' : ''} disabled class="disabled-checkbox"></td>
                            <td>${record.entity.name}</td>
                            <td>${record.rule.name}</td>
                            <td>${record.module}</td>
                            <td>
                                <button class="approve-btn" data-id="${record.entity.id}" disabled>Approve</button>
                                <button class="delegate-btn" data-id="${record.entity.id}" disabled>Delegate</button>
                                <button class="reject-btn" data-id="${record.entity.id}" disabled>Reject</button>
                            </td>
                            <td>${record.is_approved ? 'Approved' : record.is_rejected ? 'Rejected' : 'Waiting for approval'}</td>
                        </tr>`;
            });

            $('._tbody').append(tbody);
        }
        ZAGlobal.updatePagination();
        ZAGlobal.selectAll();
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

        // Filter users who are active
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
        recordsToProcess.push(record); // Process the selected record
    } else {
        // Bulk action
        const checkedRecords = ZAGlobal.selectedRecords.length;
        if (checkedRecords === 0) {
            ZAGlobal.triggerToast('Please select at least one record to approve/reject.', 3000, 'warning');
            return;
        }
        recordsToProcess = ZAGlobal.waitingRecords.filter(rec => ZAGlobal.selectedRecords.includes(rec.entity.id)); // Get selected records
    }

    // const checkedRecords = ZAGlobal.selectedRecords.length;
    document.getElementById('approvalRejectPopup').style.display = 'none';
    document.getElementById('approvalRejectPopup').style.display = 'flex';
    document.getElementById('popupTitle').textContent = action === 'approve' ? 'Approve Records' : action === 'reject' ? 'Reject Records' : 'Delegate Records';
    document.getElementById('comment').value = '';  // Reset the comment field
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
        recordsToProcess = []; // Reset the recordsToProcess array when the popup is closed   
    });

    // Handle the Submit button to approve or reject the records
    async function handleSubmitAction(records) {
        let comment = document.getElementById('comment').value.trim();
        let rejectionReason = '';
        let otherReason = '';
        let selectedUser = null;

        if (action === 'reject') {
            rejectionReason = $('#rejectionReason').val();
            if (rejectionReason === 'q') {
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
            } else {
                comment = rejectionReason;
            }
        }

        if (action === 'delegate') {
            selectedUser = $('#userSelect').val();
            if (!selectedUser) {
                ZAGlobal.triggerToast('Please select a user to delegate the record.', 3000, 'warning');
                return;
            }
            comment = `Delegated to ${selectedUser}`;
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

                // Check if the response is successful
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

        // Show the toast after processing the records
        ZAGlobal.triggerToast(toastMessage, 3000, action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'info');


        // Close the popup after action is completed
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

let currentToast = null;  // Global variable to hold the current toast instance

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
        .then(function (toBeApproved) {
            ZAGlobal.filteredRecords = toBeApproved.data;
            ZAGlobal.allRecords = [...toBeApproved.data];
            ZAGlobal.waitingRecords = [...toBeApproved.data];
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
    // }
});

function populateModules(modules) {
    const select = document.getElementById('module');
    select.innerHTML = ''; // Clear existing options

    // Add "All Modules" option at the top
    const allModulesOption = document.createElement('option');
    allModulesOption.value = 'AllModules'; // Value for "All Modules"
    allModulesOption.textContent = "All Modules"; // Label for "All Modules"
    select.appendChild(allModulesOption);

    // Add module options dynamically
    modules.forEach(module => {
        const option = document.createElement('option');
        option.value = module.api_name;
        option.textContent = module.api_name;
        select.appendChild(option);
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
    // Handle change event for selecting a module
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

// Search functionality to filter the table rows
document.getElementById('searchBar').addEventListener('input', function () {
    const searchValue = this.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');

    rows.forEach(function (row) {
        const columns = row.querySelectorAll('td');
        let matchFound = false;

        columns.forEach(function (column) {
            if (column.textContent.toLowerCase().includes(searchValue)) {
                matchFound = true;
            }
        });

        if (matchFound) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});


ZAGlobal.selectAll = function () {
    const headerCheckbox = document.querySelector('#selectAllCheckbox');
    const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');

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
    });

    updateHeaderCheckboxState(rowCheckboxes, headerCheckbox);
};

function updateHeaderCheckboxState(rowCheckboxes, headerCheckbox) {
    const checkedCheckboxes = Array.from(rowCheckboxes).filter(checkbox => checkbox.checked);

    // If all checkboxes are checked, set the header checkbox to checked
    if (checkedCheckboxes.length === rowCheckboxes.length) {
        headerCheckbox.checked = true;
        headerCheckbox.indeterminate = false;
    }
    // If no checkboxes are checked, set the header checkbox to unchecked   
    else if (checkedCheckboxes.length === 0) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
    }
    // If some checkboxes are checked, set the header checkbox to indeterminate
    else {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = true;
    }
}

document.querySelector('tbody').addEventListener('change', function (event) {
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
    console.log("Defualt eng lan");
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

// -----------------------------------------------------------------------------------working// Button action for approve/reject
// ZAGlobal.buttonAction = async function (action, recordId) {
// console.log(`Action: ${action} for Record id ${recordId}`); // Log the action type (approve/reject/delegate)
// const checkedRecords = ZAGlobal.selectedRecords.length;
// if (checkedRecords === 0) {
//     ZAGlobal.triggerWarning('Please select at least one record to approve/reject.', 3000, 'warning');
//     return;
// }

//     // Show the popup
//     document.getElementById('approvalRejectPopup').style.display = 'flex';
//     document.getElementById('popupTitle').textContent = action === 'approve' ? 'Approve Records' : 'Reject Records';
//     document.getElementById('comment').value = '';  // Reset the comment field
//     document.getElementById('rejectionReasonSection').style.display = action === 'reject' ? 'block' : 'none';
//     document.getElementById('otherReasonContainer').style.display = 'none'; // Hide "Other" input by default
//     document.getElementById('submitActionBtn').textContent = action === 'approve' ? 'Approve' : 'Reject';

//     const submitButton = document.getElementById('submitActionBtn');

//     // Remove existing event listener if there is one
//     submitButton.removeEventListener('click', handleSubmitAction);

//     // Add a single event listener for the submit button
//     submitButton.addEventListener('click', handleSubmitAction);

//     if (action === 'delegate') {
//         // Populate the user list if delegating
//         await populateUserList();
//     }

//     $('#rejectionReason').on('change', function () {
//         const selectedReason = $(this).val();
//         if (selectedReason === 'Other') {
//             $('#otherReasonContainer').show();
//         } else {
//             $('#otherReasonContainer').hide();
//         }
//     });

//     // Handle the Cancel button to close the popup
//     document.getElementById('cancelPopupBtn').addEventListener('click', () => {
//         document.getElementById('approvalRejectPopup').style.display = 'none';
//     });

//     // Handle the Submit button to approve or reject the records
//     async function handleSubmitAction() {
//         let comment = document.getElementById('comment').value.trim();
//         let rejectionReason = '';
//         let otherReason = '';
//         let selectedUser = null; // Initialize selectedUser to null by default

//         if (action === 'reject') {
//             rejectionReason = $('#rejectionReason').val();
//             if (rejectionReason === 'Other') {
//                 otherReason = $('#otherReason').val().trim();
//                 if (!otherReason) {
//                     ZAGlobal.triggerWarning('Please specify the reason for rejection.', 3000, 'warning');
//                     return;
//                 }
//                 comment = otherReason;
//             }
//             if (!comment) {
//                 ZAGlobal.triggerWarning('Please provide a rejection comment.', 3000, 'warning');
//                 return;
//             }
//         }
//         if (action === 'delegate') {
//             selectedUser = $('#userSelect').val();
//             if (!selectedUser) {
//                 ZAGlobal.triggerWarning('Please select a user to delegate the record.', 3000, 'warning');
//                 return;
//             }
//             comment = `Delegated to ${selectedUser}`;
//         }

//     let approvedRecordsCount = 0;
//     let rejectedRecordsCount = 0;
//     let delegatedRecordsCount = 0;

//     for (const recordId of ZAGlobal.selectedRecords) {
//         const record = ZAGlobal.waitingRecords.find(rec => rec.entity.id == recordId);
//         if (record) {
//             const config = {
//                 Entity: record.module,
//                 RecordID: record.entity.id,
//                 actionType: action,
//                 comments: comment,
//                 delegatedTo: selectedUser || null
//             };

//             try {
//                 let res = await ZOHO.CRM.API.approveRecord(config);
//                 if (!res) throw new Error('Error processing the record');

//                 // Move processed records to the processed list
//                 if (action === 'approve') {
//                     record.is_approved = true;
//                     approvedRecordsCount++;
//                 } else if (action === 'reject') {
//                     record.is_rejected = true;
//                     rejectedRecordsCount++;
//                 } else if (action === 'delegate') {
//                     // Logic for delegation
//                     record.is_delegated = true;
//                     delegatedRecordsCount++;
//                 }

//                 // Remove from waiting records and add to processed records
//                 ZAGlobal.waitingRecords = ZAGlobal.waitingRecords.filter(r => r.entity.id !== record.entity.id);
//                 ZAGlobal.filteredRecords = ZAGlobal.filteredRecords.filter(r => r.entity.id !== record.entity.id);
//                 ZAGlobal.processedRecords.push(record);
//                 // Re-render the table to update
//                 ZAGlobal.reRenderTableBody();
//             } catch (error) {
//                 console.log('Error processing record:', error);
//             }
//         }
//     }
//     if (action === 'approve') {
//         ZAGlobal.triggerAppRejToast(action, approvedRecordsCount, 0);
//     } else if (action === 'reject') {
//         ZAGlobal.triggerAppRejToast(action, 0, rejectedRecordsCount);
//     } else if (action === 'delegate') {
//         ZAGlobal.triggerAppRejToast(action, delegatedRecordsCount, 0);
//     }
//     if (checkedRecords === (approvedRecordsCount + rejectedRecordsCount)) {
//         ZAGlobal.triggerAppRejToast(action, approvedRecordsCount, rejectedRecordsCount);
//     }
// }
// };

// $(document).on('click', '.approve-btn', function () {
//     ZAGlobal.buttonAction('approve');
// });

// $(document).on('click', '.reject-btn', function () {
//     ZAGlobal.buttonAction('reject');
// });

// $(document).on('click', '.delegate-btn', function () {
//     ZAGlobal.buttonAction('delegate');
// });

// Show the popup when the button is clicked
// document.getElementById('searchbtn').addEventListener('click', () => {
//     document.getElementById('search_popup').style.display = 'flex';
// });

// // Close the popup when the close button is clicked
// document.getElementById('cancelBtn').addEventListener('click', () => {
//     document.getElementById('search_popup').style.display = 'none';
// });

// Close the popup if the user clicks outside of the popup
// window.addEventListener('click', (event) => {
//     if (event.target === document.getElementById('search_popup')) {
//         document.getElementById('search_popup').style.display = 'none';
//     }
// });

// document.getElementById('doneBtn').addEventListener('click', () => {
//     const selectedModule = $('#module').val();
//     if (selectedModule.length === 0) {
//         ZAGlobal.triggerToast('Please select any one module', 3000, 'warning');
//         return;
//     }
//     filterRecordsByModule(selectedModule);
//     document.getElementById('search_popup').style.display = 'none'; // Close the popup after done
// });

// Reset button action
// document.getElementById('resetTableBtn').addEventListener('click', () => {
//     ZAGlobal.filteredRecords = ZAGlobal.allRecords.filter(record => !ZAGlobal.processedRecords.some(proc => proc.entity.id === record.entity.id));
//     ZAGlobal.selectedRecords = [];
//     ZAGlobal.recordsPerPage = [10];
//     const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
//     checkboxes.forEach(checkbox => checkbox.checked = false);
//     ZAGlobal.reRenderTableBody();
//     document.getElementById('search_popup').style.display = 'none';
//     $('#module').val(null).trigger('change');
// });
