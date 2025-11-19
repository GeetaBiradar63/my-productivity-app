# My Productivity App

A simple full-stack productivity application with:

- ✔ Tasks (stored in MongoDB database)
- ✔ Notes (saved in browser LocalStorage)
- ✔ Projects (saved in browser LocalStorage)
- ✔ Pomodoro Timer
- ✔ Responsive UI

---

## 🚀 Features

### ✔ **Tasks (Full-Stack Feature)**
- Add Tasks  
- Delete Tasks  
- All tasks saved in MongoDB  
- Backend built with Node.js + Express + Mongoose  

### ✔ **Projects (Frontend Only)**
- Add/Delete Projects  
- Stored in LocalStorage  

### ✔ **Notes (Frontend Only)**
- Text area auto-saves notes  
- Stored in LocalStorage  

### ✔ **Pomodoro Timer**
- 25-minute countdown  
- Reset button  
- Alerts when time is up  

---

## 🏗️ Project Structure


⚠️ The `backend/.env` file is **NOT pushed** to GitHub because it contains private credentials.

---

## 🗄️ Database (MongoDB Atlas)

The backend connects to MongoDB Atlas using Mongoose.

Environment variable used:


This is added in Render during deployment, **not** inside the repository.

---

## ▶️ Run Project Locally

### 1️⃣ Start Backend


Backend runs on:http://localhost:5000

### 2️⃣ Start Frontend
Open:index.html

(or right-click → “Open with Live Server” in VS Code)

---

## 🌐 Deployment

### Backend:
- Deployed on Render as a Node.js Web Service  
- Environment variables added in Render Dashboard  

### Frontend:
- Deployed on Render as Static Site  
- API URL updated inside `script.js:`  
const API = "https://your-backend-url.onrender.com/tasks";


---

## 💡 Technologies Used
- **HTML, CSS, JavaScript**
- **Node.js + Express**
- **MongoDB Atlas**
- **Mongoose**
- **LocalStorage**
- **Render (Deployment)**

---

## 🙋‍♀️ Author
**Geeta Biradar**  
Full-stack project for academic submission.



