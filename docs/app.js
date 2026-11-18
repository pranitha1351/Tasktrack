// TaskTrack - browser version for GitHub Pages.
// Same features as the Flask app, but assignments are stored in the
// browser (localStorage) because GitHub Pages cannot run Python.
(function () {
    "use strict";

    var STORAGE_KEY = "tasktrack.assignments";
    var memoryStore = null; // used if localStorage is unavailable

    // ---------- storage ----------
    function load() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return memoryStore || [];
        }
    }

    function save(tasks) {
        memoryStore = tasks;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) { /* keep in memory only */ }
    }

    function nextId(tasks) {
        return tasks.reduce(function (max, t) { return Math.max(max, t.id); }, 0) + 1;
    }

    // ---------- helpers ----------
    function todayIso() {
        var d = new Date();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + m + "-" + day;
    }

    function validDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        var parts = value.split("-").map(Number);
        var d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.getFullYear() === parts[0] && d.getMonth() === parts[1] - 1 && d.getDate() === parts[2];
    }

    // Same rules as valid_assignment_form() in app.py
    function readForm(form) {
        var data = {
            title: form.elements.title.value.trim(),
            subject: form.elements.subject.value.trim(),
            description: form.elements.description.value.trim(),
            due_date: form.elements.due_date.value.trim()
        };
        if (!data.title || !data.subject || !validDate(data.due_date)) return null;
        return data;
    }

    function statusOf(task, today) {
        if (task.status === "Completed") return "completed";
        return task.due_date < today ? "overdue" : "pending";
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text; // textContent = no HTML injection
        return node;
    }

    var $ = function (id) { return document.getElementById(id); };

    // ---------- notices ----------
    var noticeTimer = null;
    function showNotice(message, isError) {
        var box = $("notice");
        box.textContent = message;
        box.className = "notice " + (isError ? "error" : "success");
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(function () { box.className = "notice hidden"; }, 4000);
    }

    // ---------- dashboard ----------
    function renderDashboard() {
        var today = todayIso();
        var tasks = load().slice().sort(function (a, b) {
            if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
            return b.id - a.id; // ORDER BY due_date ASC, id DESC
        });

        var completed = 0, overdue = 0;
        tasks.forEach(function (t) {
            var s = statusOf(t, today);
            if (s === "completed") completed += 1;
            if (s === "overdue") overdue += 1;
        });

        $("today").textContent = "Today: " + today;
        $("countTotal").textContent = tasks.length;
        $("countCompleted").textContent = completed;
        $("countOverdue").textContent = overdue;
        $("countPending").textContent = tasks.length - completed - overdue;

        var tbody = $("assignmentRows");
        tbody.textContent = "";

        tasks.forEach(function (task) {
            var tr = document.createElement("tr");

            var titleCell = el("td", "assignment-title");
            titleCell.appendChild(el("strong", null, task.title));
            if (task.description) titleCell.appendChild(el("small", null, task.description));
            tr.appendChild(titleCell);

            tr.appendChild(el("td", null, task.subject));
            tr.appendChild(el("td", null, task.due_date));

            var s = statusOf(task, today);
            var statusCell = el("td");
            statusCell.appendChild(el("span", "status " + s, s.charAt(0).toUpperCase() + s.slice(1)));
            tr.appendChild(statusCell);

            var actions = el("div", "action-group");
            var edit = el("a", "button small secondary", "Edit");
            edit.href = "#/edit/" + task.id;
            var toggle = el("button", "button small success", task.status === "Completed" ? "Reopen" : "Complete");
            toggle.type = "button";
            toggle.addEventListener("click", function () { toggleTask(task.id); });
            var del = el("button", "button small danger", "Delete");
            del.type = "button";
            del.addEventListener("click", function () { deleteTask(task.id); });
            actions.appendChild(edit);
            actions.appendChild(toggle);
            actions.appendChild(del);
            var actionCell = el("td");
            actionCell.appendChild(actions);
            tr.appendChild(actionCell);

            tbody.appendChild(tr);
        });

        var hasTasks = tasks.length > 0;
        $("tableWrapper").classList.toggle("hidden", !hasTasks);
        $("emptyState").classList.toggle("hidden", hasTasks);
        $("searchInput").value = "";
        $("noResults").classList.add("hidden");
    }

    function toggleTask(id) {
        var tasks = load();
        tasks.forEach(function (t) {
            if (t.id === id) t.status = t.status === "Completed" ? "Pending" : "Completed";
        });
        save(tasks);
        renderDashboard();
        showNotice("Assignment status updated.");
    }

    function deleteTask(id) {
        if (!window.confirm("Are you sure you want to delete this assignment?")) return;
        save(load().filter(function (t) { return t.id !== id; }));
        renderDashboard();
        showNotice("Assignment deleted successfully.");
    }

    // ---------- edit page ----------
    function findTask(id) {
        return load().filter(function (t) { return t.id === id; })[0];
    }

    function showEdit(id) {
        var task = findTask(id);
        if (!task) {
            location.hash = "";
            showNotice("The requested assignment was not found.", true);
            return;
        }
        var form = $("editForm");
        form.dataset.id = String(id);
        form.elements.title.value = task.title;
        form.elements.subject.value = task.subject;
        form.elements.due_date.value = task.due_date;
        form.elements.description.value = task.description || "";
        $("editNotice").classList.add("hidden");
        $("dashboardView").classList.add("hidden");
        $("editView").classList.remove("hidden");
        document.title = "Edit Assignment | TaskTrack";
        window.scrollTo(0, 0);
    }

    function showDashboard() {
        $("editView").classList.add("hidden");
        $("dashboardView").classList.remove("hidden");
        document.title = "TaskTrack | Assignment Manager";
        renderDashboard();
    }

    // ---------- routing ----------
    function route() {
        var match = /^#\/edit\/(\d+)$/.exec(location.hash);
        if (match) showEdit(Number(match[1]));
        else showDashboard();
    }

    // ---------- events ----------
    document.addEventListener("DOMContentLoaded", function () {
        $("addForm").addEventListener("submit", function (event) {
            event.preventDefault();
            var data = readForm(this);
            if (!data) {
                showNotice("Please enter a title, subject, and valid due date.", true);
                return;
            }
            var tasks = load();
            data.id = nextId(tasks);
            data.status = "Pending";
            tasks.push(data);
            save(tasks);
            this.reset();
            renderDashboard();
            showNotice("Assignment added successfully.");
        });

        $("editForm").addEventListener("submit", function (event) {
            event.preventDefault();
            var data = readForm(this);
            if (!data) {
                $("editNotice").classList.remove("hidden");
                return;
            }
            var id = Number(this.dataset.id);
            var tasks = load();
            tasks.forEach(function (t) {
                if (t.id === id) {
                    t.title = data.title;
                    t.subject = data.subject;
                    t.description = data.description;
                    t.due_date = data.due_date;
                }
            });
            save(tasks);
            location.hash = "";
            showNotice("Assignment updated successfully.");
        });

        // Filter the assignment table as the user types.
        $("searchInput").addEventListener("input", function () {
            var query = this.value.toLowerCase().trim();
            var visible = 0;
            $("assignmentRows").querySelectorAll("tr").forEach(function (row) {
                var matches = row.textContent.toLowerCase().indexOf(query) !== -1;
                row.style.display = matches ? "" : "none";
                if (matches) visible += 1;
            });
            $("noResults").classList.toggle("hidden", visible > 0);
        });

        window.addEventListener("hashchange", route);
        route();
    });
})();
