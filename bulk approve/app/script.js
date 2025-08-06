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
        if (headerCheckbox) headerCheckbox.disabled = false;

                await setDomainInfo(); 


        const noRecords = !Array.isArray(ZAGlobal.allRecords) || ZAGlobal.allRecords.length === 0;
        const noFilteredRecords = !Array.isArray(ZAGlobal.filteredRecords) || ZAGlobal.filteredRecords.length === 0;

        if (noRecords || noFilteredRecords) {
            const noRecordsMessage = noRecords
                ? (t["custom.APPROVAL.noRecordsAvailable"] || "No records found")
                : (t["custom.APPROVAL.noFilteredRecords"] || "No records match your filter");
            $('._tbody').html(`
                <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    <img class="img" src="no_record_img.jpg" alt="No records">
                    <div>${noRecordsMessage}</div>
                </td>
                </tr>
                `);
            if (headerCheckbox) {
                headerCheckbox.disabled = true;
                headerCheckbox.checked = false;
                headerCheckbox.indeterminate = false;
            }
            ZAGlobal.updatePagination();
            resetHeaderCheckbox();
            updateSelectedCount();
            updateSelectAllCheckboxState();

            const totalCountEl = document.getElementById('totalRecordsCount');
            if (totalCountEl) {
                const label = t["custom.APPROVAL.totalRecordsCount"];
                totalCountEl.innerHTML = `${label}: ${'0'}`;
            }
            // ZAGlobal.updatePagination();
            // updateSelectedCount();
            return;
        }
        else {
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
                let safeLocale = ['en', 'zh'].includes(ZAGlobal.userLang) ? ZAGlobal.userLang : 'en';
                var formattedDate = initiatedTime.toLocaleString( safeLocale, options);

                tbody += `<tr data-id="${record.entity.id}" data-module="${record.module}">
                            <td><input type="checkbox" data-id="${record.entity.id}" data-module="${record.module}" ${ZAGlobal.selectedRecords.includes(record.entity.id) ? 'checked' : ''}></td>
                            <td><a href= "https://crm.zoho.${ZAGlobal.domainName}/crm/org${ZAGlobal.orgDomain}/tab/${record.module}/${record.entity.id}" target="_blank" class="record-link">${record.entity.name}</a></td>
                            <td>${record.rule.name}</td>
                            <td>${record.waiting_for.name}</td>
                            <td>${t[`custom.APPROVAL.module.${record.module}`] || record.module}</td>
                            <td>${formattedDate}</td>
                            <td>${daysAgo} ${daysAgo === 1 ? tt("dayAgo") : tt("daysAgo")}</td>
                            <td class="action-buttons">
                                <button class="approve-btn" id="approve_single_action_btn" data-id="${record.entity.id}"><span class="btn-label"></span></button>
                                  <span class="slash">/</span>
                                <button class="delegate-btn" id="delegate_single_action_btn" data-id="${record.entity.id}"><span class="btn-label"></span></button>
                                  <span class="slash">/</span>
                                <button class="reject-btn" id="reject_single_action_btn" data-id="${record.entity.id}"><span class="btn-label"></span></button>
                            </td>
                            </tr>`;
                // console.log(record);
            });
            $('._tbody').append(tbody);
        }
        ZAGlobal.updatePagination();
        resetHeaderCheckbox();
        updateSelectedCount();
        updateSelectAllCheckboxState();

        // ✅ Updated logic to always show total or 0
        // const totalCountEl = document.getElementById('totalRecordsCount');
        // if (totalCountEl) {
        //     const total = Array.isArray(ZAGlobal.filteredRecords) ? ZAGlobal.filteredRecords.length : 0;
        //     const label = t["custom.APPROVAL.totalRecords"] || 'Total Records';
        //     totalCountEl.innerHTML = `${label}: ${total === 0 ? ('0') : `<strong>${total}</strong>`}`;
        // }

        const totalCountEl = document.getElementById('totalRecordsCount');
