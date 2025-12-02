// Add new task
app.post("/tasks", async (req, res) => {
  const task = await Task.create({
    title: req.body.title,
    category: req.body.category || "General",
    priority: req.body.priority || "low",
    deadline: req.body.deadline || "",
    completed: false
  });

  res.json(task);
});
