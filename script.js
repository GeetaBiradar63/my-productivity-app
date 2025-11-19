/* FINAL script.js — corrected API + full task rendering + working theme */

/* ---- Correct Backend API ---- */
const API = "https://my-productivity-app-1.onrender.com/tasks";

/* DOM helpers */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* Elements */
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

const calendarTable = $("#calendarTable");
const calendarBody = calendarTable ? calendarTable.querySelector("tbody") : null;

const startTimerBtn = $("#startTimerBtn");
const resetTimerBtn = $("#resetTimerBtn");
const shortTestBtn = $("#shortTestBtn");
const timerEl = $("#timer");

const themeSelect = $("#themeSelect");
const darkToggle = $("#darkToggle");

const exportBtn = $("#exportBtn");
const clearCompletedBtn = $("#clearCompletedBtn");

/* Local Storage Data */
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let stickies = JSON.parse(localStorage.getItem("stickies")) || [];
let dragSrc = null;

/* Pomodoro */
let time = 25 * 60;
let timerInterval = null;

/* --- Helpers --- */
function safeText(x) { return x ? x : ""; }

function formatDateISO(d) {
  if (!d) return "No due";
  return new Date(d).toLocaleDateString();
}

/* --- Fetch Tasks --- */
async function fetchTasks() {
  try {
    const res = await fetch(API);
    return await res.json();
  } catch (e) {
    console.error("fetch error", e);
    return [];
  }
}

/* ---- Add Task ---- */
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return alert("Enter a task title");

  const payload = {
    title,
    category: categoryInput.value,
    priority: priorityInput.value,
    deadline: deadlineInput.value || null,
    completed: false
  };

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  taskInput.value = "";
  deadlineInput.value = "";
  loadTasks();
}

/* ---- Delete ---- */
async function deleteTask(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  loadTasks();
}

/* ---- Complete ---- */
async function toggleComplete(id) {
  await fetch(`${API}/complete/${id}`, { method: "PUT" });
  loadTasks();
}

/* ---- Edit ---- */
async function editTaskPrompt(id, oldTitle) {
  const newTitle = prompt("Edit task:", oldTitle);
  if (!newTitle) return;

  await fetch(`${API}/edit/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newTitle })
  });

  loadTasks();
}

/* ================================
      FIXED TASK RENDERING
================================ */
function renderTasks(tasks) {
  taskList.innerHTML = "";

  const q = searchInput.value.toLowerCase();
  const cat = filterCategory.value;

  tasks
    .filter(t =>
      (!q || t.title.toLowerCase().includes(q)) &&
      (!cat || t.category === cat)
    )
    .forEach(t => {

      const li = document.createElement("li");
      li.className = t.completed ? "done" : "";

      /* LEFT SIDE */
      const left = document.createElement("div");
      left.className = "task-left";

      left.innerHTML = `
        <input type="checkbox" ${t.completed ? "checked" : ""} />
        <div>
          <div class="title">${t.title}</div>
          <small>
            ${t.category} • ${t.priority.toUpperCase()} • 
            ${t.deadline ? formatDateISO(t.deadline) : "No due"}
          </small>
        </div>
      `;

      left.querySelector("input").onclick = () => toggleComplete(t._id);

      /* RIGHT SIDE */
      const right = document.createElement("div");
      right.className = "task-right";

      right.innerHTML = `
        <span class="badge ${t.priority}">${t.priority.toUpperCase()}</span>
        <button class="btn edit">✏</button>
        <button class="btn danger del">🗑</button>
      `;

      right.querySelector(".edit").onclick = () =>
        editTaskPrompt(t._id, t.title);

      right.querySelector(".del").onclick = () =>
        deleteTask(t._id);

      li.appendChild(left);
      li.appendChild(right);
      taskList.appendChild(li);
    });
}

/* --- Calendar --- */
function renderCalendar(tasks) {
  if (!calendarBody) return;
  calendarBody.innerHTML = "";

  tasks.filter(t => t.deadline).forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.title}</td>
      <td>${formatDateISO(t.deadline)}</td>
      <td>${t.category}</td>
    `;
    calendarBody.appendChild(tr);
  });
}

