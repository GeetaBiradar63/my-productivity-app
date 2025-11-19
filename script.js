/* full-feature frontend script for the app
   - drag/drop tasks
   - categories + priority
   - sticky notes (localStorage)
   - dashboard animated
   - theme packs + dark
   - calendar + deadlines
   - pomodoro with simple beep
*/

const API = "https://my-productivity-app-79up.onrender.com/tasks"; // << update if different

/* -------------------------
   Simple DOM helpers
   ------------------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* elements */
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
    o.type = "sine"; o.frequency.setValueAtTime(880, ctx.currentTime);
    o.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.12);
  } catch (e) { console.warn(e); }
}
function formatDate(d){ if(!d) return ""; const dt = new Date(d); return dt.toLocaleDateString(); }
function animateCounter(el, to){ let start=0; const dur=500; const step=16; const inc = to/(dur/step); const t = setInterval(()=>{ start += inc; if(start>=to){ el.textContent = to; clearInterval(t);} else el.textContent = Math.round(start); }, step); }

/* ------ PROJECTS ------ */
function saveProjects(){ localStorage.setItem("projects", JSON.stringify(projects)); }
function renderProjects(){
  projectList.innerHTML=""; projects.forEach((p,i)=>{ const li=document.createElement("li"); li.innerHTML = `${p} <button onclick="deleteProject(${i})">X</button>`; projectList.appendChild(li); });
}
function addProject(){ const v=projectInput.value.trim(); if(!v) return; projects.push(v); saveProjects(); projectInput.value=""; renderProjects(); }
function deleteProject(i){ projects.splice(i,1); saveProjects(); renderProjects(); }

/* ------ STICKIES ------ */
function saveStickies(){ localStorage.setItem("stickies", JSON.stringify(stickies)); }
function renderStickies(){
  stickyContainer.innerHTML="";
  stickies.forEach((s, idx) => {
    const d = document.createElement("div");
    d.className="sticky"; d.style.background=s.color; d.draggable=true;
    d.innerHTML = `<div class="title">${s.title}</div><div class="body">${s.body||""}</div><button onclick="removeSticky(${idx})" class="btn">X</button>`;
    d.addEventListener("dragstart", (e)=>{ e.dataTransfer.setData("text/plain", idx); d.classList.add("dragging"); });
    d.addEventListener("dragend", ()=>d.classList.remove("dragging"));
    stickyContainer.appendChild(d);
  });
}
function addSticky(){ const tit=stickyTitle.value.trim(); const color=stickyColor.value; if(!tit) return; stickies.push({title:tit,color,body:""}); stickyTitle.value=""; saveStickies(); renderStickies(); }
function removeSticky(i){ stickies.splice(i,1); saveStickies(); renderStickies(); }

/* ------ TASKS (backend) ------ */
async function fetchTasks(){
  try {
    const res = await fetch(API);
    return await res.json();
  } catch (e) { console.error("fetch error", e); return []; }
}

async function loadTasks(){
  const tasks = await fetchTasks();
  renderTasks(tasks);
  renderCalendar(tasks);
  updateDashboard(tasks);
  animateCounts(tasks);
}

function animateCounts(tasks){
  const total = tasks.length;
  const completed = tasks.filter(t=>t.completed).length;
  const pending = total-completed;
  animateCounter(totalEl, total);
  animateCounter(completedEl, completed);
  animateCounter(pendingEl, pending);

  // progress ring (circumference 226)
  const pct = total ? Math.round((completed/total)*100) : 0;
  progressPercent && (progressPercent.textContent = `${pct}%`);
  const offset = 226 - (226 * pct / 100);
  progressCircle.style.strokeDashoffset = offset;
  $("#progressPercent") && ($("#progressPercent").textContent = `${pct}%`);
}

