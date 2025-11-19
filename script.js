/* SIMPLE WORKING VERSION — tasks add, show, delete, complete
   Does NOT save category/priority/deadline
   This is the stable version you had earlier.
*/

const API = "https://my-productivity-app-79up.onrender.com/tasks";

const $ = (s) => document.querySelector(s);

// Elements
const taskInput = $("#taskInput");
const addTaskBtn = $("#addTaskBtn");
const taskList = $("#taskList");
const searchInput = $("#searchInput");

// Dashboard elements
const totalEl = $("#totalTasks");
const completedEl = $("#completedTasks");
const pendingEl = $("#pendingTasks");

// Pomodoro
const timerEl = $("#timer");
let time = 25 * 60;
let timer = null;

// Fetch all tasks
async function fetchTasks() {
  try {
    const res = await fetch(API);
    return await res.json();
  } catch (err) {
    console.log("Fetch error:", err);
    return [];
  }
}

// Load & render tasks
async function loadTasks() {
  const tasks = await fetchTasks();
  renderTasks(tasks);
  updateDashboard(tasks);
}

// Add task
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return alert("Enter a task title");

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, completed: false })
  });

  taskInput.value = "";
  loadTasks();
}

// Delete task
async function deleteTask(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  loadTasks();
}

// Toggle complete
async function toggleComplete(id, checked) {
  await fetch(`${API}/complete/${id}`, { method: "PUT" });
  loadTasks();
}

// Render tasks on screen
function renderTasks(tasks) {
  const q = searchInput.value.toLowerCase();
  taskList.innerHTML = "";

  tasks
    .filter(t => t.title.toLowerCase().includes(q))
    .forEach(t => {
      const li = document.createElement("li");
      li.className = "task-item";

      li.innerHTML = `
        <div class="task-left">
          <input type="checkbox" ${t.completed ? "checked" : ""}>
          <div>
            <div class="title">${t.title}</div>
            <small>General • No due</small>
          </div>
        </div>

        <div class="task-right">
          <span class="badge low">LOW</span>
          <button class="btn edit-btn">✏</button>
          <button class="btn danger del-btn">🗑</button>
        </div>
      `;

      // checkbox logic
      li.querySelector("input").addEventListener("change", (e) => {
        toggleComplete(t._id, e.target.checked);
      });

      // delete button
      li.querySelector(".del-btn").addEventListener("click", () => {
        deleteTask(t._id);
      });

      // edit button (simple prompt)
      li.querySelector(".edit-btn").addEventListener("click", async () => {
        const nt = prompt("Edit task:", t.title);
        if (!nt) return;

        await fetch(`${API}/edit/${t._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nt })
        });

        loadTasks();
      });

      taskList.appendChild(li);
    });
}

// Dashboard stats
function updateDashboard(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  totalEl.textContent = total;
  completedEl.textContent = completed;
  pendingEl.textContent = pending;
}

// Search
searchInput.addEventListener("input", loadTasks);

// Add Task Btn
addTaskBtn.addEventListener("click", addTask);

// Pomodoro Timer
function updateTimerUI() {
  const m = String(Math.floor(time / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

updateTimerUI();
loadTasks();
