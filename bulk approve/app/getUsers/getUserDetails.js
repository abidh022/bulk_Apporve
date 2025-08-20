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
        dropdownAutoWidth: false,
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

    const selectedUserId = ZAGlobal.selectedUserId || ZAGlobal.currentUserId;
    const isSelfAndSubordinates = ZAGlobal.isSelfAndSubordinates || false;

    if (selectedModule === 'All_Modules') {
        ZAGlobal.filteredRecords = isSelfAndSubordinates
            ? [...ZAGlobal.allRecords]
            : ZAGlobal.allRecords.filter(r => r.waiting_for?.id === selectedUserId);
    } else {
        ZAGlobal.filteredRecords = isSelfAndSubordinates
            ? ZAGlobal.allRecords.filter(r => r.module === selectedModule)
            : ZAGlobal.allRecords.filter(r =>
                r.waiting_for?.id === selectedUserId && r.module === selectedModule
            );
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

        // 🟢 Initialize Select2 (after options are populated)
        userSelect.select2({
            placeholder: t["custom.APPROVAL.chooseUser"] || "Select User",
            width: '100%',
            allowClear: true,
        });
        const select2Container = userSelect.next('.select2-container');
        if (select2Container.length) {
            select2Container.addClass('userSelect');
        }

    } catch (error) {
        console.error("User fetch failed:", error);
        ZAGlobal.triggerToast(tt("toast_fetch_user_failed"), 3000, 'warning');
    }
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
        ZAGlobal.selectedUserId = userId;
        ZAGlobal.isSelfAndSubordinates = false;

        await new Promise(resolve => setTimeout(resolve, 100));
        const filtered = ZAGlobal.allRecords.filter(record =>
            record.waiting_for?.id === userId
        );

        // console.log(filtered);

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


function injectOwnerDropdown(users) {
    const ownerHeader = $('#ownerNameHeader .tbl-hdr-inner-container');
    ownerHeader.find('.menu-bar').remove();

    if (!ZAGlobal.isAdminOrCEO) return;
    console.log(ZAGlobal.isAdminOrCEO);
    
    if (!ZAGlobal.currentUserId) return;

    const currentUserId = ZAGlobal.currentUserId;
    const currentUser = users.find(u => u.id === currentUserId);
    const currentUserName = currentUser?.full_name || 'You';
    // console.log(`Current User: ${currentUserName} (${currentUserId})` ,currentUser);
    
    // console.log(currentUserId);
    // console.log(ZAGlobal.currentUserId);


    // Count how many records are assigned to each user
    const userCounts = {};
    ZAGlobal.allRecords.forEach(record => {
        const id = record.waiting_for?.id;
        if (id) {
            userCounts[id] = (userCounts[id] || 0) + 1;
        }
    });

    // Create dropdown structure
    const caretIcon = $('<i>', { class: 'fa-solid fa-caret-down' });
    const dropdownMenu = $('<div>', { class: 'dropdown-menu user-dropdown', style: 'display: none;' });
    const searchInput = $('<input>', {
        type: 'text',
        placeholder: 'Search users...',
        class: 'user-search-input'
    });
    const userList = $('<ul>', { class: 'user-list' });

    dropdownMenu.append(searchInput, userList);
    const dropdown = $('<span>', { class: 'menu-bar', 'data-tt': 'tooltip_users' }).append(caretIcon, dropdownMenu);

    // Add to header
    ownerHeader.append(dropdown);

    // 🔁 Render Function
    function renderUsers(filteredUsers) {
        userList.empty();

        if (filteredUsers.length === 0) {
            userList.append($('<li>').addClass('no-user').text("No users found"));
            return;
        }

        // ➤ Self
    const selfItem = $('<li>')
        .addClass('user-item self-user')
        .text(`Self (${currentUserName})`)
        .on('click', () => {
            ZAGlobal.selectedUserId = currentUserId;
            ZAGlobal.isSelfAndSubordinates = false;
            ZAGlobal.reRenderTableBody();
            renderUsers(filteredUsers); // Rerender to update active state
            dropdownMenu.hide();
        });

    if (ZAGlobal.selectedUserId === currentUserId && !ZAGlobal.isSelfAndSubordinates) {
        selfItem.addClass('active');
    }

    selfItem.appendTo(userList);

    // ➤ Self & Subordinates
    const subordinatesItem = $('<li>')
        .addClass('user-item subordinates-user')
        .text(`Self & Subordinates`)
        .on('click', () => {
            ZAGlobal.selectedUserId = null;
            ZAGlobal.isSelfAndSubordinates = true;
            ZAGlobal.reRenderTableBody();
            renderUsers(filteredUsers); // Update active state
            dropdownMenu.hide();
        });

    if (ZAGlobal.isSelfAndSubordinates) {
        subordinatesItem.addClass('active');
    }

    subordinatesItem.appendTo(userList);

    // ➤ Other Users
    filteredUsers.forEach(user => {
        if (user.id === currentUserId) return;

        const otherItem = $('<li>')
            .addClass('user-item')
            .text(`${user.full_name}`)
            .attr('data-id', user.id)
            .on('click', () => {
                ZAGlobal.selectedUserId = user.id;
                ZAGlobal.isSelfAndSubordinates = false;
                ZAGlobal.reRenderTableBody();
                renderUsers(filteredUsers); // Rerender to highlight active
                dropdownMenu.hide();
            });

        if (ZAGlobal.selectedUserId === user.id && !ZAGlobal.isSelfAndSubordinates) {
            otherItem.addClass('active');
        }

        otherItem.appendTo(userList);
    });
}
    // Handle search input
    searchInput.on('input', function () {
        const query = $(this).val().toLowerCase().trim();
        const filtered = users.filter(user =>
            user.full_name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );

        const showAll = query === '';
        renderUsers(filtered, showAll);
    });

    //  Toggle dropdown when clicking header OR caret icon
    ownerHeader.off('click').on('click', function (e) {
        e.stopPropagation();
        $('.dropdown-menu').not(dropdownMenu).hide(); // Close others
        const isVisible = dropdownMenu.is(':visible');
        dropdownMenu.toggle(!isVisible);

        if (!isVisible) {
            searchInput.val('');
            renderUsers(users, true);
        }
    });

    // Prevent closing dropdown when clicking inside it
    dropdownMenu.on('click', e => e.stopPropagation());

    // Hide dropdown on outside click
    $(document).on('click', () => {
        dropdownMenu.hide();
    });
}


















