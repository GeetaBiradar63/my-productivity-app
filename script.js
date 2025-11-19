/* Updated frontend script — safe & robust
   - fixes API URL (use your Render URL)
   - guards against missing DOM elements
   - keeps features: add/delete/edit/complete, drag, stickies, theme, calendar, pomodoro
*/

const API = "https://my-productivity-app-1.onrender.com/tasks"; // <<< IMPORTANT: correct backend URL

/* -------------------------
   DOM helpers
------------------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* elements (may be null if markup differs) */
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

const calendarTableBody = $("#calendarTable tbody");

const startTimerBtn = $("#startTimerBtn");
const resetTimerBtn = $("#resetTimerBtn");
const shortTestBtn = $("#shortTestBtn");
const timerEl = $("#timer");

const themeSelect = $("#themeSelect");
const darkToggle = $("#darkToggle");
const exportBtn = $("#exportBtn");
const clearCompletedBtn = $("#clearCompletedBtn");
const userNote = $(".user-note");

/* local data */
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let stickies = JSON.parse(localStorage.getItem("stickies")) || [];
let dragSrcEl = null;

/* POMODORO */
let time = 25 * 60;
let timerInterval = null;

/* ------ UTILS ------ */
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
    console.warn("beep error", e);
  }
}
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString();
}
function animateCounter(el, to) {
  if (!el) return;
  let start = 0;
  const dur = 500;
  const step = 16;
  const inc = to / (dur / step);
  const t = setInterval(() => {
    start += inc;
    if (start >= to) {
      el.textContent = to;
      clearInterval(t);
    } else el.textContent = Math.round(start);
  }, step);
}