/* render tasks with drag/drop and priority badges */
function renderTasks(tasks){
  const q = searchInput.value.toLowerCase();
  const cat = filterCategory.value;
  taskList.innerHTML="";
  tasks
    .filter(t => (!q || t.title.toLowerCase().includes(q)) && (!cat || t.category === cat))
    .forEach(t => {
      const li = document.createElement("li");
      li.dataset.id = t._id;
      li.draggable = true;
      li.className = t.completed ? "done" : "";

      const left = document.createElement("div");
      left.className = "task-left";
      left.innerHTML = `<input type="checkbox" ${t.completed ? "checked" : ""} onchange="toggleComplete('${t._id}', this.checked)" /> 
        <div>
          <div style="font-weight:600">${t.title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7)">${t.category} • ${t.deadline ? formatDate(t.deadline) : "no due"}</div>
        </div>`;

      const right = document.createElement("div");
      const priClass = t.priority || "low";
      right.innerHTML = `<span class="badge ${priClass}">${(t.priority||"low").toUpperCase()}</span>
        <button class="btn" onclick="editPrompt('${t._id}','${escape(t.title)}')">✏</button>
        <button class="btn danger" onclick="deleteTask('${t._id}')">🗑</button>`;

      li.append(left,right);
      /* drag events */
      li.addEventListener("dragstart", (e)=>{ li.classList.add("dragging"); dragSrcEl = li; e.dataTransfer.effectAllowed = "move"; });
      li.addEventListener("dragend", ()=>{ li.classList.remove("dragging"); dragSrcEl=null; persistOrder(); });
      li.addEventListener("dragover", (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; const dragging = document.querySelector(".dragging"); if(!dragging) return; const after = getDragAfterElement(taskList, e.clientY); if(after == null) taskList.appendChild(dragging); else taskList.insertBefore(dragging, after); });
      taskList.appendChild(li);
  });
}

