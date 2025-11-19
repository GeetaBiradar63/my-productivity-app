/* Original working script.js but FIXED for category/priority/deadline */

const API = "https://my-productivity-app-79up.onrender.com/tasks";

/* DOM shortcuts */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* Inputs */
const taskInput = $("#taskInput");
const categoryInput = $("#categoryInput");
const priorityInput = $("#priorityInput");
const deadlineInput = $("#deadlineInput");
const addTaskBtn = $("#addTaskBtn");
const taskList = $("#taskList");
const searchInput = $("#searchInput");
const filterCategory = $("#filterCategory");

/* Dashboard */
const totalEl = $("#totalTasks");
const completedEl = $("#completedTasks");
const pendingEl = $("#pendingTasks");
const progressPercent = $("#progressPercent");
const progressCircle = document.querySelector(".progress-ring__circle");

/* Calendar */
const calendarBody = document.querySelector("#calendarTable tbody");

/* Sticky Notes */
let stickies = JSON.parse(localStorage.getItem("stickies")) || [];
let projects = JSON.parse(localStorage.getItem("projects")) || [];

function safe(x) { return x || ""; }
function fmt(d) { return d ? new Date(d).toLocaleDateString() : "No due"; }

/* ===========================
   LOAD TASKS
=========================== */
async function fetchTasks() {
  try {
    const res = await fetch(API);
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function loadTasks() {
  const tasks = await fetchTasks();
  renderTasks(tasks);
  renderCalendar(tasks);
  updateDashboard(tasks);
}

/* ===========================
   ADD TASK  (FIXED)
=========================== */
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return alert("Enter a task title");

  // FIXED — collecting real values
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

/* ===========================
   RENDER TASKS  (RESTORED)
=========================== */
function renderTasks(tasks) {
  taskList.innerHTML = "";

  const q = searchInput.value.toLowerCase();
  const cat = filterCategory.value;

  tasks
    .filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q)) &&
        (!cat || t.category === cat)
    )
    .forEach((t) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <div class="task-left">
          <input type="checkbox" ${t.completed ? "checked" : ""} />
          <div>
            <div class="title">${safe(t.title)}</div>
            <small>${safe(t.category)} • ${safe(t.priority).toUpperCase()} • ${fmt(t.deadline)}</small>
          </div>
        </div>

        <div class="task-right">
          <span class="badge ${t.priority}">${t.priority.toUpperCase()}</span>
          <button class="btn edit">✏</button>
          <button class="btn danger del">🗑</button>
        </div>
      `;

      // COMPLETE
      li.querySelector("input").onclick = () => toggleComplete(t._id);

      // EDIT
      li.querySelector(".edit").onclick = () => editTaskPrompt(t._id, t.title);

      // DELETE
      li.querySelector(".del").onclick = () => deleteTask(t._id);

      taskList.appendChild(li);
    });
}

/* ===========================
   BACKEND ACTIONS
=========================== */

async function deleteTask(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  loadTasks();
}

async function toggleComplete(id) {
  await fetch(`${API}/complete/${id}`, { method: "PUT" });
  loadTasks();
}

async function editTaskPrompt(id, oldTitle) {
  const nt = prompt("Edit task:", oldTitle);
  if (!nt) return;
  await fetch(`${API}/edit/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: nt })
  });
  loadTasks();
}

/* ===========================
   CALENDAR
=========================== */
function renderCalendar(tasks) {
  calendarBody.innerHTML = "";
  tasks
    .filter((t) => t.deadline)
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.title}</td>
        <td>${fmt(t.deadline)}</td>
        <td>${t.category}</td>
      `;
      calendarBody.appendChild(tr);
    });
}

/* ===========================
   DASHBOARD
=========================== */
function updateDashboard(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const pend = total - done;

  totalEl.textContent = total;
  completedEl.textContent = done;
  pendingEl.textContent = pend;

  const pct = total ? Math.round((done / total) * 100) : 0;
  progressPercent.textContent = pct + "%";

  const offset = 226 - (226 * pct) / 100;
  progressCircle.style.strokeDashoffset = offset;
}

/* ===========================
   INIT
=========================== */
addTaskBtn.onclick = addTask;
searchInput.oninput = loadTasks;
filterCategory.onchange = loadTasks;

loadTasks();