/* --- Dashboard --- */
function updateDashboard(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const pend = total - done;

  totalEl.textContent = total;
  completedEl.textContent = done;
  pendingEl.textContent = pend;

  const pct = total ? Math.round((done / total) * 100) : 0;
  progressPercent.textContent = pct + "%";

  const offset = 226 - (226 * pct) / 100;
  progressCircle.style.strokeDashoffset = offset;
}

/* --- Export --- */
async function exportTasksJson() {
  const tasks = await fetchTasks();
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tasks.json";
  a.click();
}

/* --- Clear Completed --- */
async function clearCompleted() {
  const tasks = await fetchTasks();
  for (const t of tasks.filter(t => t.completed)) {
    await fetch(`${API}/${t._id}`, { method: "DELETE" });
  }
  loadTasks();
}

/* --- Projects + Stickies --- */
function renderProjects() {
  projectList.innerHTML = "";
  projects.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${p} <button onclick="deleteProject(${i})">X</button>`;
    projectList.appendChild(li);
  });
}
function addProject() {
  if (!projectInput.value.trim()) return;
  projects.push(projectInput.value.trim());
  projectInput.value = "";
  localStorage.setItem("projects", JSON.stringify(projects));
  renderProjects();
}
function deleteProject(i) {
  projects.splice(i, 1);
  localStorage.setItem("projects", JSON.stringify(projects));
  renderProjects();
}

function renderStickies() {
  stickyContainer.innerHTML = "";
  stickies.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "sticky";
    el.style.background = s.color;
    el.innerHTML = `${s.title} <button onclick="removeSticky(${i})">X</button>`;
    stickyContainer.appendChild(el);
  });
}
function addSticky() {
  if (!stickyTitle.value.trim()) return;
  stickies.push({ title: stickyTitle.value, color: stickyColor.value });
  stickyTitle.value = "";
  localStorage.setItem("stickies", JSON.stringify(stickies));
  renderStickies();
}
function removeSticky(i) {
  stickies.splice(i, 1);
  localStorage.setItem("stickies", JSON.stringify(stickies));
  renderStickies();
}

/* --- Timer --- */
function updateTimerUI() {
  timerEl.textContent =
    String(Math.floor(time / 60)).padStart(2, "0") +
    ":" +
    String(time % 60).padStart(2, "0");
}
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    time--;
    updateTimerUI();
    if (time <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      playBeep();
      alert("Time's up!");
      time = 25 * 60;
      updateTimerUI();
    }
  }, 1000);
}
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  time = 25 * 60;
  updateTimerUI();
}
function testShort() {
  time = 5;
  updateTimerUI();
  startTimer();
}

/* --- Theme --- */
function applyTheme(name) {
  document.documentElement.setupTheme = name;
  localStorage.setItem("theme", name);
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark"));
}

/* --- Load Tasks --- */
async function loadTasks() {
  const tasks = await fetchTasks();
  renderTasks(tasks);
  renderCalendar(tasks);
  updateDashboard(tasks);
}

/* --- Bind & Init --- */
function bind() {
  addTaskBtn.onclick = addTask;
  addProjectBtn.onclick = addProject;
  addStickyBtn.onclick = addSticky;

  startTimerBtn.onclick = startTimer;
  resetTimerBtn.onclick = resetTimer;
  shortTestBtn.onclick = testShort;

  searchInput.oninput = loadTasks;
  filterCategory.onchange = loadTasks;

  exportTasksJson.onclick = exportTasksJson;
  clearCompletedBtn.onclick = clearCompleted;

  themeSelect.onchange = e => applyTheme(e.target.value);
  darkToggle.onclick = toggleDarkMode;

  renderProjects();
  renderStickies();

  const savedTheme = localStorage.getItem("theme") || "purple";
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  if (localStorage.getItem("dark") === "true") {
    document.body.classList.add("dark");
  }

  updateTimerUI();
  loadTasks();
}

window.deleteProject = deleteProject;
window.removeSticky = removeSticky;
window.editTaskPrompt = editTaskPrompt;
window.toggleComplete = toggleComplete;
window.deleteTask = deleteTask;

bind();
