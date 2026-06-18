import { useEffect, useState } from "react";
import { getTaskLists, getTasks, parseTasksFromXML, createTask, completeTask } from "./lib/caldav";import "./App.css";

interface Task {
  uid: string;
  summary: string;
  status: string;
  percentComplete: string;
  priority: string;
  due: string;
  created: string;
  icsData: string;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    getTaskLists().then((lists) => {
      const url = lists[0].url;
      setCalendarUrl(url);
      getTasks(url).then((xml) => {
        const parsed = parseTasksFromXML(xml);
        const incomplete = parsed
          .filter((t) => t.status !== "COMPLETED" && t.percentComplete !== "100")
          .reverse();
        setTasks(incomplete);
      });
    });
  }, []);

  const handleAddTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTask.trim()) {
      const created = await createTask(calendarUrl, newTask.trim());
      setTasks((prev) => [...prev, created]);
      setNewTask("");
      setAdding(false);
    }
    if (e.key === "Escape") {
      setNewTask("");
      setAdding(false);
    }
  };

  const handleComplete = async (uid: string) => {
    const task = tasks.find((t) => t.uid === uid);
    if (!task) return;
    await completeTask(calendarUrl, task);
    setTasks((prev) => prev.filter((t) => t.uid !== uid));
  };

  return (
    <div className="app">
      <div className="header">
        <h1>General Tasks</h1>
        <button className="add-btn" onClick={() => setAdding(true)}>+</button>
      </div>
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.uid} className="task-row">
            <button className="checkbox" onClick={() => handleComplete(task.uid)} />
            <span className="task-summary">{task.summary}</span>
          </div>
        ))}
        {adding && (
          <div className="task-row">
            <button className="checkbox disabled" />
            <input
              className="task-input"
              autoFocus
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={handleAddTask}
              placeholder="Task name..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;