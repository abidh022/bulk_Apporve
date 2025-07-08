function tt(key) {
    return t[`custom.APPROVAL.${key}`] || `custom.APPROVAL.${key}`;
}

function applyTranslations() {
    if (!t) return;

    // Titles and Buttons
    document.getElementById('title').innerText = tt("title");
    document.querySelector('.approve').innerText = tt("approve");
    document.querySelector('.reject').innerText = tt("reject");
    document.getElementById('cancelPopupBtn').innerText = tt("cancel");

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

    const filterInput = document.getElementById('record-name-filter-input');
    if (filterInput) {
        filterInput.placeholder = tt("record-name-filter-input");
    }

    // Table Headers
    document.querySelector('#recordNameHeader .tbl-heading').innerText = tt("recordName");
    document.querySelector('#approvalProcessNameHeader .tbl-heading').innerText = tt("approvalProcess");
    document.querySelector('#moduleIdHeader .tbl-heading').innerText = tt("module");
    document.querySelector('#dateCreatedBy .tbl-heading').innerText = tt("createdDate");
    document.querySelector('.no-of-days .tbl-heading').innerText = tt("noOfDays");
    document.querySelector('#action').innerText = tt("action");

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
            const raw = (opt.value || opt.textContent.trim()).replace(/\s+/g, "_"); // normalize
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
                return loadTranslation('en');
            }
        });
}

ZOHO.embeddedApp.init().then(() => {
    ZOHO.CRM.CONFIG.getCurrentUser().then(data => {
        let userLocale = data.users[0].locale || 'en';

        let langCode = userLocale;

        console.log(langCode);
        // Normalize Chinese variants
           if (langCode.startsWith('zh')) {
            langCode = 'zh';
        } else if (langCode.startsWith('en')) {
            langCode = 'en';}
        // Add more if you have additional translations

        console.log("Normalized langCode:", langCode);
        ZAGlobal.userLang = langCode;

        // Load translations first, then fetch modules & populate
        loadTranslation(langCode).then(() => {
            return ZOHO.CRM.META.getModules();
        }).then(data => {
            if (data && Array.isArray(data.modules)) {
                populateModules(data.modules);
            }
        }).catch(error => {
            console.error('Error fetching modules:', error);
        });

    }).catch(error => {
        console.error('Error fetching current user:', error);
        // fallback: load English, then fetch modules & populate
        loadTranslation('en').then(() => {
            return ZOHO.CRM.META.getModules();
        }).then(data => {
            if (data && Array.isArray(data.modules)) {
                populateModules(data.modules);
            }
        }).catch(error => {
            console.error('Error fetching modules:', error);
        });
    });
}).catch(error => {
    console.error('Error initializing Zoho SDK:', error);
});