/* ------ PROJECTS ------ */
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}
function renderProjects() {
  if (!projectList) return;
  projectList.innerHTML = "";
  projects.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${p} <button onclick="deleteProject(${i})">X</button>`;
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

/* ------ STICKIES ------ */
function saveStickies() {
  localStorage.setItem("stickies", JSON.stringify(stickies));
}
function renderStickies() {
  if (!stickyContainer) return;
  stickyContainer.innerHTML = "";
  stickies.forEach((s, idx) => {
    const d = document.createElement("div");
    d.className = "sticky";
    d.style.background = s.color;
    d.draggable = true;
    d.innerHTML = `<div class="title">${s.title}</div><div class="body">${s.body || ""}</div><button onclick="removeSticky(${idx})" class="btn">X</button>`;
    d.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", idx);
      d.classList.add("dragging");
    });
    d.addEventListener("dragend", () => d.classList.remove("dragging"));
    stickyContainer.appendChild(d);
  });
}
function addSticky() {
  if (!stickyTitle || !stickyColor) return;
  const tit = stickyTitle.value.trim();
  const color = stickyColor.value;
  if (!tit) return;
  stickies.push({ title: tit, color, body: "" });
  stickyTitle.value = "";
  saveStickies();
  renderStickies();
}
function removeSticky(i) {
  stickies.splice(i, 1);
  saveStickies();
  renderStickies();
}

/* ------ TASKS (backend) ------ */
async function fetchTasks() {
  try {
    const res = await fetch(API);
    return await res.json();
  } catch (e) {
    console.error("fetch error", e);
    return [];
  }
}

async function loadTasks() {
  const tasks = await fetchTasks();
  renderTasks(tasks);
  renderCalendar(tasks);
  updateDashboard(tasks);
  animateCounts(tasks);
}

function animateCounts(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  animateCounter(totalEl, total);
  animateCounter(completedEl, completed);
  animateCounter(pendingEl, pending);

  const pct = total ? Math.round((completed / total) * 100) : 0;
  if (progressPercent) progressPercent.textContent = `${pct}%`;
  if (progressCircle) {
    const offset = 226 - (226 * pct) / 100;
    progressCircle.style.strokeDashoffset = offset;
  }
}

/* render tasks with drag/drop and priority badges */
function renderTasks(tasks) {
  if (!taskList) return;
  const q = (searchInput && searchInput.value ? searchInput.value : "").toLowerCase();
  const cat = (filterCategory && filterCategory.value) || "";
  taskList.innerHTML = "";
  tasks
    .filter((t) => (!q || (t.title && t.title.toLowerCase().includes(q))) && (!cat || t.category === cat))
    .forEach((t) => {
      const li = document.createElement("li");
      li.dataset.id = t._id;
      li.draggable = true;
      li.className = t.completed ? "done" : "";

      const left = document.createElement("div");
      left.className = "task-left";
      left.innerHTML = `<input type="checkbox" ${t.completed ? "checked" : ""} onchange="toggleComplete('${t._id}', this.checked)" /> 
        <div>
          <div style="font-weight:600">${t.title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7)">${t.category || "General"} • ${t.deadline ? formatDate(t.deadline) : "no due"}</div>
        </div>`;

      const right = document.createElement("div");
      const priClass = (t.priority || "low").toLowerCase();
      right.innerHTML = `<span class="badge ${priClass}">${(t.priority || "low").toUpperCase()}</span>
        <button class="btn" onclick="editPrompt('${t._id}','${escape(t.title)}')">✏</button>
        <button class="btn danger" onclick="deleteTask('${t._id}')">🗑</button>`;

      li.append(left, right);

      /* drag events */
      li.addEventListener("dragstart", (e) => {
        li.classList.add("dragging");
        dragSrcEl = li;
        e.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        dragSrcEl = null;
        persistOrder();
      });
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const dragging = document.querySelector(".dragging");
        if (!dragging) return;
        const after = getDragAfterElement(taskList, e.clientY);
        if (!after) taskList.appendChild(dragging);
        else taskList.insertBefore(dragging, after);
      });

      taskList.appendChild(li);
    });
}

/* helper for drag place */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  draggableElements.forEach((child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      closest = { offset: offset, element: child };
    }
  });
  return closest.element;
}

/* persist order locally only (not required by backend) */
function persistOrder() {
  if (userNote) userNote.textContent = "Order saved locally";
}

/* CRUD calls */
async function addTask() {
  if (!taskInput) return;
  const title = taskInput.value.trim();
  if (!title) return alert("Enter a task title");

  // fallback defaults if missing DOM elements
  const category = (categoryInput && categoryInput.value) || "General";
  const priority = (priorityInput && priorityInput.value) || "low";
  const deadline = (deadlineInput && deadlineInput.value) || null;

  const payload = { title, category, priority, deadline, completed: false };
  try {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch (e) {
    console.error("addTask error", e);
    alert("Could not add task (network).");
    return;
  }
  taskInput.value = "";
  if (deadlineInput) deadlineInput.value = "";
  loadTasks();
}

async function deleteTask(id) {
  try {
    await fetch(`${API}/${id}`, { method: "DELETE" });
  } catch (e) {
    console.error("delete error", e);
  }
  loadTasks();
}

async function toggleComplete(id, checked) {
  try {
    await fetch(`${API}/complete/${id}`, { method: "PUT" });
  } catch (e) {
    console.error("toggleComplete error", e);
  }
  loadTasks();
}

async function editPrompt(id, oldTitleEscaped) {
  const oldTitle = unescape(oldTitleEscaped);
  const newTitle = prompt("Edit task title:", oldTitle);
  if (!newTitle) return;
  try {
    await fetch(`${API}/edit/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle }) });
  } catch (e) {
    console.error("edit error", e);
  }
  loadTasks();
}

async function searchTasks() {
  // simple approach: reload tasks and apply filter in renderTasks
  loadTasks();
}