if (totalCountEl) {
    const total = Array.isArray(ZAGlobal.filteredRecords) ? ZAGlobal.filteredRecords.length : 0;
    const label = tt("totalRecordsCount");
    totalCountEl.innerHTML = `${label}: ${total === 0 ? ('0') : `<strong>${total}</strong>`}`;
}

        document.querySelectorAll('.approve-btn .btn-label').forEach(el => el.innerText = t["custom.APPROVAL.approve"]);
        document.querySelectorAll('.delegate-btn .btn-label').forEach(el => el.innerText = t["custom.APPROVAL.delegate"]);
        document.querySelectorAll('.reject-btn .btn-label').forEach(el => el.innerText = t["custom.APPROVAL.reject"]);

        let initialTBody = document.querySelector("._tbody");
        initialRows = Array.from(initialTBody.rows);
    },

    updatePagination: function () {
        var totalRecords = ZAGlobal.filteredRecords.length;
        ZAGlobal.totalPages = Math.ceil(totalRecords / ZAGlobal.recordsPerPage);

        var paginationHtml = `
            <span id="recordsLabel">${tt("recordsLabel")}</span>
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

let t = {};

async function fetchApprovalRecordsByConnector(type) {
     await setDomainInfo(); 

    const isChina = ZAGlobal.domainName === 'com.cn';
    
    const connectorName = isChina 
        ? "webbulkupdate.getapprovalrecordsconnectionchina.getapprovalrecordschina"
        : "webbulkupdate.getapprovalrecordsconnection.getapprovalrecords";

    let page = 1;
    let allRecords = [];
    let more_records = true;

    while (more_records) {
        try {
            const res = await ZOHO.CRM.CONNECTOR.invokeAPI(connectorName, { type, page });
            // const response = JSON.parse(res.response);
            // console.log(response);
            let parsed;
            try {
                parsed = JSON.parse(res.response);
            } catch (err) {
                break;
            }
            const records = Array.isArray(parsed?.data) ? parsed.data : [];
            allRecords = allRecords.concat(records);

            more_records = parsed.info.more_records === true;
            page += 1;

        } catch (err) {
            console.error(`Error fetching page ${page} of ${type} records:`, err);
            break;
        }
    }
    return allRecords;
}

ZOHO.embeddedApp.on("PageLoad", async function (data) {
    startNetworkMonitor();
    showLoader();

    const processingTextEl = document.querySelector('.processingTextId');
    if (processingTextEl) {
        processingTextEl.innerText = tt("custom.APPROVAL.processingText");
    }
    ZAGlobal.module = data.Entity;

    try {
        let awaitingRecords = [];
        let othersAwaitingRecords = [];

        // 1. Fetch records assigned to current user via connector
        awaitingRecords = await fetchApprovalRecordsByConnector("awaiting");

        // 2. If Admin or CEO, fetch others_awaiting as well
        if (ZAGlobal.isAdminOrCEO) {
            othersAwaitingRecords = await fetchApprovalRecordsByConnector("others_awaiting");
        }
        const combinedRecords = [...awaitingRecords, ...othersAwaitingRecords];
        // console.log("Combined Records:", combinedRecords);
        // Store all records globally
        ZAGlobal.allRecords = [...combinedRecords];
        ZAGlobal.filteredRecords = [...combinedRecords];
        ZAGlobal.waitingRecords = [...awaitingRecords]; // Only current user's records (used for action buttons)

        await ZAGlobal.reRenderTableBody();
    } catch (error) {
        console.error('Error fetching records:', error);
        ZAGlobal.triggerToast("Error loading records.", 3000, 'error');
    } finally {
        hideLoader(); 
    }
    // Populate module dropdown (unchanged)
    ZOHO.CRM.META.getModules().then(function (data) {
        if (data && Array.isArray(data.modules)) {
            populateModules(data.modules);
        }
    });
    filterRecords(); // Initial filter if needed
});
