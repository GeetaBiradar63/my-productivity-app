// Load saved data
let projects = JSON.parse(localStorage.getItem("projects")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
document.getElementById("notes").value = localStorage.getItem("notes") || "";

// ---------- PROJECTS ----------
function addProject() {
    let project = document.getElementById("projectInput").value;
    if (project.trim() === "") return;
    projects.push(project);
    localStorage.setItem("projects", JSON.stringify(projects));
    document.getElementById("projectInput").value = "";
    renderProjects();
}

function renderProjects() {
    let list = document.getElementById("projectList");
    list.innerHTML = "";
    projects.forEach((p, i) => {
        list.innerHTML += `
            <li>${p}
                <button onclick="deleteProject(${i})">X</button>
            </li>`;
    });
}

function deleteProject(i) {
    projects.splice(i, 1);
    localStorage.setItem("projects", JSON.stringify(projects));
    renderProjects();
}


// ---------- TASKS ----------
function addTask() {
    let task = document.getElementById("taskInput").value;
    if (task.trim() === "") return;
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    document.getElementById("taskInput").value = "";
    renderTasks();
}

function renderTasks() {
    let list = document.getElementById("taskList");
    list.innerHTML = "";
    tasks.forEach((t, i) => {
        list.innerHTML += `
            <li>${t}
                <button onclick="deleteTask(${i})">X</button>
            </li>`;
    });
}

function deleteTask(i) {
    tasks.splice(i, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
}


// ---------- NOTES ----------
function saveNotes() {
    let text = document.getElementById("notes").value;
    localStorage.setItem("notes", text);
}


// ---------- POMODORO TIMER ----------
let time = 25 * 60;
let timerInterval;

function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        time--;
        updateTimer();

        if (time <= 0) {
            clearInterval(timerInterval);
            alert("Time's up!");
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
    document.getElementById("timer").innerText = `${minutes}:${seconds}`;
}

// Initial renders
renderProjects();
renderTasks();
updateTimer();