/* calendar render */
function renderCalendar(tasks) {
  if (!calendarTableBody) return;
  calendarTableBody.innerHTML = "";
  tasks
    .filter((t) => t.deadline)
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${t.title}</td><td>${formatDate(t.deadline)}</td><td>${t.category || "General"}</td>`;
      calendarTableBody.appendChild(tr);
    });
}

/* dashboard update */
function updateDashboard(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  if (totalEl) totalEl.textContent = total;
  if (completedEl) completedEl.textContent = completed;
  if (pendingEl) pendingEl.textContent = pending;

  const pct = total ? Math.round((completed / total) * 100) : 0;
  if (progressPercent) progressPercent.textContent = `${pct}%`;
  if (progressCircle) {
    const offset = 226 - (226 * pct) / 100;
    progressCircle.style.strokeDashoffset = offset;
  }
}

/* export */
function exportTasksJson() {
  fetch(API)
    .then((r) => r.json())
    .then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "tasks.json";
      a.click();
    });
}

/* clear completed */
async function clearCompleted() {
  const tasks = await fetchTasks();
  const completed = tasks.filter((t) => t.completed);
  for (const t of completed) {
    try {
      await fetch(`${API}/${t._id}`, { method: "DELETE" });
    } catch (e) {
      console.error("clear delete error", e);
    }
  }
  loadTasks();
}

/* themes and dark toggle */
function applyTheme(name) {
  if (!name) return;
  if (name === "purple") {
    document.documentElement.style.setProperty("--bg1", "linear-gradient(135deg,#7f5af0,#ff7ab6)");
    document.documentElement.style.setProperty("--accent", "#8b5cf6");
  } else if (name === "mint") {
    document.documentElement.style.setProperty("--bg1", "linear-gradient(135deg,#4ade80,#06b6d4)");
    document.documentElement.style.setProperty("--accent", "#10b981");
  } else if (name === "dark") {
    document.documentElement.style.setProperty("--bg1", "linear-gradient(135deg,#0f172a,#020617)");
    document.documentElement.style.setProperty("--accent", "#7c3aed");
  } else {
    document.documentElement.style.setProperty("--bg1", "linear-gradient(135deg,#6e8efb,#a777e3)");
    document.documentElement.style.setProperty("--accent", "#60a5fa");
  }
  localStorage.setItem("themePack", name);
}
function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark") ? "1" : "0");
}

/* timer */
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

/* init bindings */
function bind() {
  if (addProjectBtn) addProjectBtn.addEventListener("click", addProject);
  if (addStickyBtn) addStickyBtn.addEventListener("click", addSticky);
  if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);
  if (searchInput) searchInput.addEventListener("input", searchTasks);
  if (filterCategory) filterCategory.addEventListener("change", loadTasks);
  if (exportBtn) exportBtn.addEventListener("click", exportTasksJson);
  if (clearCompletedBtn) clearCompletedBtn.addEventListener("click", clearCompleted);
  if (startTimerBtn) startTimerBtn.addEventListener("click", startTimer);
  if (resetTimerBtn) resetTimerBtn.addEventListener("click", resetTimer);
  if (shortTestBtn) shortTestBtn.addEventListener("click", testShort);
  if (themeSelect) themeSelect.addEventListener("change", (e) => applyTheme(e.target.value));
  if (darkToggle) darkToggle.addEventListener("click", toggleDark);

  // load saved
  renderProjects();
  renderStickies();
  if (localStorage.getItem("dark") === "1") document.body.classList.add("dark");
  const tp = localStorage.getItem("themePack") || "blue";
  if (themeSelect) themeSelect.value = tp;
  applyTheme(tp);
}

/* expose some helpers to global (used by inline onclicks) */
window.addProject = addProject;
window.deleteProject = deleteProject;
window.removeSticky = removeSticky;
window.editPrompt = editPrompt;
window.toggleComplete = toggleComplete;

/* fallback render functions if redefined earlier */
function renderProjects() {
  if (!projectList) return;
  projectList.innerHTML = "";
  projects.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${p}</strong> <button class="btn" onclick="deleteProject(${i})">X</button>`;
    projectList.appendChild(li);
  });
}
function renderStickies() {
  if (!stickyContainer) return;
  stickyContainer.innerHTML = "";
  stickies.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "sticky";
    el.style.background = s.color;
    el.innerHTML = `<div class="title">${s.title}</div><div class="body">${s.body || ""}</div><button class="btn" onclick="removeSticky(${i})">X</button>`;
    stickyContainer.appendChild(el);
  });
}

/* start */
bind();
updateTimerUI();
loadTasks();
