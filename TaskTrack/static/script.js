// Ask for confirmation before deleting an assignment.
document.addEventListener("DOMContentLoaded", function () {
    const deleteForms = document.querySelectorAll(".delete-form");

    deleteForms.forEach(function (form) {
        form.addEventListener("submit", function (event) {
            const confirmed = window.confirm(
                "Are you sure you want to delete this assignment?"
            );

            if (!confirmed) {
                event.preventDefault();
            }
        });
    });

    // Filter the assignment table as the user types.
    const searchInput = document.getElementById("searchInput");
    const table = document.getElementById("assignmentTable");
    const noResults = document.getElementById("noResults");

    if (searchInput && table) {
        searchInput.addEventListener("input", function () {
            const query = searchInput.value.toLowerCase().trim();
            const rows = table.querySelectorAll("tbody tr");
            let visibleCount = 0;

            rows.forEach(function (row) {
                const matches = row.textContent.toLowerCase().includes(query);
                row.style.display = matches ? "" : "none";

                if (matches) {
                    visibleCount += 1;
                }
            });

            if (noResults) {
                noResults.classList.toggle("hidden", visibleCount > 0);
            }
        });
    }
});
