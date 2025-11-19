// ======================
// BACKEND TASK API SETUP
// ======================
 // local backend
const API = "http://localhost:5000/tasks";

// HTML elements
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");


// =====================
// LOAD TASKS FROM BACKEND
// =====================
async function loadTasks() {
    try {
        const res = await fetch(API);
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (err) {
        console.error(err);
        taskList.innerHTML = "<li style='color:red'>Backend not running</li>";
    }
}

// =====================
// RENDER TASKS
// =====================
function renderTasks(tasks) {
    taskList.innerHTML = "";

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = "<li>No tasks yet</li>";
        return;
    }

    tasks.forEach(t => {
        const li = document.createElement("li");

        // task title
        const span = document.createElement("span");
        span.textContent = t.title;

        // delete button
        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.onclick = () => deleteTask(t._id);

        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";

        li.append(span, delBtn);
        taskList.appendChild(li);
    });
}

// =====================
// ADD A TASK (POST)
// =====================
async function addTask() {
    const title = taskInput.value.trim();
    if (!title) return alert("Enter a task");

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, completed: false })
    });

    taskInput.value = "";
    loadTasks();
}

// =====================
// DELETE A TASK (DELETE)
// =====================
async function deleteTask(id) {
    await fetch(`${API}/${id}`, {
        method: "DELETE"
    });
    loadTasks();
}


// ============================
// PROJECTS — LOCAL STORAGE ONLY
// ============================
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
// INITIAL PAGE LOAD
// =====================
renderProjects();
updateTimer();
loadTasks();
