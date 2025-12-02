// ====== CONFIG ======
const API_BASE = "https://my-productivity-app-79up.onrender.com";
const API = `${API_BASE}/tasks`;

const $ = (s) => document.querySelector(s);

// ====== ELEMENTS ======

// Task inputs
const taskInput = $("#taskInput");
const categoryInput = $("#categoryInput");
const priorityInput = $("#priorityInput");
const deadlineInput = $("#deadlineInput");
const addTaskBtn = $("#addTaskBtn");

// Filters
const searchInput = $("#searchInput");
const filterCategory = $("#filterCategory");

// Task list
const taskList = $("#taskList");

// Dashboard
const totalEl = $("#totalTasks");
const completedEl = $("#completedTasks");
const pendingEl = $("#pendingTasks");
const progressPercentEl = $("#progressPercent");
const progressCircle = document.querySelector(".progress-ring__circle");

// Projects
const projectInput = $("#projectInput");
const addProjectBtn = $("#addProjectBtn");
const projectList = $("#projectList");

// Sticky notes
const stickyTitle = $("#stickyTitle");
const stickyColor = $("#stickyColor");
const addStickyBtn = $("#addStickyBtn");
const stickyContainer = $("#stickyContainer");

// Calendar
const calendarBody = document.querySelector("#calendarTable tbody");

// Pomodoro
const timerEl = $("#timer");
const startTimerBtn = $("#startTimerBtn");
const resetTimerBtn = $("#resetTimerBtn");
const shortTestBtn = $("#shortTestBtn");

// Actions
const exportBtn = $("#exportBtn");
const clearCompletedBtn = $("#clearCompletedBtn");

// Theme / dark mode
const themeSelect = $("#themeSelect");
const darkToggle = $("#darkToggle");

// ====== STATE ======
let allTasks = [];
let projects = [];
let stickies = [];

// Pomodoro state
let time = 25 * 60; // seconds
let timerInterval = null;

// Progress ring setup
let circumference = 0;
if (progressCircle) {
  const radius = progressCircle.r.baseVal.value;
  circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = circumference;
}

// ====== UTIL ======
function setProgress(percent) {
  if (!progressCircle) return;
  const offset = circumference - (percent / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;
}

function formatDate(d) {
  if (!d) return "No due";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "No due";
  return date.toLocaleDateString("en-GB");
}

// ====== TASKS / BACKEND ======
async function fetchTasks() {
  try {
    const res = await fetch(API);
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

async function loadTasks() {
  allTasks = await fetchTasks();
  renderTasks();
  updateDashboard();
  updateCalendar();
}

async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return alert("Enter a task title");

  const category = categoryInput ? categoryInput.value : "General";
  const priority = priorityInput ? priorityInput.value : "low";
  const deadline = deadlineInput ? deadlineInput.value : "";

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      category,
      priority,
      deadline,
      completed: false,
    }),
  });

  taskInput.value = "";
  if (deadlineInput) deadlineInput.value = "";
  await loadTasks();
}

async function deleteTask(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  await loadTasks();
}

async function toggleComplete(id) {
  await fetch(`${API}/complete/${id}`, { method: "PUT" });
  await loadTasks();
}

async function editTask(id, existing) {
  const newTitle = prompt("Edit task:", existing.title);
  if (!newTitle) return;

  await fetch(`${API}/edit/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: newTitle,
      category: existing.category,
      priority: existing.priority,
      deadline: existing.deadline,
    }),
  });

  await loadTasks();
}

// ====== RENDER TASKS ======
function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = "";

  const q = (searchInput?.value || "").toLowerCase();
  const catFilter = filterCategory?.value || "";

  allTasks
    .filter((t) =>
      t.title && t.title.toLowerCase().includes(q)
    )
    .filter((t) => !catFilter || t.category === catFilter)
    .forEach((t) => {
      const li = document.createElement("li");
      li.className = "task-item";
      if (t.completed) li.classList.add("done");

      const category = t.category || "General";
      const priority = (t.priority || "low").toLowerCase();
      const deadlineText = t.deadline ? formatDate(t.deadline) : "No due";

      li.innerHTML = `
        <div class="task-left">
          <input type="checkbox" ${t.completed ? "checked" : ""}>
          <div>
            <div class="title">${t.title}</div>
            <small>${category} • ${deadlineText}</small>
          </div>
        </div>
        <div class="task-right">
          <span class="badge ${priority}">${priority.toUpperCase()}</span>
          <button class="btn edit-btn">✏</button>
          <button class="btn danger del-btn">🗑</button>
        </div>
      `;

      const checkbox = li.querySelector("input");
      const delBtn = li.querySelector(".del-btn");
      const editBtn = li.querySelector(".edit-btn");

      checkbox.addEventListener("change", () => toggleComplete(t._id));
      delBtn.addEventListener("click", () => deleteTask(t._id));
      editBtn.addEventListener("click", () => editTask(t._id, t));

      taskList.appendChild(li);
    });
}

// ====== DASHBOARD ======
function updateDashboard() {
  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const pending = total - completed;

  if (totalEl) totalEl.textContent = total;
  if (completedEl) completedEl.textContent = completed;
  if (pendingEl) pendingEl.textContent = pending;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
  setProgress(percent);
}

// ====== CALENDAR ======
function updateCalendar() {
  if (!calendarBody) return;
  calendarBody.innerHTML = "";

  const withDeadlines = allTasks.filter((t) => t.deadline);

  withDeadlines.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.title}</td>
      <td>${formatDate(t.deadline)}</td>
      <td>${t.category || "General"}</td>
    `;
    calendarBody.appendChild(tr);
  });
}