// function injectOwnerDropdown(users) {
//     const ownerHeader = $('#ownerNameHeader .tbl-hdr-inner-container');
//     ownerHeader.find('.menu-bar').remove();

//     if (!ZAGlobal.isAdminOrCEO) return;

//     // Create dropdown structure
//     const caretIcon = $('<i>', { class: 'fa-solid fa-caret-down' });
//     const dropdownMenu = $('<div>', { class: 'dropdown-menu user-dropdown', style: 'display: none;' });
//     const searchInput = $('<input>', {
//         type: 'text',
//         placeholder: 'Search users...',
//         class: 'user-search-input'
//     });
//     const userList = $('<ul>', { class: 'user-list' });

//     dropdownMenu.append(searchInput, userList);

//     const dropdown = $('<span>', { class: 'menu-bar', 'data-tt': 'tooltip_users' }).append(caretIcon, dropdownMenu);

//     // Add to header
//     ownerHeader.append(dropdown);

//     // Render function
//     function renderUsers(filteredUsers, includeAllUsers = false) {
//         userList.empty();

//         if (filteredUsers.length === 0) {
//             userList.append($('<li>').addClass('no-user').text("No users found"));
//             return;
//         }

//         if (includeAllUsers) {
//             userList.append(
//                 $('<li>').addClass('user-item').text("All Users").on('click', () => {
//                     ZAGlobal.filteredRecords = [...ZAGlobal.allRecords];
//                     ZAGlobal.waitingRecords = [...ZAGlobal.allRecords];
//                     ZAGlobal.reRenderTableBody();
//                     // Remove underline on all headers to mimic unsort
//                     document.querySelectorAll("thead th").forEach(header => {
//                         header.classList.remove("active-sorted-column");
//                     });
//                     dropdownMenu.hide();
//                 })
//             );
//         }

//         filteredUsers.forEach(user => {
//             $('<li>')
//                 .addClass('user-item')
//                 .text(`${user.full_name} (${user.email})`)
//                 .attr('data-id', user.id)
//                 .on('click', () => {
//                     filterByOwner(user.id);
//                     dropdownMenu.hide();
//                 })
//                 .appendTo(userList);
//         });
//     }

//     // 🔍 Handle search input
//     searchInput.on('input', function () {
//         const query = $(this).val().toLowerCase().trim();
//         const filtered = users.filter(user =>
//             user.full_name.toLowerCase().includes(query) ||
//             user.email.toLowerCase().includes(query)
//         );

//         const showAll = query === '';
//         renderUsers(filtered, showAll);
//     });

//     // 🖱️ Toggle dropdown when clicking header OR caret icon
//     ownerHeader.off('click').on('click', function (e) {
//         e.stopPropagation();
//         $('.dropdown-menu').not(dropdownMenu).hide(); // Close others
//         const isVisible = dropdownMenu.is(':visible');
//         dropdownMenu.toggle(!isVisible);

//         if (!isVisible) {
//             searchInput.val('');
//             renderUsers(users, true);
//         }
//     });

//     // Stop click inside dropdown from closing it
//     dropdownMenu.on('click', e => e.stopPropagation());

//     // Hide dropdown on outside click
//     $(document).on('click', () => {
//         dropdownMenu.hide();
//     });
// }
