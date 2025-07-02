function applyTranslations() {
    if (!t) return;

    document.getElementById('title').innerText = t.title;
    // document.getElementById('bulkReject').innerText = t.bulkReject;
    // document.getElementById('bulkApprove').innerText = t.bulkApprove;
    document.querySelector('.approve').innerText = t.approve;
    document.querySelector('.reject').innerText = t.reject;
    document.getElementById('cancelPopupBtn').innerText = t.cancel;

    document.querySelector('label[for="comment"]').innerText = t.commentLabel;
    document.querySelector('label[for="otherReason"]').innerText = t.specifyLabel;
    document.getElementById('otherReason').placeholder = t.specifyPlaceholder;

    document.getElementById('comment').placeholder = t.commentPlaceholder;
    document.getElementById('cta_filter').innerHTML = t.cta_filter;
    document.getElementById('cta_clear_filter').innerHTML = t.cta_clear_filter;

    document.querySelector('label[for="userSelect"]').innerText = t.userLabel;
    document.querySelector('label[for="rejectionReason"]').innerText = t.rejectionReasonLabel;
    document.getElementById('popupTitle').innerText = t.popupTitle;

    const filterInput = document.getElementById('record-name-filter-input');
    if (filterInput && t["record-name-filter-input"]) {
        filterInput.placeholder = t["record-name-filter-input"];
        // console.log(`Filter input placeholder set to: ${t["record-name-filter-input"]}`);

    }

    // Table headers
    document.querySelector('#recordNameHeader .tbl-heading').innerText = t.recordName;
    document.querySelector('#approvalProcessNameHeader .tbl-heading').innerText = t.approvalProcess;
    document.querySelector('#moduleIdHeader .tbl-heading').innerText = t.module;
    document.querySelector('#dateCreatedBy .tbl-heading').innerText = t.createdDate;
    document.querySelector('.no-of-days .tbl-heading').innerText = t.noOfDays;
    document.querySelector('#action').innerText = t.action;

    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        const ascItem = menu.querySelector('.asc');
        const descItem = menu.querySelector('.desc');
        const unsortItem = menu.querySelector('.unsort');

        if (ascItem) ascItem.innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${t.sortAsc}`;
        if (descItem) descItem.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${t.sortDesc}`;
        if (unsortItem) unsortItem.innerHTML = `<i class="fa-solid fa-xmark"></i> ${t.sortUnsort}`;
    });
    const filterSelect = document.getElementById('record-name-filter');
    if (filterSelect) {
        const translationsMap = {
            equals: t.filter_equals,
            not_equals: t.filter_not_equals,
            starts_with: t.filter_starts_with,
            is: t.filter_is
        };

        Array.from(filterSelect.options).forEach(opt => {
            const key = opt.value;
            if (translationsMap[key]) {
                opt.textContent = translationsMap[key];
            }
        });
    }
    const moduleList = document.getElementById('modules-list');
    if (moduleList && t) {
        Array.from(moduleList.options).forEach(option => {
            const translated = t[option.value];
            if (translated) {
                option.textContent = translated;
            }
        });
    }
    const moduleSelect = document.getElementById('module');
    const modulesList = document.getElementById('modules-list');

    if (moduleSelect && t) {
        Array.from(moduleSelect.options).forEach(option => {
            const translated = t[option.textContent.trim()];
            if (translated) {
                option.textContent = translated;
            }
        });
    }

    if (modulesList && t) {
        Array.from(modulesList.options).forEach(option => {
            const translated = t[option.value] || t[option.textContent.trim()];
            if (translated) {
                option.textContent = translated;
            }
        });
    }

    const rejectionReasonSelect = document.getElementById('rejectionReason');
    if (rejectionReasonSelect && t) {
        Array.from(rejectionReasonSelect.options).forEach(option => {
            // Try translation key by value first
            let key = `reason_${option.value}`;
            if (t[key]) {
                option.textContent = t[key];
            }
            // Fallback: Try using display text as key
            else {
                key = `reason_${option.textContent.trim()}`;
                if (t[key]) {
                    option.textContent = t[key];
                }
            }
        });
    }
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
    console.log(langCode);

    fetch(`translations/${langCode}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Translation file not found. Falling back to English.");
            }
            return response.json();
        })
        .then(translations => {
            if (langCode !== 'en') {
                // Load English as fallback to validate against
                fetch('translations/en.json')
                    .then(enRes => enRes.json())
                    .then(enTranslations => {
                        t = validateTranslations(translations, enTranslations);
                        console.log(`Translations loaded for: ${langCode}`);
                        applyTranslations();
                    });
            } else {
                t = translations;
                console.log(`Translations loaded for: ${langCode}`);
                applyTranslations();
            }
        })
        .catch(error => {
            console.warn(error.message);
            if (langCode !== 'en') {
                loadTranslation('en');
            }
        });
}


ZOHO.embeddedApp.init().then(() => {
    ZOHO.CRM.CONFIG.getCurrentUser().then(data => {
        let userLocale = data.users[0].locale || 'en';

        let langCode = userLocale;

        console.log(langCode);
        // Normalize Chinese variants
        if (userLocale === 'zh_CN' || userLocale === 'zh_TW') {
            langCode = 'zh';
        }

        ZAGlobal.userLang = langCode;
        loadTranslation(langCode); // Now only applyTranslations() will run after loading
    }).catch(error => {
        console.error('Error fetching current user:', error);
        loadTranslation('en');
    });
}).catch(error => {
    console.error('Error initializing Zoho SDK:', error);
});
