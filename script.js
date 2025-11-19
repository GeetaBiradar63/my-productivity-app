/* FINAL script.js — complete & ready
   - matches the provided index.html
   - Dark Mode: button toggle only
   - Backend API: https://my-productivity-app-1.onrender.com/tasks
*/

const API = "https://my-productivity-app-79up.onrender.com";


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

const userNote = $(".user-note");

/* Local data */
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let stickies = JSON.parse(localStorage.getItem("stickies")) || [];
let dragSrc = null;

/* Pomodoro */
let time = 25 * 60;
let timerInterval = null;

/* ---- Utilities ---- */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn("beep failed", e);
  }
}

function formatDateISO(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString();
}

function safeText(s) {
  if (s === undefined || s === null) return "";
  return String(s);
}

/* ---- Projects ---- */
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}
function renderProjects() {
  if (!projectList) return;
  projectList.innerHTML = "";
  projects.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${p}</strong> <button class="btn" onclick="deleteProject(${i})">X</button>`;
    projectList.appendChild(li);
  });
}
function addProject() {
  if (!projectInput) return;
  const v = projectInput.value.trim();
  if (!v) return;
  projects.push(v);
  saveProjects();
  projectInput.value = "";
  renderProjects();
}
function deleteProject(i) {
  projects.splice(i, 1);
  saveProjects();
  renderProjects();
}

/* ---- Stickies ---- */
function saveStickies() {
  localStorage.setItem("stickies", JSON.stringify(stickies));
}
function renderStickies() {
  if (!stickyContainer) return;
  stickyContainer.innerHTML = "";
  stickies.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "sticky";
    el.style.background = s.color || "#ffd6d6";
    el.innerHTML = `<div class="title">${s.title}</div><button class="btn" onclick="removeSticky(${i})">X</button>`;
    stickyContainer.appendChild(el);
  });
}
function addSticky() {
  if (!stickyTitle || !stickyColor) return;
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

/* ---- Backend: Tasks ---- */
async function fetchTasks() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Network response not ok");
    return await res.json();
  } catch (e) {
    console.error("fetchTasks:", e);
    return [];
  }
}

async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return alert("Enter a task title");

  const category = categoryInput?.value || "General";
  const priority = priorityInput?.value || "low";
  const deadline = deadlineInput?.value || null;

  const payload = {
    title,
    category,
    priority,
    deadline,
    completed: false
  };

  console.log("Sending to backend:", payload);

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  taskInput.value = "";
  deadlineInput.value = "";
  loadTasks();
}


async function deleteTask(id) {
  try {
    await fetch(`${API}/${id}`, { method: "DELETE" });
  } catch (e) {
    console.error("deleteTask error", e);
  }
  loadTasks();
}

async function toggleComplete(id) {
  try {
    await fetch(`${API}/complete/${id}`, { method: "PUT" });
  } catch (e) {
    console.error("toggleComplete error", e);
  }
  loadTasks();
}

async function editTaskPrompt(id, title) {
  const nt = prompt("Edit task:", title);
  if (!nt) return;
  try {
    await fetch(`${API}/edit/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nt }),
    });
  } catch (e) {
    console.error("editTask error", e);
  }
  loadTasks();
}

/* ---- Render Tasks ---- */
function renderTasks(tasks) {
  if (!taskList) return;
  const q = searchInput ? safeText(searchInput.value).toLowerCase() : "";
  const cat = filterCategory ? safeText(filterCategory.value) : "";

  taskList.innerHTML = "";
  tasks
    .filter((t) => (!q || (t.title && t.title.toLowerCase().includes(q))) && (!cat || t.category === cat))
    .forEach((t) => {
      const li = document.createElement("li");
      li.dataset.id = t._id || "";
      li.draggable = true;

      const left = document.createElement("div");
      left.className = "task-left";
      left.innerHTML = `
        <input type="checkbox" ${t.completed ? "checked" : ""} />
        <div>
          <div class="title">${safeText(t.title)}</div>
          <small>${safeText(t.category || "General")} • ${t.deadline ? formatDateISO(t.deadline) : "No due"}</small>
        </div>
      `;

      const right = document.createElement("div");
      right.className = "task-right";
      const priority = safeText(t.priority || "low");
      right.innerHTML = `
        <span class="badge ${priority}">${priority.toUpperCase()}</span>
        <button class="btn">✏</button>
        <button class="btn danger">🗑</button>
      `;

      // checkbox behaviour
      left.querySelector("input").addEventListener("change", () => toggleComplete(t._id));

      // edit/delete buttons
      right.querySelectorAll("button")[0].addEventListener("click", () => editTaskPrompt(t._id, t.title));
      right.querySelectorAll("button")[1].addEventListener("click", () => {
        if (confirm("Delete task?")) deleteTask(t._id);
      });

      li.appendChild(left);
      li.appendChild(right);

      // drag events (visual ordering only)
      li.addEventListener("dragstart", (e) => {
        dragSrc = li;
        li.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragend", () => {
        if (li) li.classList.remove("dragging");
        dragSrc = null;
      });
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        if (!dragging) return;
        const after = getDragAfterElement(taskList, e.clientY);
        if (!after) taskList.appendChild(dragging);
        else taskList.insertBefore(dragging, after);
      });

      taskList.appendChild(li);
    });
}