// ====== PROJECTS (LOCALSTORAGE) ======
function loadProjects() {
  try {
    projects = JSON.parse(localStorage.getItem("projects") || "[]");
  } catch {
    projects = [];
  }
  renderProjects();
}

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

function renderProjects() {
  if (!projectList) return;
  projectList.innerHTML = "";
  projects.forEach((p, idx) => {
    const li = document.createElement("li");
    li.textContent = p;
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.marginBottom = "6px";

    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.className = "btn danger";
    btn.style.padding = "2px 6px";
    btn.style.fontSize = "12px";
    btn.addEventListener("click", () => {
      projects.splice(idx, 1);
      saveProjects();
      renderProjects();
    });

    li.appendChild(btn);
    projectList.appendChild(li);
  });
}

function addProject() {
  const name = projectInput.value.trim();
  if (!name) return;
  projects.push(name);
  projectInput.value = "";
  saveProjects();
  renderProjects();
}

// ====== STICKY NOTES (LOCALSTORAGE) ======
function loadStickies() {
  try {
    stickies = JSON.parse(localStorage.getItem("stickies") || "[]");
  } catch {
    stickies = [];
  }
  renderStickies();
}

function saveStickies() {
  localStorage.setItem("stickies", JSON.stringify(stickies));
}

function renderStickies() {
  if (!stickyContainer) return;
  stickyContainer.innerHTML = "";
  stickies.forEach((n, idx) => {
    const div = document.createElement("div");
    div.className = "sticky-note";
    div.style.background = n.color || "#ffd6d6";

    div.innerHTML = `
      <div class="sticky-header">
        <strong>${n.title}</strong>
        <button class="btn danger sticky-del">✕</button>
      </div>
    `;

    div.querySelector(".sticky-del").addEventListener("click", () => {
      stickies.splice(idx, 1);
      saveStickies();
      renderStickies();
    });

    stickyContainer.appendChild(div);
  });
}

function addSticky() {
  const title = stickyTitle.value.trim();
  const color = stickyColor.value;
  if (!title) return;
  stickies.push({ title, color });
  stickyTitle.value = "";
  saveStickies();
  renderStickies();
}

// ====== THEME & DARK MODE ======
function applyTheme(theme) {
  document.body.classList.remove("theme-blue", "theme-purple", "theme-mint");
  if (theme === "blue") document.body.classList.add("theme-blue");
  if (theme === "purple") document.body.classList.add("theme-purple");
  if (theme === "mint") document.body.classList.add("theme-mint");
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "blue";
  const dark = localStorage.getItem("darkMode") === "true";

  if (themeSelect) themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  if (dark) document.body.classList.add("dark");
}

function setDarkMode(on) {
  if (on) {
    document.body.classList.add("dark");
    localStorage.setItem("darkMode", "true");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("darkMode", "false");
  }
}

// ====== POMODORO ======
function updateTimerUI() {
  if (!timerEl) return;
  const m = String(Math.floor(time / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    time--;
    if (time <= 0) {
      time = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      alert("Time's up!");
    }
    updateTimerUI();
  }, 1000);
}

function resetTimer(full = true) {
  clearInterval(timerInterval);
  timerInterval = null;
  time = full ? 25 * 60 : 5; // 5s test if not full
  updateTimerUI();
}

// ====== ACTIONS (EXPORT / CLEAR COMPLETED) ======
async function exportTasks() {
  const tasks = await fetchTasks();
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function clearCompleted() {
  const tasks = await fetchTasks();
  const completed = tasks.filter((t) => t.completed);
  await Promise.all(
    completed.map((t) =>
      fetch(`${API}/${t._id}`, { method: "DELETE" })
    )
  );
  await loadTasks();
}

// ====== EVENT LISTENERS & INIT ======
function initEvents() {
  if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);
  if (searchInput) searchInput.addEventListener("input", renderTasks);
  if (filterCategory) filterCategory.addEventListener("change", renderTasks);

  if (addProjectBtn) addProjectBtn.addEventListener("click", addProject);
  if (addStickyBtn) addStickyBtn.addEventListener("click", addSticky);

  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      const theme = e.target.value;
      applyTheme(theme);
      localStorage.setItem("theme", theme);
    });
  }

  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark");
      localStorage.setItem("darkMode", String(isDark));
    });
  }

  if (startTimerBtn) startTimerBtn.addEventListener("click", startTimer);
  if (resetTimerBtn)
    resetTimerBtn.addEventListener("click", () => resetTimer(true));
  if (shortTestBtn)
    shortTestBtn.addEventListener("click", () => {
      resetTimer(false);
      startTimer();
    });

  if (exportBtn) exportBtn.addEventListener("click", exportTasks);
  if (clearCompletedBtn)
    clearCompletedBtn.addEventListener("click", clearCompleted);
}

async function init() {
  loadTheme();
  loadProjects();
  loadStickies();
  updateTimerUI();
  initEvents();
  await loadTasks();
}

init();
