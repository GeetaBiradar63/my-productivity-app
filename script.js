/* -----------------------------------------
   FULL FRONTEND SCRIPT (COMPLETE + FIXED)
   Works with: https://my-productivity-app-1.onrender.com
----------------------------------------- */

const API = "https://my-productivity-app-1.onrender.com/tasks";  // <<< Your backend

/* ------------ DOM Shortcuts ------------ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ------------ Elements ------------ */
const totalEl = $("#totalTasks");
const completedEl = $("#completedTasks");
const pendingEl = $("#pendingTasks");
const progressPercent = $("#progressPercent");
const progressCircle = document.querySelector(".progress-ring__circle");

const projectInput = $("#projectInput");
const addProjectBtn = $("#addProjectBtn");
const projectList = $("#projectList");

const stickyTitle = $("#stickyTitle");
const stickyColor = $("#stickyColor");
const addStickyBtn = $("#addStickyBtn");
const stickyContainer = $("#stickyContainer");

const taskInput = $("#taskInput");
const addTaskBtn = $("#addTaskBtn");
const categoryInput = $("#categoryInput");
const priorityInput = $("#priorityInput");
const deadlineInput = $("#deadlineInput");
const searchInput = $("#searchInput");
const filterCategory = $("#filterCategory");
const taskList = $("#taskList");

const calendarTableBody = $("#calendarTableBody");

const startTimerBtn = $("#startTimerBtn");
const resetTimerBtn = $("#resetTimerBtn");
const shortTestBtn = $("#shortTestBtn");
const timerEl = $("#timer");

const themeSelect = $("#themeSelect");
const darkToggle = $("#darkToggle");

/* ------------ Local Storage ------------ */
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let stickies = JSON.parse(localStorage.getItem("stickies")) || [];

/* ------------ Pomodoro ------------ */
let time = 25 * 60;
let timerInterval = null;

function updateTimer() {
    let m = String(Math.floor(time / 60)).padStart(2, "0");
    let s = String(time % 60).padStart(2, "0");
    if (timerEl) timerEl.textContent = `${m}:${s}`;
}

function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        time--;
        updateTimer();
        if (time <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            alert("Time’s up!");
            time = 25 * 60;
            updateTimer();
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    time = 25 * 60;
    updateTimer();
}

function shortTest() {
    time = 5;
    updateTimer();
    startTimer();
}

/* ------------ Projects ------------ */
function saveProjects() {
    localStorage.setItem("projects", JSON.stringify(projects));
}

function renderProjects() {
    if (!projectList) return;
    projectList.innerHTML = "";
    projects.forEach((p, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${p}</strong> <button onclick="deleteProject(${i})">X</button>`;
        projectList.appendChild(li);
    });
}

function addProject() {
    const p = projectInput.value.trim();
    if (!p) return;
    projects.push(p);
    saveProjects();
    projectInput.value = "";
    renderProjects();
}

function deleteProject(i) {
    projects.splice(i, 1);
    saveProjects();
    renderProjects();
}

/* ------------ Sticky Notes ------------ */
function saveStickies() {
    localStorage.setItem("stickies", JSON.stringify(stickies));
}

function renderStickies() {
    if (!stickyContainer) return;
    stickyContainer.innerHTML = "";
    stickies.forEach((s, i) => {
        const d = document.createElement("div");
        d.className = "sticky";
        d.style.background = s.color;
        d.innerHTML = `
            <div class="title">${s.title}</div>
            <button onclick="removeSticky(${i})">X</button>
        `;
        stickyContainer.appendChild(d);
    });
}

function addSticky() {
    const title = stickyTitle.value.trim();
    if (!title) return;
    stickies.push({ title, color: stickyColor.value });
    saveStickies();
    stickyTitle.value = "";
    renderStickies();
}

function removeSticky(i) {
    stickies.splice(i, 1);
    saveStickies();
    renderStickies();
}

/* ------------ Tasks (Backend) ------------ */
async function fetchTasks() {
    try {
        const res = await fetch(API);
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function loadTasks() {
    const tasks = await fetchTasks();
    renderTasks(tasks);
    renderCalendar(tasks);
    updateDashboard(tasks);
}

async function addTask() {
    const title = taskInput.value.trim();
    if (!title) return;

    const body = {
        title,
        category: categoryInput.value,
        priority: priorityInput.value,
        deadline: deadlineInput.value || null,
        completed: false
    };

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    taskInput.value = "";
    deadlineInput.value = "";
    loadTasks();
}

async function deleteTask(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadTasks();
}

async function toggleComplete(id, checked) {
    await fetch(`${API}/complete/${id}`, { method: "PUT" });
    loadTasks();
}

async function editTask(id, oldTitle) {
    const nt = prompt("Edit task:", oldTitle);
    if (!nt) return;

    await fetch(`${API}/edit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nt })
    });

    loadTasks();
}

