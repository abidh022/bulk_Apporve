
// Sorting Related Works - Starts

let tblHeader = document.querySelector("thead");
let tblBody = document.querySelector("._tbody");
let allHeadersList = Array.from(tblHeader.querySelectorAll("tr")[0].children);
let selectedItems = [];

tblHeader.addEventListener("click", (e) => {
    if (e.target === allHeadersList[0] || e.target === document.querySelector('#selectAllCheckbox')) {
        e.stopImmediatePropagation();
        return;
    }
  let th = e.target.closest("th");
    let dropdown = th?.querySelector(".dropdown-menu");
    if (!dropdown) return;

    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";


    let currentDropDown = e.target.closest("th").querySelector(".dropdown-menu");
    if (currentDropDown) {
        (document.querySelectorAll(".dropdown-menu")).forEach(element => {
            if ((element.style.display === "flex") && (currentDropDown !== element)) {
                element.style.display = "none";
            }
        });

        currentDropDown.addEventListener("click", (event) => {
            let clickedBtn = event.target.closest("li");
            if (!clickedBtn)
                return;

            let selectedValue = clickedBtn.innerText.trim();
            selectedItems.push(selectedValue);
            document.querySelectorAll('.dropdown-menu li').forEach(item => {
                if (selectedItems.includes(item.innerText.trim())) {
                    item.classList.add('disabled');
                } else {
                    item.classList.remove('disabled');
                }
            });

            document.querySelectorAll(".dropdown-menu li").forEach(item => item.classList.remove("selected"));
            clickedBtn.classList.add("selected");

            let allRows = Array.from(tblBody.rows);
            let descArr = [];
            let indexOfColumn = allHeadersList.indexOf(currentDropDown.closest("th"));
            let allValuesAreSame = true;

            // Highlight current column
            allHeadersList.forEach(header => header.classList.remove("active-sorted-column"));
            currentDropDown.closest("th").classList.add("active-sorted-column");
            for (let i = 0; i < allRows.length; i++) {
                let cellA = allRows[i].cells[indexOfColumn].innerText;
                if (i > 0) {
                    let cellB = allRows[i - 1].cells[indexOfColumn].innerText;
                    if (cellA !== cellB) {
                        allValuesAreSame = false;
                        break;
                    }
                }
            }

            // if (allValuesAreSame) {
            //     return; 
            // }       

            allRows.sort((rowA, rowB) => {
                let cellA = rowA.cells[indexOfColumn].innerText;
                let cellB = rowB.cells[indexOfColumn].innerText;
                // return cellA.localeCompare(cellB);

                if (cellA.includes("days ago") && cellB.includes('days ago')) {
                    let daysA = parseInt(cellA.split(' ')[0]);
                    let daysB = parseInt(cellB.split(' ')[0]);
                    return daysA - daysB;
                }
                if (cellA.includes(',') && cellB.includes(',')) {
                    let dateA = new Date(cellA);
                    let dateB = new Date(cellB);
                    return dateA - dateB;
                }
                return cellA.localeCompare(cellB);
            });
            if (event.target.classList.contains("desc") || event.target.classList.contains("fa-arrow-down")) {
                allRows.sort((rowA, rowB) => {
                    let cellA = rowA.cells[indexOfColumn].innerText;
                    let cellB = rowB.cells[indexOfColumn].innerText;
                    // return cellA.localeCompare(cellB);

                    if (cellA.includes("days ago") && cellB.includes('days ago')) {
                        let daysA = parseInt(cellA.split(' ')[0]);
                        let daysB = parseInt(cellB.split(' ')[0]);
                        return daysB - daysA;
                    }
                    if (cellA.includes(',') && cellB.includes(',')) {
                        let dateA = new Date(cellA);
                        let dateB = new Date(cellB);
                        return dateB - dateA;
                    }
                    return cellB.localeCompare(cellA);
                });
                allRows.forEach(row => {
                    tblBody.appendChild(row);
                });
            }
            else if (event.target.classList.contains("asc") || event.target.classList.contains("fa-arrow-up")) {
                allRows.forEach(row => {
                    tblBody.appendChild(row)
                });

            }
            else if (event.target.classList.contains("unsort")) {
                initialRows.forEach(row => {
                    tblBody.appendChild(row)
                });
                allHeadersList.forEach(header => header.classList.remove("active-sorted-column"));
            }
            setTimeout(() => {
                currentDropDown.style.display = "none";  // Delay hiding to ensure it's after selection
            }, 10);
        });
    }
});

window.addEventListener("click", (e) => {
    const isInsideTh = e.target.closest("th");
    if (!isInsideTh) {
        document.querySelectorAll(".dropdown-menu").forEach(element => {
            element.style.display = (element.style.display === "flex") ? "none" : "";
        });
    }
});

// sorting related ends here.