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
        if (!Array.isArray(ZAGlobal.filteredRecords)) {
            console.warn("Skip rendering: filteredRecords not ready");
            return;
        }

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
            updateTotalRecordsCount();
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

            const modulesData = await ZOHO.CRM.META.getModules();

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
                var formattedDate = initiatedTime.toLocaleString(safeLocale, options);

                tbody += `<tr data-id="${record.entity.id}" data-module="${record.module}">
                            <td><input type="checkbox" data-id="${record.entity.id}" data-module="${record.module}" ${ZAGlobal.selectedRecords.includes(record.entity.id) ? 'checked' : ''}></td>
                            <td><a href= "https://crm.zoho.${ZAGlobal.domainName}/crm/org${ZAGlobal.orgDomain}/tab/${record.module}/${record.entity.id}" target="_blank" class="record-link">${record.entity.name}</a></td>
                            <td>${record.rule.name}</td>
                            <td>${record.waiting_for.name}</td>
                            <td>${t[`custom.APPROVAL.module.${record.module}`] || (modulesData.modules.find(item => item.api_name == record.module)).plural_label}</td>
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

        updateTotalRecordsCount();

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
            <span>${ZAGlobal.currentPage}&nbsp; of &nbsp;${ZAGlobal.totalPages}</span>
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
function updateTotalRecordsCount() {
    const totalCountEl = document.getElementById('totalRecordsCount');
    if (!totalCountEl) return;

    const label = t["custom.APPROVAL.totalRecordsCount"] || "Total Records";
    const total = ZAGlobal.filteredRecords.length;
    console.log(total);

    totalCountEl.innerHTML = `${label}: ${total === 0 ? '0' : `<strong>${total}</strong>`}`;
}

async function applyInitialFiltersAndRender() {
    const isSelfAndSubordinates = ZAGlobal.isSelfAndSubordinates || false;

    if (isSelfAndSubordinates) {
        ZAGlobal.filteredRecords = [...ZAGlobal.allRecords];
    } else {
        ZAGlobal.filteredRecords = [...ZAGlobal.waitingRecords];
    }
    await ZAGlobal.reRenderTableBody();
}

let t = {};

async function fetchApprovalRecordsByConnector(type) {
    await setDomainInfo();

    const isChina = ZAGlobal.domainName === 'com.cn';

    const connectorName = isChina
        ? "webbulkupdate.getapprovalrecordsconnectionchina.getapprovalrecordschina"
        : "webbulkupdate.getapprovalrecordsconnection.getapprovalrecords";

    const connectorKey = isChina
        ? "webbulkupdate.getapprovalrecordsconnectionchina"
        : "webbulkupdate.getapprovalrecordsconnection";

    const isAuthorized = async () => {
        const response = await ZOHO.CRM.CONNECTOR.isConnectorAuthorized(connectorKey);
        const isAuthorized = response === "true";
        if (isAuthorized) {
            return isAuthorized;
        } else {
            await openAuthWindow();
            return false;
        }
    }
    async function openAuthWindow() {
        try {
            await ZOHO.CRM.CONNECTOR.authorize(connectorKey);
        } catch (error) {
            console.error("Failed to authorize connector:", error);
        }
    }
    const authorized = await isAuthorized();
    if (!authorized) {
        ZAGlobal.triggerToast(tt("toast_not_authorized"), 3000, 'error');
        return [];
    }

    let page = 1;
    let allRecords = [];
    let more_records = true;

    while (more_records) {
        try {
            const res = await ZOHO.CRM.CONNECTOR.invokeAPI(connectorName, { "type": type, "page": page });

            let parsed;
            try {
                parsed = JSON.parse(res.response);
            } catch (err) {
                break;
            }
            const records = Array.isArray(parsed?.data) ? parsed.data : [];
            allRecords = allRecords.concat(records);

            more_records = parsed?.info?.more_records === true;
            page += 1;

        } catch (err) {
            console.error(`Error fetching page ${page} of ${type} records:`, err);
            break;
        }
    }
    return allRecords;
}

ZOHO.embeddedApp.on("PageLoad", async function (data) {
    //Network error msg
    function startNetworkMonitor() {
        setInterval(() => {
            if (!navigator.onLine) {
                ZAGlobal.triggerToast(tt("toast_network_error"), 3000, 'error');
            }
        }, 15000);
    }

    function showLoader() {
        document.getElementById('bulkLoader').classList.add('show');
    }

    function hideLoader() {
        document.getElementById('bulkLoader').classList.remove('show');
    }
    startNetworkMonitor();
    showLoader();

    const processingTextEl = document.querySelector('.processingText');

    if (processingTextEl) {
        const messageKeys = [
            "processingText1", "processingText2", "processingText3", "processingText4", "processingText5", "processingText6", "processingText7", "processingText8",
        ];

        let index = 0;
        let intervalId;


        const applySlideUp = () => {
            processingTextEl.classList.remove('slideUp');
            void processingTextEl.offsetWidth; // Force reflow
            processingTextEl.classList.add('slideUp');
        };
        const startRotatingMessages = () => {
            processingTextEl.innerText = tt(messageKeys[index]);
            applySlideUp();

            intervalId = setInterval(() => {
                index = (index + 1) % messageKeys.length;
                processingTextEl.innerText = tt(messageKeys[index]);
                applySlideUp();
            }, 3000);
        };
        const waitForTranslations = () => {
            if (typeof t === "object" && t["custom.APPROVAL.processingText1"]) {
                startRotatingMessages();
            } else {
                setTimeout(waitForTranslations, 50);
            }
        };
        waitForTranslations();
    }
    ZAGlobal.module = data.Entity;

    try {
        const userInfo = await ZOHO.CRM.CONFIG.getCurrentUser();
        const currentUser = userInfo?.users?.[0];
        if (currentUser) {
            ZAGlobal.currentUserId = currentUser.id;
        }

        const awaitingRecords = await fetchApprovalRecordsByConnector("awaiting");
        // ZAGlobal.awaitingRecords = [...awaitingRecords];

        ZAGlobal.waitingRecords = [...awaitingRecords];
        let allCombinedRecords = [...awaitingRecords];

        if (ZAGlobal.isAdminOrCEO) {
            const othersAwaitingRecords = await fetchApprovalRecordsByConnector("others_awaiting");

            const awaitingIds = new Set(awaitingRecords.map(record => record.entity.id));
            const filteredOthersAwaiting = othersAwaitingRecords.filter(
                record => !awaitingIds.has(record.entity.id)
            );

            allCombinedRecords = [...awaitingRecords, ...filteredOthersAwaiting];
        }

        // ZAGlobal.awaitingRecords = [...awaitingRecords];     // Self-only
        ZAGlobal.waitingRecords = [...awaitingRecords];      // Self-only
        ZAGlobal.allRecords = [...allCombinedRecords];       // Self + others (used only when needed)
        ZAGlobal.selectedUserId = ZAGlobal.currentUserId;    // Default filter: self
        ZAGlobal.isSelfAndSubordinates = false;              // Default: no subordinates
        await applyInitialFiltersAndRender();                // Apply self-only filter
        await ZAGlobal.reRenderTableBody();                  // Render table

        console.log("All Records:", ZAGlobal.allRecords);
        console.log("Waiting (Self) Records:", ZAGlobal.waitingRecords);
        console.log("Filtered Records (Applied):", ZAGlobal.filteredRecords);


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
    //filterRecords();
    //await ZAGlobalapplyInitialFiltersAndRender();
    //await ZAGlobal.reRenderTableBody();
});