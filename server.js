import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Task from "./models/task.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// CONNECT TO MONGODB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Error:", err));


// ==========================
// ROUTES
// ==========================

// Health check
app.get("/", (req, res) => {
  res.send("Backend Working");
});

// Get all tasks
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find().sort({ _id: 1 });
  res.json(tasks);
});

// Add task
app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

// Delete task
app.delete("/tasks/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Edit title only
app.put("/tasks/edit/:id", async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { title: req.body.title },
    { new: true }
  );
  res.json(task);
});

// Toggle complete
app.put("/tasks/complete/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  task.completed = !task.completed;
  await task.save();
  res.json(task);
});

// Search tasks
app.get("/tasks/search/:query", async (req, res) => {
  const tasks = await Task.find({
    title: { $regex: req.params.query, $options: "i" },
  });
  res.json(tasks);
});

app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port " + (process.env.PORT || 5000))
);
