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

// ROUTES
app.get("/", (req, res) => {
  res.send("Backend Working");
});

// Get all tasks
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
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

// Edit task
app.put("/tasks/edit/:id", async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

// Mark completed
app.put("/tasks/complete/:id", async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { completed: true },
    { new: true }
  );
  res.json(task);
});

// Search task
app.get("/tasks/search/:query", async (req, res) => {
  const tasks = await Task.find({
    title: { $regex: req.params.query, $options: "i" },
  });
  res.json(tasks);
});

app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT)
);
