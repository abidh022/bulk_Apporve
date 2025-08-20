let boundSubmitHandler;
ZAGlobal.buttonAction = async function (action, recordId = null) {
    // console.log(`Action: ${action} for Record id ${recordId}`);     

    let recordsToProcess = [];
    if (recordId) {
        // Single record action
    const record = ZAGlobal.allRecords.find(rec => rec.entity.id == recordId);       
    if (!record) {
            ZAGlobal.triggerToast(tt("toast_record_not_found"), 3000, 'warning');
            return;
        }

         if (action === 'delegate' && record.waiting_for?.id !== ZAGlobal.currentUserId) {
            ZAGlobal.triggerToast("You can only delegate your own records.", 3000, 'warning');
            return;
        }
        recordsToProcess.push(record);
    } else {
        // Bulk action
        const checkedRecords = ZAGlobal.selectedRecords.length;
        if (checkedRecords === 0) {
            ZAGlobal.triggerToast(tt("toast_select_one_record"), 3000, 'warning');
            return;
        }
        recordsToProcess = ZAGlobal.waitingRecords.filter(rec => ZAGlobal.selectedRecords.includes(rec.entity.id));
          // ✅ Restrict bulk delegation to only own records
        if (action === 'delegate') {
            const notOwned = recordsToProcess.filter(rec => rec.waiting_for?.id !== ZAGlobal.currentUserId);
            if (notOwned.length > 0) {
                ZAGlobal.triggerToast(tt("toast_delegate_own_only_bulk"), 3000, 'warning');
                return;
            }
    }
}
    document.getElementById('approvalRejectPopup').style.display = 'none';
    document.getElementById('approvalRejectPopup').style.display = 'flex';
    // Add keydown listener
    popupKeyHandler = handlePopupKeyEvents;
    document.addEventListener('keydown', popupKeyHandler);
    document.getElementById('commentSection').style.display = action === 'reject' ? 'none' : 'block';
    document.getElementById('comment').value = '';
    document.getElementById('rejectionReason').value = 'selectReasonOption';
    document.getElementById('rejectionReasonSection').style.display = action === 'reject' ? 'block' : 'none';
    document.getElementById('otherReasonContainer').style.display = 'none';
    document.getElementById('popupTitle').textContent = tt(`${action}Title`);
    document.getElementById('submitActionBtn').textContent = tt(`${action}Btn`);

    const submitBtn = document.getElementById('submitActionBtn');

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

    const submitButton = document.getElementById('submitActionBtn');
    submitButton.removeEventListener('click', handleSubmitAction);

    if (boundSubmitHandler) {
        submitButton.removeEventListener('click', boundSubmitHandler);
    }

    boundSubmitHandler = () => handleSubmitAction(recordsToProcess, action);
    submitButton.addEventListener('click', boundSubmitHandler);

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
        closeApprovalPopup();
        document.getElementById('otherReason').value = '';
        recordsToProcess = [];
    });

    // Handle the Submit button to approve or reject the records
    async function handleSubmitAction(records) {
        const submitButton = document.getElementById('submitActionBtn');
        let comment = document.getElementById('comment').value.trim();
        let rejectionReason = '';
        let otherReason = '';
        let selectedUser = null;

        if (!navigator.onLine) {
            ZAGlobal.triggerToast(tt("toast_network_error"), 3000, 'error');
            return;
        }

        if (records.length > 200) {
            ZAGlobal.triggerToast(tt("toast_max_200_limit"), 3000, 'warning');
            return;
        }

        submitButton.disabled = true;
        showLoader();

        try {
            if (action === 'reject') {
                rejectionReason = $('#rejectionReason').val();
                if (rejectionReason === 'selectReasonOption') {
                    ZAGlobal.triggerToast(tt("toast_select_rejection_reason"), 3000, 'warning');
                    return;
                }
                if (rejectionReason === 'Other') {
                    otherReason = $('#otherReason').val().trim();
                    if (!otherReason) {
                        ZAGlobal.triggerToast(tt("toast_rejection_reason_required"), 3000, 'warning');
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
                    ZAGlobal.triggerToast(tt("toast_select_user_delegate"), 3000, 'warning');
                    return;
                }
                comment = $('#comment').val().trim();
            }
            submitButton.disabled = true;

            let approvedRecordsCount = 0;
            let rejectedRecordsCount = 0;
            let delegatedRecordsCount = 0;

            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
                    await sleep(200);

                    if (!res || res.code !== 'SUCCESS') {
                        console.error(`Failed for record ${record.entity.id}`, res);

                        if (res && res.message) {
                            ZAGlobal.triggerToast((res.message), 3000, 'error');
                        }
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
                toastMessage = tt("toast_approval_success")
                    .replace('{count}', approvedRecordsCount)
                    .replace('{verb}', approvedRecordsCount === 1 ? 'was' : 'were');
            } else if (action === 'reject') {
                toastMessage = tt("toast_rejection_success")
                    .replace('{count}', rejectedRecordsCount)
                    .replace('{verb}', rejectedRecordsCount === 1 ? 'was' : 'were');
            } else if (action === 'delegate') {
                toastMessage = tt("toast_delegation_success")
                    .replace('{count}', delegatedRecordsCount)
                    .replace('{verb}', delegatedRecordsCount === 1 ? 'was' : 'were');
            }

            if (approvedRecordsCount || rejectedRecordsCount || delegatedRecordsCount) {
                // document.getElementById('approvalRejectPopup').style.display = 'none';
                closeApprovalPopup();
                ZAGlobal.reRenderTableBody();
                ZAGlobal.triggerToast(toastMessage, 3000, action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'info');
            }

        }
        finally {
            submitButton.disabled = false;
            hideLoader();
        }
    }
    await ZAGlobal.reRenderTableBody();
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

let popupKeyHandler;


function handlePopupKeyEvents(event) {
    const popup = document.getElementById('approvalRejectPopup');
    if (!popup || popup.style.display === 'none') return;

    const activeElement = document.activeElement;
    const isTypingField = activeElement.tagName === 'TEXTAREA' ||
        (activeElement.tagName === 'INPUT' && activeElement.type === 'text');

    if (event.key === 'Enter' && !isTypingField) {
        event.preventDefault();
        const submitBtn = document.getElementById('submitActionBtn');
        if (!submitBtn.disabled) {
            submitBtn.click();
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        closeApprovalPopup();
    }
}

function closeApprovalPopup() {
    document.getElementById('approvalRejectPopup').style.display = 'none';
    document.getElementById('otherReason').value = '';
    document.removeEventListener('keydown', popupKeyHandler);
}