/* ------------ Rendering Tasks ------------ */
function renderTasks(tasks) {
    if (!taskList) return;
    taskList.innerHTML = "";

    const q = searchInput.value.toLowerCase();
    const cat = filterCategory.value;

    tasks
        .filter(t => !q || t.title.toLowerCase().includes(q))
        .filter(t => !cat || t.category === cat)
        .forEach(t => {
            const li = document.createElement("li");
            li.className = t.completed ? "done" : "";

            li.innerHTML = `
                <div class="task-left">
                    <input type="checkbox" ${t.completed ? "checked" : ""} 
                           onchange="toggleComplete('${t._id}', this.checked)">
                    <div>
                        <div class="title">${t.title}</div>
                        <small>${t.category} • ${t.deadline || "No due"}</small>
                    </div>
                </div>
                <div class="task-right">
                    <button onclick="editTask('${t._id}', '${t.title}')">✏</button>
                    <button onclick="deleteTask('${t._id}')">🗑</button>
                </div>
            `;

            taskList.appendChild(li);
        });
}

/* ------------ Calendar ------------ */
function renderCalendar(tasks) {
    if (!calendarTableBody) return;
    calendarTableBody.innerHTML = "";

    tasks.filter(t => t.deadline).forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${t.title}</td>
            <td>${t.deadline}</td>
            <td>${t.category}</td>
        `;
        calendarTableBody.appendChild(row);
    });
}

/* ------------ Dashboard ------------ */
function updateDashboard(tasks) {
    if (!totalEl) return;

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    totalEl.textContent = total;
    completedEl.textContent = completed;
    pendingEl.textContent = pending;

    const pct = total ? Math.round((completed / total) * 100) : 0;
    if (progressPercent) progressPercent.textContent = pct + "%";

    if (progressCircle) {
        const offset = 226 - (226 * pct / 100);
        progressCircle.style.strokeDashoffset = offset;
    }
}

/* ------------ Themes ------------ */
function applyTheme(name) {
    document.body.setAttribute("data-theme", name);
    localStorage.setItem("theme", name);
}

function applyDarkMode() {
    const dark = document.body.classList.toggle("dark");
    localStorage.setItem("dark", dark ? "1" : "0");
}

/* ------------ Initial Bindings ------------ */
function init() {
    if (addProjectBtn) addProjectBtn.onclick = addProject;
    if (addStickyBtn) addStickyBtn.onclick = addSticky;
    if (addTaskBtn) addTaskBtn.onclick = addTask;

    if (searchInput) searchInput.oninput = loadTasks;
    if (filterCategory) filterCategory.onchange = loadTasks;

    if (startTimerBtn) startTimerBtn.onclick = startTimer;
    if (resetTimerBtn) resetTimerBtn.onclick = resetTimer;
    if (shortTestBtn) shortTestBtn.onclick = shortTest;

    if (themeSelect) themeSelect.onchange = (e) => applyTheme(e.target.value);
    if (darkToggle) darkToggle.onclick = applyDarkMode;

    /* Load saved theme */
    applyTheme(localStorage.getItem("theme") || "blue");
    if (localStorage.getItem("dark") === "1") document.body.classList.add("dark");

    renderProjects();
    renderStickies();
    updateTimer();
    loadTasks();
}

init();

/* Export functions to global for inline HTML buttons */
window.deleteProject = deleteProject;
window.removeSticky = removeSticky;
window.toggleComplete = toggleComplete;
window.editTask = editTask;
window.deleteTask = deleteTask;
