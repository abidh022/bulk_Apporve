let boundSubmitHandler;
ZAGlobal.buttonAction = async function (action, recordId = null) {
    // console.log(`Action: ${action} for Record id ${recordId}`);     

    let recordsToProcess = [];
    if (recordId) {
        // Single record action
        const record = ZAGlobal.waitingRecords.find(rec => rec.entity.id == recordId);
        if (!record) {
            ZAGlobal.triggerToast(t.toast_record_not_found, 3000, 'warning');
            return;
        }
        recordsToProcess.push(record);
    } else {
        // Bulk action
        const checkedRecords = ZAGlobal.selectedRecords.length;
        if (checkedRecords === 0) {
            ZAGlobal.triggerToast(t.toast_select_one_record, 3000, 'warning');
            return;
        }
        recordsToProcess = ZAGlobal.waitingRecords.filter(rec => ZAGlobal.selectedRecords.includes(rec.entity.id));
    }
    document.getElementById('approvalRejectPopup').style.display = 'none';
    document.getElementById('approvalRejectPopup').style.display = 'flex';
    // document.getElementById('popupTitle').textContent = action === 'approve' ? 'Approve Records' : action === 'reject' ? 'Reject Records' : 'Delegate Records';
    document.getElementById('commentSection').style.display = action === 'reject' ? 'none' : 'block';
    document.getElementById('comment').value = '';
    document.getElementById('rejectionReason').value = 'selectReasonOption';
    document.getElementById('rejectionReasonSection').style.display = action === 'reject' ? 'block' : 'none';
    document.getElementById('otherReasonContainer').style.display = 'none';
    document.getElementById('popupTitle').textContent = t[`${action}Title`];
    document.getElementById('submitActionBtn').textContent = t[`${action}Btn`];
    console.log("Button label:", t[`${action}Btn`]);

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
                ZAGlobal.triggerToast(t.toast_select_rejection_reason, 3000, 'warning');
                return;
            }
            if (rejectionReason === 'Other') {
                otherReason = $('#otherReason').val().trim();
                if (!otherReason) {
                    ZAGlobal.triggerToast(t.toast_rejection_reason_required, 3000, 'warning');
                    return;
                }
                comment = otherReason;
            }
        }

        if (action === 'delegate') {
            selectedUser = $('#userSelect').val();
            if (!selectedUser) {
                ZAGlobal.triggerToast(t.toast_select_user_delegate, 3000, 'warning');
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