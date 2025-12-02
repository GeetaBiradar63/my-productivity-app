import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: String,
  completed: { type: Boolean, default: false },
  category: { type: String, default: "General" },
  deadline: { type: Date, default: null }
});

export default mongoose.model("Task", taskSchema);
