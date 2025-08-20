
//sakthi code
async function filterRecords() {
    let filtered_flag = false;
    let Module = document.getElementById('modules-list');
    let searchInput = document.getElementById('record-name-filter-input');
    let recordName_filter_type = document.getElementById('record-name-filter');
    let searchBtn = document.getElementById('cta_filter');
    let clearBtn = document.getElementById('cta_clear_filter');


    // searchInput.placeholder = t["record-name-filter-input"];
    // searchBtn.title = t["tooltip_search_btn"] || "Enter text to search";

    searchBtn.disabled = true;
    searchBtn.style.opacity = "0.5";
    searchBtn.style.cursor = "not-allowed";

    // Enable/disable search button based on input
    searchInput.addEventListener('input', () => {
        const hasText = searchInput.value.trim().length > 0;
        searchBtn.disabled = !hasText;
        searchBtn.style.opacity = hasText ? "1" : "0.5";
        searchBtn.style.cursor = hasText ? "pointer" : "not-allowed";
    });

    searchBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        let res = await ZOHO.CRM.API.getApprovalRecords({ type: "awaiting" });
        let data = res.data;

        if (searchInput.value.trim() === '') {
            ZAGlobal.triggerToast(tt("toast_enter_search_key"), 1000, 'info');
            searchInput.focus();
            return;
        }

        const searchValue = searchInput.value.trim().toLowerCase();

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


    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (filtered_flag) {
            filtered_flag = false;
            searchInput.value = '';
            searchBtn.disabled = true;
            searchBtn.style.opacity = "0.5";
            searchBtn.style.cursor = "not-allowed";
            document.getElementById('record-name-filter-input').value = '';
            
             $('#module').val('All_Modules').trigger('change');
            document.getElementById('selected-module-display').style.display = 'none';
            ZAGlobal.filteredRecords = ZAGlobal.allRecords;
            ZAGlobal.reRenderTableBody();
        } else {
            ZAGlobal.triggerToast(tt("toast_nothing_to_clear"), 1000, 'info');
        }
    });
}

// document.getElementById('filter-icon').addEventListener('click', (e) => {
//     e.preventDefault();
//     document.querySelector('#moduleContainer').classList.toggle('disabled');
//     document.querySelector('.filter-div').classList.toggle('hidden');
// });
document.getElementById('filter-icon').addEventListener('click', (e) => {
    e.preventDefault();

    const moduleContainer = document.querySelector('#moduleContainer');
    const filterDiv = document.querySelector('.filter-div');
    const moduleSelect = $('#module'); // jQuery Select2
    const modulePlaceholder = document.getElementById('module-placeholder');

    const isNowHidden = filterDiv.classList.toggle('hidden');

    if (!isNowHidden) {
        moduleSelect.select2('destroy');
        moduleSelect.hide();
        modulePlaceholder.style.display = 'inline-block';
    } else {
        moduleSelect.show();
        modulePlaceholder.style.display = 'none';

        // ⚠️ Delay reinitialization slightly to ensure proper layout
        setTimeout(() => {
            moduleSelect.select2();
        }, 10); // 10–50ms is usually enough
    }
});