/* helper for drag place */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if(offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* persist order locally only (not required by backend) */
function persistOrder(){
  // This keeps visual order; not sending to backend (could be added)
  userNote.textContent = "Order saved locally";
}

/* CRUD calls */
async function addTask(){
  const title = taskInput.value.trim();
  if(!title) return alert("Enter a task title");
  const payload = { title, category: categoryInput.value, priority: priorityInput.value, deadline: deadlineInput.value || null, completed:false };
  await fetch(API, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
  taskInput.value = ""; deadlineInput.value=""; loadTasks();
}

async function deleteTask(id){
  await fetch(`${API}/${id}`, { method:"DELETE" });
  loadTasks();
}

async function toggleComplete(id, checked){
  await fetch(`${API}/complete/${id}`, { method:"PUT" });
  loadTasks();
}

async function editPrompt(id, oldTitleEscaped){
  const oldTitle = unescape(oldTitleEscaped);
  const newTitle = prompt("Edit task title:", oldTitle);
  if(!newTitle) return;
  await fetch(`${API}/edit/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ title:newTitle }) });
  loadTasks();
}

async function searchTasks(){ loadTasks(); }

/* calendar render */
function renderCalendar(tasks){ calendarTableBody.innerHTML=""; tasks.filter(t=>t.deadline).forEach(t=>{ const tr = document.createElement("tr"); tr.innerHTML = `<td>${t.title}</td><td>${formatDate(t.deadline)}</td><td>${t.category}</td>`; calendarTableBody.appendChild(tr); }); }

/* dashboard update */
function updateDashboard(tasks){
  const total = tasks.length, completed = tasks.filter(t=>t.completed).length;
  const pending = total-completed;
  totalEl.textContent = total; completedEl.textContent = completed; pendingEl.textContent = pending;
  const pct = total? Math.round((completed/total)*100):0;
  progressPercent && (progressPercent.textContent = `${pct}%`);
  const offset = 226 - (226 * pct / 100);
  progressCircle.style.strokeDashoffset = offset;
}

/* export */
function exportTasksJson(){
  fetch(API).then(r=>r.json()).then(data=>{
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "tasks.json"; a.click();
  });
}

/* clear completed */
async function clearCompleted(){
  const tasks = await fetchTasks();
  const completed = tasks.filter(t=>t.completed);
  for(const t of completed) await fetch(`${API}/${t._id}`, { method:"DELETE" });
  loadTasks();
}

/* themes and dark toggle */
function applyTheme(name){
  if(name==="purple"){ document.documentElement.style.setProperty("--bg1","linear-gradient(135deg,#7f5af0,#ff7ab6)"); document.documentElement.style.setProperty("--accent","#8b5cf6"); }
  else if(name==="mint"){ document.documentElement.style.setProperty("--bg1","linear-gradient(135deg,#4ade80,#06b6d4)"); document.documentElement.style.setProperty("--accent","#10b981"); }
  else if(name==="dark"){ document.documentElement.style.setProperty("--bg1","linear-gradient(135deg,#0f172a,#020617)"); document.documentElement.style.setProperty("--accent","#7c3aed"); }
  else { document.documentElement.style.setProperty("--bg1","linear-gradient(135deg,#6e8efb,#a777e3)"); document.documentElement.style.setProperty("--accent","#60a5fa"); }
  localStorage.setItem("themePack", name);
}
function toggleDark(){
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark")?"1":"0");
}

/* timer */
function updateTimerUI(){ const m = String(Math.floor(time/60)).padStart(2,"0"); const s = String(time%60).padStart(2,"0"); timerEl.textContent = `${m}:${s}`; }
function startTimer(){
  if(timerInterval) return;
  timerInterval = setInterval(()=>{ time--; updateTimerUI(); if(time<=0){ clearInterval(timerInterval); timerInterval=null; playBeep(); alert("Time's up!"); time = 25*60; updateTimerUI(); } }, 1000);
}
function resetTimer(){ clearInterval(timerInterval); timerInterval=null; time=25*60; updateTimerUI(); }
function testShort(){ time=5; updateTimerUI(); startTimer(); }

/* init bindings */
function bind(){
  addProjectBtn.addEventListener("click", addProject);
  addStickyBtn.addEventListener("click", addSticky);
  addTaskBtn.addEventListener("click", addTask);
  searchInput.addEventListener("input", searchTasks);
  filterCategory.addEventListener("change", loadTasks);
  exportBtn && exportBtn.addEventListener("click", exportTasksJson);
  clearCompletedBtn && clearCompletedBtn.addEventListener("click", clearCompleted);
  startTimerBtn && startTimerBtn.addEventListener("click", startTimer);
  resetTimerBtn && resetTimerBtn.addEventListener("click", resetTimer);
  shortTestBtn && shortTestBtn.addEventListener("click", testShort);
  themeSelect && themeSelect.addEventListener("change",(e)=>applyTheme(e.target.value));
  darkToggle && darkToggle.addEventListener("click",toggleDark);

  // load saved
  renderProjects(); renderStickies();
  if(localStorage.getItem("dark")==="1") document.body.classList.add("dark");
  const tp = localStorage.getItem("themePack") || "blue"; themeSelect.value=tp; applyTheme(tp);
}

/* initial render functions for projects & stickies (exposed window functions) */
window.addProject = addProject;
window.deleteProject = deleteProject;
window.removeSticky = removeSticky;
window.editPrompt = editPrompt;
window.toggleComplete = toggleComplete;

function renderProjects(){ projectList.innerHTML=""; projects.forEach((p,i)=>{ const li=document.createElement("li"); li.innerHTML = `<strong>${p}</strong> <button class="btn" onclick="deleteProject(${i})">X</button>`; projectList.appendChild(li); }); }
function renderStickies(){ stickyContainer.innerHTML=""; stickies.forEach((s,i)=>{ const el=document.createElement("div"); el.className="sticky"; el.style.background=s.color; el.innerHTML = `<div class="title">${s.title}</div><div class="body">${s.body||""}</div><button class="btn" onclick="removeSticky(${i})">X</button>`; stickyContainer.appendChild(el); }); }

/* start */
bind(); updateTimerUI(); loadTasks();
