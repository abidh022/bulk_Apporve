function tt(key) {
    if (!t) return key;
    return t[`custom.APPROVAL.${key}`] || t[key] || "";
}


function applyTranslations() {
    if (!t) return;

    // Titles and Buttons
    document.getElementById('title').innerText = tt("title");
    document.querySelector('.approve').innerText = tt("approve");
    document.querySelector('.reject').innerText = tt("reject");
    document.getElementById('cancelPopupBtn').innerText = tt("cancel");
    document.getElementById('bulkApprove').innerText = tt("bulkApprove");
    document.getElementById('bulkReject').innerText = tt("bulkReject");
    document.getElementById('bulkDelegate').innerText = tt("bulkDelegate");
    // document.getElementById('approve_single_action_btn').innerText = tt("approve_single_action_btn");

    // Labels and Placeholders
    document.querySelector('label[for="comment"]').innerText = tt("commentLabel");
    document.querySelector('label[for="otherReason"]').innerText = tt("specifyLabel");
    document.getElementById('otherReason').placeholder = tt("specifyPlaceholder");
    document.getElementById('comment').placeholder = tt("commentPlaceholder");
    document.getElementById('cta_filter').innerHTML = tt("cta_filter");
    document.getElementById('cta_clear_filter').innerHTML = tt("cta_clear_filter");

    document.querySelector('label[for="userSelect"]').innerText = tt("userLabel");
    document.querySelector('label[for="rejectionReason"]').innerText = tt("rejectionReasonLabel");
    document.getElementById('popupTitle').innerText = tt("popupTitle");

    document.getElementById('record-name-filter-input').placeholder = tt("record-name-filter-input");


    // Table Headers
    document.querySelector('#recordNameHeader .tbl-heading').innerText = tt("recordName");
    document.querySelector('#approvalProcessNameHeader .tbl-heading').innerText = tt("approvalProcess");
    document.querySelector('#ownerNameHeader .tbl-heading').innerText = tt("ownerName");
    document.querySelector('#moduleIdHeader .tbl-heading').innerText = tt("module");
    document.querySelector('#dateCreatedBy .tbl-heading').innerText = tt("createdDate");
    document.querySelector('.no-of-days .tbl-heading').innerText = tt("noOfDays");
    document.querySelector('#action').innerText = tt("action");
    document.querySelector('.processingText').innerText = tt("processingText");
    document.getElementById('clearSelectedRecords').innerText = tt("clearSelectedRecords");
    document.getElementById('module-placeholder').innerText = tt("module-placeholder");


    // Sort Dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        const ascItem = menu.querySelector('.asc');
        const descItem = menu.querySelector('.desc');
        const unsortItem = menu.querySelector('.unsort');

        if (ascItem) ascItem.innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${tt("sortAsc")}`;
        if (descItem) descItem.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${tt("sortDesc")}`;
        if (unsortItem) unsortItem.innerHTML = `<i class="fa-solid fa-xmark"></i> ${tt("sortUnsort")}`;
    });

    // Filter Select Options
    const filterSelect = document.getElementById('record-name-filter');
    if (filterSelect) {
        const translationsMap = {
            equals: tt("filter_equals"),
            not_equals: tt("filter_not_equals"),
            starts_with: tt("filter_starts_with"),
            is: tt("filter_is")
        };

        Array.from(filterSelect.options).forEach(opt => {
            const key = opt.value;
            if (translationsMap[key]) {
                opt.textContent = translationsMap[key];
            }
        });
    }

    // Modules List (Modules come from Zoho API, use module name directly)
    const moduleSelect = document.getElementById('module');
    const modulesList = document.getElementById('modules-list');

    [moduleSelect, modulesList].forEach(select => {
        if (!select) return;

        const tryTranslate = () => {
            if (select.options.length === 0) {
                return setTimeout(tryTranslate, 50);
            }

            Array.from(select.options).forEach(opt => {
                const raw = (opt.value || opt.textContent.trim()).replace(/\    s+/g, "_"); // normalize
                const key = `custom.APPROVAL.module.${raw}`;
                const tr = t[key];
            });
        };

        tryTranslate();
    });

    // Rejection Reasons
    const rejectionReasonSelect = document.getElementById('rejectionReason');
    if (rejectionReasonSelect) {
        Array.from(rejectionReasonSelect.options).forEach(option => {
            const baseKey = `custom.APPROVAL.reason.${option.value}`;
            const fallbackKey = `custom.APPROVAL.reason${option.textContent.trim()}`;
            const translation = t[baseKey] || t[fallbackKey];
            if (translation) {
                option.textContent = translation;
            }
        });
    }

    document.querySelectorAll('[data-tt]').forEach(el => {
        const key = el.getAttribute('data-tt');
        const translated = t[`custom.APPROVAL.${key}`];
        if (translated) {
            el.setAttribute('data-tooltip', translated);
        }
    });


    // Total Records Count
    const totalRecordsCountEl = document.getElementById('totalRecordsCount');
    if (totalRecordsCountEl) {
        totalRecordsCountEl.innerText = tt("totalRecordsCount");
    } else {
        console.warn("Element with ID 'totalRecordsCount' not found.");
    }

    // Translate dynamic action buttons
    document.querySelectorAll('.approve-btn .btn-label').forEach(el => {
        el.innerText = tt("approve");
    });
    document.querySelectorAll('.delegate-btn .btn-label').forEach(el => {
        el.innerText = tt("delegate");
    });
    document.querySelectorAll('.reject-btn .btn-label').forEach(el => {
        el.innerText = tt("reject");
    });
}


