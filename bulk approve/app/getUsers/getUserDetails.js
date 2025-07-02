ZOHO.embeddedApp.on("PageLoad", function (data) {
    // if (data && data.Entity) {
    ZAGlobal.module = data.Entity;

    ZOHO.CRM.API.getApprovalRecords({ type: "awaiting" })
    .then(async function (toBeApproved) {
        const records = Array.isArray(toBeApproved?.data) ? toBeApproved.data : [];

        ZAGlobal.filteredRecords = [...records];
        ZAGlobal.allRecords = [...records];
        ZAGlobal.waitingRecords = [...records];
        await ZAGlobal.reRenderTableBody();
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
    // allModulesOption.value = 'All_Modules';
    allModulesOption.textContent = t['All_Modules'] || 'All Modules'; 
    allModulesOption.selected = true;
    select.appendChild(allModulesOption);

    modules.forEach(module => {
        if (module.creatable == true && module.visibility == 1) {
            // module.visible == true  &&
            const option = document.createElement('option');
            option.value = module.api_name;

            const translatedLabel = t[module.actual_plural_label] || module.actual_plural_label;
            option.textContent = translatedLabel;
            // option.textContent = module.actual_plural_label;
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
                return t.noResults || "No results found";
            }
        }
    });

    $('#module').on('change', function () {
        handleModuleSelection();
    });
    ZAGlobal.filteredRecords = [...ZAGlobal.allRecords];
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


async function populateUserList() {
    try {
        const res = await ZOHO.CRM.API.getAllUsers({ Type: "AllUsers" });

        if (res.users && res.users.length === 0) {
            ZAGlobal.triggerToast(t.toast_no_users, 3000, 'warning');
            return;
        }
        $('#delegateSection').show();

        const userSelect = $('#userSelect');
        userSelect.empty();

        userSelect.append(new Option('Choose User', '', false, false));
        userSelect.find('option').first().attr('disabled', true);

        const activeUsers = res.users.filter(user => user.status === 'active');

        if (activeUsers.length === 0) {
            ZAGlobal.triggerToast(t.toast_no_active_users, 3000, 'warning');
        }

        activeUsers.forEach((user) => {
            if (user.full_name && user.email) {
                const optionText = `${user.full_name} - (${user.email})`;
                userSelect.append(new Option(optionText, user.id));
            }
        });

    } catch (error) {
        ZAGlobal.triggerToast(t.toast_fetch_user_failed, 3000, 'warning');
    }
}