/* helper for drag */
function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll("li:not(.dragging)")];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* ---- Calendar ---- */
function renderCalendar(tasks) {
  if (!calendarBody) return;
  calendarBody.innerHTML = "";
  tasks.filter(t => t.deadline).forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${safeText(t.title)}</td><td>${formatDateISO(t.deadline)}</td><td>${safeText(t.category)}</td>`;
    calendarBody.appendChild(tr);
  });
}

/* ---- Dashboard ---- */
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
    const offset = 226 - (226 * pct) / 100;
    progressCircle.style.strokeDashoffset = offset;
  }
}

/* ---- Export & Clear ---- */
async function exportTasksJson() {
  const tasks = await fetchTasks();
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tasks.json";
  a.click();
}

async function clearCompleted() {
  const tasks = await fetchTasks();
  const completed = tasks.filter(t => t.completed);
  for (const t of completed) {
    try { await fetch(`${API}/${t._id}`, { method: "DELETE" }); } catch (e) { console.error(e); }
  }
  loadTasks();
}

/* ---- Load & init ---- */
async function loadTasks() {
  const tasks = await fetchTasks();
  renderTasks(tasks);
  renderCalendar(tasks);
  updateDashboard(tasks);
}

function applyTheme(name) {
  if (!name) return;
  document.documentElement.style.setProperty("--theme-name", name);
  localStorage.setItem("theme", name);
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark") ? "1" : "0");
}

/* ---- Timer controls ---- */
function updateTimerUI() {
  const m = String(Math.floor(time / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");
  if (timerEl) timerEl.textContent = `${m}:${s}`;
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

/* ---- Bind events and startup ---- */
function bind() {
  if (addProjectBtn) addProjectBtn.addEventListener("click", addProject);
  if (addStickyBtn) addStickyBtn.addEventListener("click", addSticky);
  if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);

  if (searchInput) searchInput.addEventListener("input", loadTasks);
  if (filterCategory) filterCategory.addEventListener("change", loadTasks);

  if (startTimerBtn) startTimerBtn.addEventListener("click", startTimer);
  if (resetTimerBtn) resetTimerBtn.addEventListener("click", resetTimer);
  if (shortTestBtn) shortTestBtn.addEventListener("click", testShort);

  if (themeSelect) themeSelect.addEventListener("change", (e) => applyTheme(e.target.value));
  if (darkToggle) darkToggle.addEventListener("click", toggleDarkMode);

  if (exportBtn) exportBtn.addEventListener("click", exportTasksJson);
  if (clearCompletedBtn) clearCompletedBtn.addEventListener("click", clearCompleted);

  // load local data UI
  renderProjects();
  renderStickies();

  // load saved theme/dark
  const t = localStorage.getItem("theme") || "purple";
  if (themeSelect) themeSelect.value = t;
  applyTheme(t);
  if (localStorage.getItem("dark") === "1") document.body.classList.add("dark");

  updateTimerUI();
  loadTasks();
}

/* expose for inline HTML handlers */
window.deleteProject = deleteProject;
window.removeSticky = removeSticky;
window.toggleComplete = toggleComplete;
window.editTaskPrompt = editTaskPrompt;
window.deleteTask = deleteTask;

bind();