function validateTranslations(translations, fallback) {
    for (const key in fallback) {
        if (!(key in translations)) {
            console.warn(`Missing translation key: ${key}`);
            translations[key] = fallback[key];
        }
    }
    return translations;
}


function loadTranslation(langCode) {
    // console.log(langCode);

    return fetch(`translations/${langCode}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Translation file for '${langCode}' not found (HTTP ${response.status}). Falling back to English.`);
            }
            return response.json();
        })
        .then(translations => {
            if (langCode !== 'en') {
                // Load English as fallback to validate against
                return fetch('translations/en.json')
                    .then(enRes => enRes.json())
                    .then(enTranslations => {
                        t = validateTranslations(translations, enTranslations);
                        // console.log(`Translations loaded for: ${langCode}`);
                        applyTranslations();
                    });
            } else {
                t = translations;
                // console.log(`Translations loaded for: ${langCode}`);
                applyTranslations();
            }
        })
        .catch(error => {
            console.warn(error.message);
            if (langCode !== 'en') {
                return loadTranslation('en');
            }
        });
}

async function setDomainInfo() {
    try {
        const envData = await ZOHO.CRM.CONFIG.GetCurrentEnvironment();
        const deployment = (envData.deployment || '').toLowerCase();
        ZAGlobal.orgDomain = envData.zgid;

        switch (deployment) {
            case 'china':
                ZAGlobal.domainName = 'com.cn';
                break;
            case 'in':
                ZAGlobal.domainName = 'in';
                break;
            case 'us':
                ZAGlobal.domainName = 'com';
                break;
            default:
                ZAGlobal.domainName = 'com';
        }
    } catch (error) {
        console.error('Error fetching deployment or org info:', error);
        ZAGlobal.domainName = 'com';
    }
}

async function initZohoApp() {
    try {
        await ZOHO.embeddedApp.init();
        // await setDomainInfo(); 

        const user = await ZOHO.CRM.CONFIG.getCurrentUser();
        let currentUser = user.users[0];

        const userProfile = currentUser.profile.name.toLowerCase();
        const userRole = currentUser.role.name.toLowerCase();
        const currentUserId = currentUser.id;
        ZAGlobal.currentUserId = currentUserId;

        // console.log(`User Profile: ${userProfile}, Role: ${userRole}`);
        console.log(user);
        

        ZAGlobal.isAdminOrCEO = (userProfile === 'administrator' || userRole === 'ceo');
        console.log(`Is Admin or CEO: ${ZAGlobal.isAdminOrCEO} `,userProfile, userRole); // Is Admin or CEO: false  standard manager
        

        let userLocale = currentUser.locale || 'en';
        let langCode = userLocale.startsWith('zh') ? 'zh' : 'en';

        ZAGlobal.userLang = langCode;

        await loadTranslation(langCode);
        setupOwnerDropdownHeader();// owner header

        const modulesData = await ZOHO.CRM.META.getModules();
        if (modulesData && Array.isArray(modulesData.modules)) {
            populateModules(modulesData.modules);
        }

    } catch (error) {
        console.error('Error initializing Zoho app:', error);
        // Fallback to English if initialization fails
        await loadTranslation('en');
    }
}
initZohoApp();