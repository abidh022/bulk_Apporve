function populateModules(modules) {
    const select = document.getElementById('module');
    const modulesList = document.getElementById('modules-list');
    const previousValue = select.value;

    // Destroy existing select2 instance if it exists
    if ($.fn.select2 && $('#module').hasClass('select2-hidden-accessible')) {
        $('#module').select2('destroy');
    }

    // Clear current options
    select.innerHTML = '';
    modulesList.innerHTML = '';

    // Add "All Modules" option
    const allModulesOption = document.createElement('option');
    allModulesOption.value = 'All_Modules';
    allModulesOption.textContent = t['custom.APPROVAL.module.All_Modules'] || 'All Modules';
    select.appendChild(allModulesOption);

    const availableModuleNames = new Set(ZAGlobal.allRecords.map(r => r.module));

    modules.forEach(module => {
        const moduleName = module.api_name;

        if (module.creatable === true && module.visibility === 1 && availableModuleNames.has(moduleName)) {
            const option = document.createElement('option');
            option.value = moduleName;
            const translatedLabel = t[`custom.APPROVAL.module.${moduleName}`] || module.actual_plural_label;
            option.textContent = translatedLabel;
            select.appendChild(option);

            const optionClone = option.cloneNode(true);
            modulesList?.appendChild(optionClone);
        }
    });

    // Initialize Select2 with search
    $('#module').select2({
        allowClear: true,
        width: '100%',
        dropdownAutoWidth: true,
        closeOnSelect: true,
        language: {
            noResults: function () {
                return t["custom.APPROVAL.noResults"] || "No results found";
            }
        }
    });

    // Restore previous value or default
    const validValues = Array.from(select.options).map(opt => opt.value);
    const valueToSet = validValues.includes(previousValue) ? previousValue : 'All_Modules';
    $('#module').val(valueToSet).trigger('change.select2');

    // Avoid duplicate event handlers
    $('#module').off('select2:select').on('select2:select', handleModuleSelection);

    // Initial filtered data
    ZAGlobal.filteredRecords = [...ZAGlobal.allRecords];
}

// Handler to filter records on selection
function handleModuleSelection() {
    const selectedModule = $('#module').val();

    if (selectedModule === 'All_Modules') {
        ZAGlobal.filteredRecords = [...ZAGlobal.allRecords];
    } else {
        ZAGlobal.filteredRecords = ZAGlobal.allRecords.filter(record => record.module === selectedModule);
    }

    ZAGlobal.reRenderTableBody();
}


async function populateUserList() {
    try {
        const res = await ZOHO.CRM.API.getAllUsers({ Type: "AllUsers" });

        if (res.users && res.users.length === 0) {
            ZAGlobal.triggerToast(tt("toast_no_users"), 3000, 'warning');
            return;
        }
        $('#delegateSection').show();

        const userSelect = $('#userSelect');
        userSelect.empty();

        userSelect.append(new Option(t["custom.APPROVAL.chooseUser"] || "Select User", '', false, false));
        userSelect.find('option').first().attr('disabled', true);

        const activeUsers = res.users.filter(user => user.status === 'active');

        if (activeUsers.length === 0) {
            ZAGlobal.triggerToast(tt("toast_no_active_users"), 3000, 'warning');
        }

        activeUsers.forEach((user) => {
            if (user.full_name && user.email) {
                const optionText = `${user.full_name} - (${user.email})`;
                userSelect.append(new Option(optionText, user.id));
            }
        });

    } catch (error) {
        ZAGlobal.triggerToast(tt("toast_fetch_user_failed"), 3000, 'warning');
    }
}


//Network error msg
function startNetworkMonitor() {
    setInterval(() => {
        if (!navigator.onLine) {
            ZAGlobal.triggerToast(tt("toast_network_error"), 3000, 'error');
        }
    }, 15000); // every 15 seconds
}

//developer console warning
(function () {
    const styleTitle = [
        'font-size: 30px',
        'font-weight: bold',
        'color: red',
        'text-shadow: 1px 1px black'
    ].join(';');

    const styleMessage = [
        'font-size: 16px',
        'color: yellow',
    ].join(';');

    console.log('%cSTOP!', styleTitle);
    console.log("%cThis is a browser feature intended for developers. Do not enter or paste code which you don't understand. It may allow attackers to steal your information or impersonate you. See https://en.wikipedia.org/wiki/Self-XSS for more info.", styleMessage);
})();




// Function to filter records by owner
async function filterByOwner(userId) {
    try {
        showLoader(); 
        await new Promise(resolve => setTimeout(resolve, 100)); 
        const filtered = ZAGlobal.allRecords.filter(record => 
            record.waiting_for?.id === userId
        );

        console.log(filtered);
        
        ZAGlobal.filteredRecords = filtered;
        ZAGlobal.waitingRecords = filtered;

        await ZAGlobal.reRenderTableBody();

        if (filtered.length === 0) {
            ZAGlobal.triggerToast("No records found for the selected user.", 3000, 'info');
        }
    } catch (error) {
        console.error("Error while filtering by owner:", error);
        ZAGlobal.triggerToast("An error occurred while filtering.", 3000, 'error');
    } finally {
        hideLoader(); 
    }
}

// Function to set up the owner dropdown in the header
async function setupOwnerDropdownHeader() {
    try {
        const res = await ZOHO.CRM.API.getAllUsers({ Type: "AllUsers" });

        if (!res.users || res.users.length === 0) {
            return; // No users to show
        }

        const activeUsers = res.users.filter(user => user.status === 'active');

        injectOwnerDropdown(activeUsers); // Inject into header

    } catch (error) {
        console.error("Failed to fetch users for owner dropdown");
    }
}

// Function to inject the owner dropdown into the header
function injectOwnerDropdown(users) {
    const ownerHeader = $('#ownerNameHeader .tbl-hdr-inner-container');

    ownerHeader.find('.menu-bar').remove(); 

    if (ZAGlobal.isAdminOrCEO) {
        // Admin/CEO – show user list dropdown
        const dropdown = $('<span>', { class: 'menu-bar', 'data-tt': 'tooltip_users' }).append(
            $('<i>', { class: 'fa-solid fa-caret-down' }),
            $('<ul>', { class: 'dropdown-menu user-dropdown' }).append(
                $('<li>')
                    .text("All Users")
                    .on('click', function () {
                        ZAGlobal.filteredRecords = [...ZAGlobal.allRecords];
                        ZAGlobal.waitingRecords = [...ZAGlobal.allRecords];
                        ZAGlobal.reRenderTableBody();
                    }),
                ...users.map(user => {
                    return $('<li>')
                        .text(`${user.full_name} (${user.email})`)
                        .attr('data-id', user.id)
                        .on('click', function () {
                            filterByOwner(user.id);
                        });
                })
            )
        );
        ownerHeader.append(dropdown);
    } 
    //for non-admin users, we can show a message or disable the dropdown
    // else {
    //     // Not admin – show toast on click
    //     const toastTrigger = $('<span>', { class: 'menu-bar', 'data-tt': 'tooltip_users' }).append(
    //         $('<i>', { class: 'fa-solid fa-caret-down' }).css('cursor', 'pointer')
    //     );

    //     toastTrigger.on('click', () => {
    //         ZAGlobal.triggerToast("This is accessible only for admin.", 3000, 'warning');
    //     });

    //     ownerHeader.append(toastTrigger);
    // }
}
