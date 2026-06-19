import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "my-plan-tasks-v1";
const FILTERS = ["All", "Completed", "Pending"];

function createTask(text) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatTime(date) {
  return date.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(date) {
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [activeEdit, setActiveEdit] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("my-plan-theme") || "dark",
  );
  const [clock, setClock] = useState(new Date());
  const inputRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("my-plan-theme", theme);
  }, [theme]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter === "Completed") return task.completed;
        if (filter === "Pending") return !task.completed;
        return true;
      })
      .filter((task) => task.text.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, filter, search]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  const notify = (message) => setToast(message);

  const handleAdd = () => {
    const value = text.trim();
    if (!value) {
      notify("الرجاء كتابة مهمة قبل الإضافة");
      return;
    }
    setTasks((prev) => [createTask(value), ...prev]);
    setText("");
    setActiveEdit(null);
    notify("تمت إضافة المهمة بنجاح");
    inputRef.current?.focus();
  };

  const handleDelete = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    notify("تم حذف المهمة");
  };

  const handleToggle = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const handleEdit = (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    setActiveEdit(id);
    setText(task.text);
    inputRef.current?.focus();
  };

  const handleSaveEdit = () => {
    if (!activeEdit) return handleAdd();
    const value = text.trim();
    if (!value) {
      notify("لا يمكن حفظ مهمة فارغة");
      return;
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.id === activeEdit ? { ...task, text: value } : task,
      ),
    );
    setActiveEdit(null);
    setText("");
    notify("تم تحديث المهمة");
    inputRef.current?.focus();
  };

  const handleClearAll = () => {
    if (!tasks.length) return notify("لا توجد مهام للحذف");
    setTasks([]);
    setActiveEdit(null);
    setText("");
    notify("تم مسح جميع المهام");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    activeEdit ? handleSaveEdit() : handleAdd();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>My Plan</h1>
          <p className="subtitle">تطبيق تخطيط المهام</p>
        </div>
        <div className="topbar-actions">
          <button
            className="theme-btn"
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            aria-label="Toggle light/dark mode"
          >
            <i
              className={
                theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"
              }
            ></i>
            {theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          </button>
          <div className="clock-card">
            <p>{formatDate(clock)}</p>
            <strong>{formatTime(clock)}</strong>
          </div>
        </div>
      </header>

      <main>
        <section className="task-panel card">
          <div className="panel-header">
            <div>
              <h2>قائمة المهام</h2>
              <p>تابع مهامك، عدلها، أو اكتب مهمة جديدة بسهولة.</p>
            </div>
            <button
              className="ghost-btn"
              type="button"
              onClick={handleClearAll}
            >
              <i className="fa-solid fa-trash"></i> مسح الكل
            </button>
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <label className="input-group">
              <input
                ref={inputRef}
                dir="rtl"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب مهمة جديدة..."
                aria-label="إضافة مهمة جديدة"
              />
              <button className="btn-primary" type="submit">
                <i className="fa-solid fa-plus"></i>{" "}
                {activeEdit ? "حفظ التعديل" : "إضافة"}
              </button>
            </label>
          </form>

          <div className="task-controls">
            <div className="filter-group">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  className={
                    filter === item ? "filter-btn active" : "filter-btn"
                  }
                  type="button"
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="search-box">
              {/* <i className="fa-solid fa-magnifying-glass"></i> */}
              <input
                dir="rtl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن مهمة"
                aria-label="بحث عن مهمة"
              />
            </div>
          </div>

          <div className="status-row">
            <span>
              <strong>{tasks.length}</strong> إجمالي
            </span>
            <span>
              <strong>{completedCount}</strong> مكتملة
            </span>
            <span>
              <strong>{pendingCount}</strong> قيد الانتظار
            </span>
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <i className="fa-regular fa-face-smile-beam"></i>
                <p>لا توجد مهام هنا الآن.</p>
                <small>أضف أول مهمة لديك وابدأ بالتخطيط.</small>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className={`task-item ${task.completed ? "completed" : ""}`}
                >
                  <button
                    className="task-check"
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    aria-label={
                      task.completed
                        ? `إلغاء اكتمال المهمة: ${task.text}`
                        : `وضع المهمة كمكتملة: ${task.text}`
                    }
                  >
                    <i
                      className={
                        task.completed
                          ? "fa-solid fa-check"
                          : "fa-regular fa-circle"
                      }
                    ></i>
                  </button>
                  <div className="task-content">
                    <p>{task.text}</p>
                    <small>
                      {new Date(task.createdAt).toLocaleString("ar-EG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <div className="task-actions">
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => handleEdit(task.id)}
                      aria-label={`تعديل المهمة: ${task.text}`}
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button
                      className="icon-btn delete"
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      aria-label={`حذف المهمة: ${task.text}`}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {toast && (
        <div className="toast" role="status">
          <i className="fa-solid fa-bell"></i> {toast}
        </div>
      )}
    </div>
  );
}
