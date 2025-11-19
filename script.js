// ======================
// BACKEND TASK API SETUP
// ======================

// Use Render backend URL
const API = "https://my-productivity-app-79up.onrender.com/tasks";

// HTML elements
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const deadlineInput = document.getElementById("deadlineInput");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");


// =====================
// LOAD TASKS
// =====================
async function loadTasks() {
    const res = await fetch(API);
    const tasks = await res.json();
    renderTasks(tasks);
}


// =====================
// RENDER TASKS
// =====================
function renderTasks(tasks) {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.innerHTML = "<li>No tasks found</li>";
        return;
    }

    tasks.forEach((t) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span style="${t.completed ? "text-decoration: line-through;" : ""}">
                ${t.title} 
                <small>[${t.category}]</small>
                <small>${t.deadline ? new Date(t.deadline).toLocaleDateString() : ""}</small>
            </span>

            <div class="task-buttons">
                <button onclick="completeTask('${t._id}')">✔</button>
                <button onclick="editTaskPrompt('${t._id}', '${t.title}')">✏</button>
                <button onclick="deleteTask('${t._id}')">X</button>
            </div>
        `;

        taskList.appendChild(li);
    });
}


// =====================
// ADD TASK
// =====================
async function addTask() {
    const title = taskInput.value.trim();
    const category = categoryInput.value;
    const deadline = deadlineInput.value;

    if (!title) return alert("Enter a task");

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, deadline, completed: false }),
    });

    taskInput.value = "";
    deadlineInput.value = "";
    loadTasks();
}


// =====================
// MARK COMPLETE
// =====================
async function completeTask(id) {
    await fetch(`${API}/complete/${id}`, { method: "PUT" });
    loadTasks();
}


// =====================
// EDIT TASK
// =====================
async function editTaskPrompt(id, oldTitle) {
    const newTitle = prompt("Edit task:", oldTitle);
    if (!newTitle) return;

    await fetch(`${API}/edit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
    });

    loadTasks();
}


// =====================
// DELETE TASK
// =====================
async function deleteTask(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadTasks();
}


// =====================
// SEARCH TASKS
// =====================
async function searchTasks() {
    const q = searchInput.value;

    if (!q.trim()) return loadTasks();

    const res = await fetch(`${API}/search/${q}`);
    const tasks = await res.json();
    renderTasks(tasks);
}


// =====================
// PROJECTS — LOCAL STORAGE
// =====================
let projects = JSON.parse(localStorage.getItem("projects")) || [];

function addProject() {
    let project = document.getElementById("projectInput").value;
    if (!project.trim()) return;

    projects.push(project);
    localStorage.setItem("projects", JSON.stringify(projects));
    document.getElementById("projectInput").value = "";
    renderProjects();
}

function renderProjects() {
    const list = document.getElementById("projectList");
    list.innerHTML = "";

    projects.forEach((p, i) => {
        list.innerHTML += `
            <li>${p} <button onclick="deleteProject(${i})">X</button></li>
        `;
    });
}

function deleteProject(i) {
    projects.splice(i, 1);
    localStorage.setItem("projects", JSON.stringify(projects));
    renderProjects();
}


// =====================
// NOTES — LOCAL STORAGE
// =====================
document.getElementById("notes").value =
    localStorage.getItem("notes") || "";

function saveNotes() {
    localStorage.setItem("notes", document.getElementById("notes").value);
}


// =====================
// POMODORO TIMER
// =====================
let time = 25 * 60;
let timerInterval = null;

function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        time--;
        updateTimer();

        if (time <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            alert("Time's up!");
            time = 25 * 60;
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    time = 25 * 60;
    updateTimer();
}

function updateTimer() {
    let minutes = String(Math.floor(time / 60)).padStart(2, "0");
    let seconds = String(time % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}


// =====================
// INITIAL LOAD
// =====================
renderProjects();
updateTimer();
loadTasks();
