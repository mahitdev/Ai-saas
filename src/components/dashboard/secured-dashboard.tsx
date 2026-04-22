"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  FolderKanban,
  GripVertical,
  LayoutGrid,
  List,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  totalTasks: number;
};

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type Task = {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  starred: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiError = {
  error?: string;
};

type ActivityItem = {
  id: string;
  text: string;
  at: string;
};

async function parseApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiError | null;
  return payload?.error ?? "Request failed";
}

function statusBadgeVariant(status: TaskStatus): "default" | "secondary" | "outline" {
  if (status === "done") {
    return "default";
  }
  if (status === "in_progress") {
    return "secondary";
  }
  return "outline";
}

function statusLabel(status: TaskStatus) {
  if (status === "in_progress") {
    return "In Progress";
  }
  if (status === "done") {
    return "Done";
  }
  return "To Do";
}

function priorityColor(priority: TaskPriority) {
  if (priority === "urgent") return "destructive" as const;
  if (priority === "high") return "default" as const;
  if (priority === "medium") return "secondary" as const;
  return "outline" as const;
}

export function SecuredDashboard({ user }: { user: User }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [search, setSearch] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [taskDueFilter, setTaskDueFilter] = useState<"all" | "overdue" | "today" | "upcoming" | "no_due">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"updated" | "due" | "title">("updated");
  const [editingProjectOpen, setEditingProjectOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [savingProjectEdit, setSavingProjectEdit] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>("medium");
  const [savingTaskEdit, setSavingTaskEdit] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user.name],
  );

  const doneTasks = useMemo(
    () => tasks.filter((task) => task.status === "done").length,
    [tasks],
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((task) => task.status === "in_progress").length,
    [tasks],
  );
  const todoTasks = useMemo(
    () => tasks.filter((task) => task.status === "todo").length,
    [tasks],
  );
  const completion = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bySearch = tasks.filter((task) => {
      const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
      if (!normalizedSearch) {
        return true;
      }
      return haystack.includes(normalizedSearch);
    });

    const byDue = bySearch.filter((task) => {
      if (taskDueFilter === "all") {
        return true;
      }
      if (!task.dueDate) {
        return taskDueFilter === "no_due";
      }
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      if (taskDueFilter === "overdue") {
        return due < today;
      }
      if (taskDueFilter === "today") {
        return due.getTime() === today.getTime();
      }
      if (taskDueFilter === "upcoming") {
        return due > today;
      }
      return true;
    });

    const byPriority = byDue.filter((task) => (priorityFilter === "all" ? true : task.priority === priorityFilter));
    const byStar = byPriority.filter((task) => (starredOnly ? task.starred : true));

    return [...byStar].sort((a, b) => {
      if (sortMode === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortMode === "due") {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tasks, search, sortMode, taskDueFilter, priorityFilter, starredOnly]);

  const todoFiltered = filteredTasks.filter((task) => task.status === "todo");
  const inProgressFiltered = filteredTasks.filter((task) => task.status === "in_progress");
  const doneFiltered = filteredTasks.filter((task) => task.status === "done");

  async function fetchProjects(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoadingProjects(true);
    }
    setSyncing(true);
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { projects: Project[] };
      setProjects(payload.projects);
      setActiveProjectId((current) => current ?? payload.projects[0]?.id ?? null);
      setLastSyncedAt(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load projects";
      if (!options?.silent) {
        toast.error(message);
      }
    } finally {
      if (!options?.silent) {
        setLoadingProjects(false);
      }
      setSyncing(false);
    }
  }

  async function fetchTasks(projectId: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoadingTasks(true);
    }
    setSyncing(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { tasks: Task[] };
      setTasks(payload.tasks);
      setLastSyncedAt(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load tasks";
      if (!options?.silent) {
        toast.error(message);
      }
    } finally {
      if (!options?.silent) {
        setLoadingTasks(false);
      }
      setSyncing(false);
    }
  }

  function addActivity(text: string) {
    setActivities((previous) => [
      { id: crypto.randomUUID(), text, at: new Date().toISOString() },
      ...previous,
    ].slice(0, 12));
  }

  async function createTaskFromTemplate(input: {
    title: string;
    description: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  }) {
    if (!activeProjectId) {
      return;
    }
    const response = await fetch(`/api/projects/${activeProjectId}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        status: input.status ?? "todo",
        priority: input.priority ?? "medium",
      }),
    });
    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }
    const payload = (await response.json()) as { task: Task };
    setTasks((previous) => [payload.task, ...previous]);
  }

  async function runAssistantPack(mode: "launch" | "growth" | "bugfix") {
    if (!activeProjectId) {
      return;
    }
    setCreatingTask(true);
    try {
      if (mode === "launch") {
        await createTaskFromTemplate({
          title: "Finalize launch checklist",
          description: "Review feature scope, QA list, and release blockers.",
          priority: "high",
        });
        await createTaskFromTemplate({
          title: "Publish release announcement",
          description: "Prepare post for social + changelog + email.",
          status: "in_progress",
          priority: "medium",
        });
      }
      if (mode === "growth") {
        await createTaskFromTemplate({
          title: "Analyze activation funnel",
          description: "Find top drop-off steps and propose experiments.",
          priority: "high",
        });
        await createTaskFromTemplate({
          title: "Plan retention campaign",
          description: "Design a 7-day engagement sequence.",
          priority: "medium",
        });
      }
      if (mode === "bugfix") {
        await createTaskFromTemplate({
          title: "Triage high-priority bugs",
          description: "Group by severity and assign owners.",
          priority: "urgent",
        });
        await createTaskFromTemplate({
          title: "Run regression checks",
          description: "Verify critical paths after fixes are merged.",
          status: "in_progress",
          priority: "high",
        });
      }
      addActivity(`Assistant pack applied: ${mode}`);
      toast.success("Assistant tasks added");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to apply assistant pack";
      toast.error(message);
    } finally {
      setCreatingTask(false);
    }
  }

  async function refreshActiveData() {
    await fetchProjects({ silent: false });
    if (activeProjectId) {
      await fetchTasks(activeProjectId, { silent: false });
    }
  }

  useEffect(() => {
    void fetchProjects();
  }, []);

  useEffect(() => {
    if (!activeProjectId) {
      setTasks([]);
      return;
    }
    void fetchTasks(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }
    const timer = setInterval(() => {
      void fetchProjects({ silent: true });
      void fetchTasks(activeProjectId, { silent: true });
    }, 15_000);
    return () => clearInterval(timer);
  }, [activeProjectId]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectName.trim()) {
      return;
    }
    setCreatingProject(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { project: Project };
      setProjects((previous) => [payload.project, ...previous]);
      setActiveProjectId(payload.project.id);
      setProjectName("");
      setProjectDescription("");
      addActivity(`Project created: ${payload.project.name}`);
      toast.success("Project created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create project";
      toast.error(message);
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleDeleteProject() {
    if (!activeProject) {
      return;
    }
    setDeletingProject(true);
    try {
      const response = await fetch(`/api/projects/${activeProject.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const remainingProjects = projects.filter((project) => project.id !== activeProject.id);
      setProjects(remainingProjects);
      setActiveProjectId((current) =>
        current === activeProject.id ? (remainingProjects[0]?.id ?? null) : current,
      );
      setTasks([]);
      addActivity(`Project deleted: ${activeProject.name}`);
      toast.success("Project deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete project";
      toast.error(message);
    } finally {
      setDeletingProject(false);
    }
  }

  function openProjectEditor() {
    if (!activeProject) {
      return;
    }
    setEditProjectName(activeProject.name);
    setEditProjectDescription(activeProject.description ?? "");
    setEditingProjectOpen(true);
  }

  async function handleSaveProjectEdit() {
    if (!activeProject || !editProjectName.trim()) {
      return;
    }
    setSavingProjectEdit(true);
    try {
      const response = await fetch(`/api/projects/${activeProject.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: editProjectName.trim(),
          description: editProjectDescription.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { project: Project };
      setProjects((previous) =>
        previous.map((project) =>
          project.id === payload.project.id
            ? { ...project, name: payload.project.name, description: payload.project.description }
            : project,
        ),
      );
      addActivity(`Project updated: ${payload.project.name}`);
      setEditingProjectOpen(false);
      toast.success("Project updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update project";
      toast.error(message);
    } finally {
      setSavingProjectEdit(false);
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProjectId || !taskTitle.trim()) {
      return;
    }
    setCreatingTask(true);
    try {
      const response = await fetch(`/api/projects/${activeProjectId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          status: "todo",
          priority: taskPriority,
          dueDate: taskDueDate
            ? new Date(`${taskDueDate}T00:00:00`).toISOString()
            : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { task: Task };
      setTasks((previous) => [payload.task, ...previous]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskPriority("medium");
      setProjects((previous) =>
        previous.map((project) =>
          project.id === activeProjectId
            ? { ...project, totalTasks: project.totalTasks + 1 }
            : project,
        ),
      );
      addActivity(`Task created: ${payload.task.title}`);
      toast.success("Task added");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create task";
      toast.error(message);
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleQuickCreate() {
    if (!quickPrompt.trim() || !activeProjectId) {
      return;
    }
    const [titleRaw, statusRaw, dueRaw] = quickPrompt.split("|").map((part) => part.trim());
    const title = titleRaw || quickPrompt.trim();
    const status: TaskStatus =
      statusRaw === "done" || statusRaw === "in_progress" || statusRaw === "todo"
        ? statusRaw
        : "todo";
    const dueDate = dueRaw ? new Date(`${dueRaw}T00:00:00`) : null;
    setCreatingTask(true);
    try {
      const response = await fetch(`/api/projects/${activeProjectId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          description: "Created from quick capture",
          status,
          priority: "medium",
          dueDate: dueDate ? dueDate.toISOString() : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { task: Task };
      setTasks((previous) => [payload.task, ...previous]);
      setQuickPrompt("");
      addActivity(`Quick task captured: ${payload.task.title}`);
      toast.success("Quick task captured");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create quick task";
      toast.error(message);
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleUpdateTaskStatus(taskId: string, status: TaskStatus) {
    setUpdatingTaskId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { task: Task };
      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? payload.task : task)),
      );
      addActivity(`Task moved to ${statusLabel(status)}: ${payload.task.title}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task";
      toast.error(message);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  function openTaskEditor(task: Task) {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description ?? "");
    setEditTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setEditTaskPriority(task.priority);
  }

  async function handleSaveTaskEdit() {
    if (!editingTask || !editTaskTitle.trim()) {
      return;
    }
    setSavingTaskEdit(true);
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: editTaskTitle.trim(),
          description: editTaskDescription.trim(),
          priority: editTaskPriority,
          dueDate: editTaskDueDate ? new Date(`${editTaskDueDate}T00:00:00`).toISOString() : "",
        }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { task: Task };
      setTasks((previous) => previous.map((task) => (task.id === payload.task.id ? payload.task : task)));
      addActivity(`Task updated: ${payload.task.title}`);
      setEditingTask(null);
      toast.success("Task updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task";
      toast.error(message);
    } finally {
      setSavingTaskEdit(false);
    }
  }

  async function handleDuplicateTask(task: Task) {
    if (!activeProjectId) {
      return;
    }
    setCreatingTask(true);
    try {
      const response = await fetch(`/api/projects/${activeProjectId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${task.title} (Copy)`,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          starred: false,
          dueDate: task.dueDate || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { task: Task };
      setTasks((previous) => [payload.task, ...previous]);
      addActivity(`Task duplicated: ${task.title}`);
      toast.success("Task duplicated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to duplicate task";
      toast.error(message);
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleToggleStar(task: Task) {
    setUpdatingTaskId(task.id);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ starred: !task.starred }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { task: Task };
      setTasks((previous) =>
        previous.map((item) => (item.id === task.id ? payload.task : item)),
      );
      addActivity(`${payload.task.starred ? "Favorited" : "Unfavorited"}: ${payload.task.title}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update favorite";
      toast.error(message);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleMarkFilteredDone() {
    const pending = filteredTasks.filter((task) => task.status !== "done");
    if (pending.length === 0) {
      toast.message("No pending tasks in current filter");
      return;
    }
    setSyncing(true);
    try {
      await Promise.all(
        pending.map((task) =>
          fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "done" }),
          }),
        ),
      );
      setTasks((previous) =>
        previous.map((task) =>
          pending.some((pendingTask) => pendingTask.id === task.id)
            ? { ...task, status: "done", updatedAt: new Date().toISOString() }
            : task,
        ),
      );
      addActivity(`Bulk update: ${pending.length} tasks marked done`);
      toast.success("Filtered tasks marked as done");
    } finally {
      setSyncing(false);
    }
  }

  async function handleClearCompleted() {
    const completed = filteredTasks.filter((task) => task.status === "done");
    if (completed.length === 0) {
      toast.message("No completed tasks in current filter");
      return;
    }
    setSyncing(true);
    try {
      await Promise.all(completed.map((task) => fetch(`/api/tasks/${task.id}`, { method: "DELETE" })));
      setTasks((previous) => previous.filter((task) => !completed.some((item) => item.id === task.id)));
      addActivity(`Bulk cleanup: ${completed.length} completed tasks removed`);
      toast.success("Completed tasks cleared");
    } finally {
      setSyncing(false);
    }
  }

  function handleExportTasks() {
    const payload = JSON.stringify(
      {
        project: activeProject,
        exportedAt: new Date().toISOString(),
        tasks: filteredTasks,
      },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeProject?.name ?? "project"}-tasks.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Task export downloaded");
  }

  async function handleDeleteTask(taskId: string) {
    setDeletingTaskId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      setTasks((previous) => previous.filter((task) => task.id !== taskId));
      setProjects((previous) =>
        previous.map((project) =>
          project.id === activeProjectId
            ? { ...project, totalTasks: Math.max(project.totalTasks - 1, 0) }
            : project,
        ),
      );
      addActivity("Task removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete task";
      toast.error(message);
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleDropToColumn(status: TaskStatus) {
    if (!draggingTaskId) {
      return;
    }
    const draggedTask = tasks.find((task) => task.id === draggingTaskId);
    if (!draggedTask || draggedTask.status === status) {
      setDraggingTaskId(null);
      return;
    }
    await handleUpdateTaskStatus(draggingTaskId, status);
    setDraggingTaskId(null);
  }

  const taskLists: Array<{ key: string; label: string; data: Task[] }> = [
    { key: "all", label: "All", data: filteredTasks },
    { key: "todo", label: "To Do", data: todoFiltered },
    { key: "in_progress", label: "In Progress", data: inProgressFiltered },
    { key: "done", label: "Done", data: doneFiltered },
  ];

  const boardColumns: Array<{ key: TaskStatus; label: string; items: Task[] }> = [
    { key: "todo", label: "To Do", items: todoFiltered },
    { key: "in_progress", label: "In Progress", items: inProgressFiltered },
    { key: "done", label: "Done", items: doneFiltered },
  ];

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(36,99,235,0.15),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.15),_transparent_25%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] p-4 md:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit border-slate-200/80 bg-white/80 shadow-sm backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback>{initials || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <CardDescription className="pt-2">
              Secure workspace for chats, tasks, and projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-2" onSubmit={handleCreateProject}>
              <Input
                placeholder="New project name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                maxLength={120}
                required
              />
              <Textarea
                placeholder="Short description"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                className="min-h-20"
                maxLength={1000}
              />
              <Button type="submit" className="w-full" disabled={creatingProject}>
                {creatingProject ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                Create Project
              </Button>
            </form>

            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Projects
              </p>
              <div className="max-h-64 space-y-2 overflow-auto pr-1">
                {loadingProjects ? (
                  <p className="text-sm text-muted-foreground">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setActiveProjectId(project.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        project.id === activeProjectId
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{project.name}</p>
                      <p className={`truncate text-xs ${project.id === activeProjectId ? "text-slate-200" : "text-muted-foreground"}`}>
                        {project.totalTasks} tasks
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.assign("/");
                    },
                  },
                })
              }
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-slate-200/80 bg-white/85">
              <CardHeader className="pb-2">
                <CardDescription>Total Tasks</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FolderKanban className="size-5 text-sky-600" />
                  {tasks.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 bg-white/85">
              <CardHeader className="pb-2">
                <CardDescription>In Progress</CardDescription>
                <CardTitle className="text-2xl">{inProgressTasks}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 bg-white/85">
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  {doneTasks}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200/80 bg-white/85">
              <CardHeader className="pb-2">
                <CardDescription>Workspace Security</CardDescription>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-5 text-indigo-600" />
                  Protected API
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    {activeProject ? activeProject.name : "Select a project"}
                  </CardTitle>
                  <CardDescription>
                    {activeProject?.description || "Track, prioritize, and ship work securely."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {syncing
                      ? "Syncing..."
                      : lastSyncedAt
                        ? `Synced ${lastSyncedAt.toLocaleTimeString()}`
                        : "Not synced yet"}
                  </Badge>
                  <Badge variant="secondary">{completion}% complete</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshActiveData}
                    disabled={syncing}
                  >
                    <RefreshCw className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openProjectEditor}
                    disabled={!activeProject}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteProject}
                    disabled={!activeProject || deletingProject}
                  >
                    {deletingProject ? "Deleting..." : "Delete Project"}
                  </Button>
                </div>
              </div>
              <Progress value={completion} className="mt-2" />
            </CardHeader>

            <CardContent className="space-y-4">
              {!activeProject ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  Create a project to start managing tasks.
                </div>
              ) : (
                <>
                  <form className="grid gap-3 rounded-xl border bg-slate-50/80 p-4 md:grid-cols-[1fr_1fr_140px_160px_auto]" onSubmit={handleCreateTask}>
                    <Input
                      placeholder="Task title"
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      required
                    />
                    <Textarea
                      placeholder="Task details"
                      className="min-h-10 md:min-h-full"
                      value={taskDescription}
                      onChange={(event) => setTaskDescription(event.target.value)}
                    />
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={taskDueDate}
                        onChange={(event) => setTaskDueDate(event.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <select
                      className="h-10 rounded-md border bg-white px-3 text-sm"
                      value={taskPriority}
                      onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <Button type="submit" disabled={creatingTask}>
                      {creatingTask ? "Adding..." : "Add Task"}
                    </Button>
                  </form>

                  <div className="grid gap-3 rounded-xl border bg-gradient-to-r from-sky-50 to-indigo-50 p-4 md:grid-cols-[1fr_auto]">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="size-4 text-sky-600" />
                        Quick Capture
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Format: <code>Task title | todo|in_progress|done | YYYY-MM-DD</code>
                      </p>
                      <Input
                        value={quickPrompt}
                        onChange={(event) => setQuickPrompt(event.target.value)}
                        placeholder="Prepare launch post | in_progress | 2026-03-28"
                      />
                    </div>
                    <Button
                      className="h-10 self-end"
                      onClick={handleQuickCreate}
                      disabled={creatingTask || !quickPrompt.trim()}
                    >
                      Capture
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Bot className="size-4 text-indigo-600" />
                      Assistant Actions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={creatingTask}
                        onClick={() => runAssistantPack("launch")}
                      >
                        Release Pack
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={creatingTask}
                        onClick={() => runAssistantPack("growth")}
                      >
                        Growth Pack
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={creatingTask}
                        onClick={() => runAssistantPack("bugfix")}
                      >
                        Repair Pack
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search tasks..."
                        className="pl-9"
                      />
                    </div>
                    <Badge variant="outline" className="h-10 rounded-md px-3">
                      To Do: {todoTasks}
                    </Badge>
                    <Badge variant="outline" className="h-10 rounded-md px-3">
                      In Progress: {inProgressTasks}
                    </Badge>
                    <Badge variant="outline" className="h-10 rounded-md px-3">
                      Done: {doneTasks}
                    </Badge>
                    <div className="col-span-full flex gap-2">
                      <select
                        className="h-9 rounded-md border bg-white px-3 text-sm"
                        value={taskDueFilter}
                        onChange={(event) =>
                          setTaskDueFilter(
                            event.target.value as "all" | "overdue" | "today" | "upcoming" | "no_due",
                          )
                        }
                      >
                        <option value="all">All due dates</option>
                        <option value="overdue">Overdue</option>
                        <option value="today">Due today</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="no_due">No due date</option>
                      </select>
                      <select
                        className="h-9 rounded-md border bg-white px-3 text-sm"
                        value={sortMode}
                        onChange={(event) =>
                          setSortMode(event.target.value as "updated" | "due" | "title")
                        }
                      >
                        <option value="updated">Sort: Updated</option>
                        <option value="due">Sort: Due Date</option>
                        <option value="title">Sort: Title</option>
                      </select>
                      <select
                        className="h-9 rounded-md border bg-white px-3 text-sm"
                        value={priorityFilter}
                        onChange={(event) => setPriorityFilter(event.target.value as "all" | TaskPriority)}
                      >
                        <option value="all">All priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <Button
                        type="button"
                        variant={starredOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStarredOnly((current) => !current)}
                      >
                        Favorites Only
                      </Button>
                      <Button
                        type="button"
                        variant={viewMode === "board" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("board")}
                      >
                        <LayoutGrid className="mr-2 size-4" />
                        Board
                      </Button>
                      <Button
                        type="button"
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="mr-2 size-4" />
                        List
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleMarkFilteredDone}>
                        Mark Filtered Done
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleClearCompleted}>
                        <Trash2 className="mr-2 size-4" />
                        Clear Completed
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleExportTasks}>
                        <Download className="mr-2 size-4" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {loadingTasks ? (
                    <div className="flex items-center justify-center rounded-lg border p-10 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading tasks...
                    </div>
                  ) : viewMode === "list" ? (
                    <Tabs defaultValue="all">
                      <TabsList className="w-full justify-start overflow-auto">
                        {taskLists.map((item) => (
                          <TabsTrigger key={item.key} value={item.key}>
                            {item.label} ({item.data.length})
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {taskLists.map((item) => (
                        <TabsContent key={item.key} value={item.key} className="pt-2">
                          {item.data.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                              No tasks in this view.
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {item.data.map((task) => (
                                <Card key={task.id} className="border-slate-200/90 bg-white">
                                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{task.title}</p>
                                        <Badge variant={statusBadgeVariant(task.status)}>
                                          {statusLabel(task.status)}
                                        </Badge>
                                        <Badge variant={priorityColor(task.priority)}>
                                          {task.priority}
                                        </Badge>
                                        {task.starred && <Badge variant="secondary">Favorite</Badge>}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {task.description || "No description"}
                                      </p>
                                      {task.dueDate && (
                                        <p className="text-xs text-muted-foreground">
                                          Due {new Date(task.dueDate).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <select
                                        className="h-9 rounded-md border bg-white px-3 text-sm"
                                        value={task.status}
                                        disabled={updatingTaskId === task.id}
                                        onChange={(event) =>
                                          handleUpdateTaskStatus(
                                            task.id,
                                            event.target.value as TaskStatus,
                                          )
                                        }
                                      >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                      </select>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStar(task)}
                                        disabled={updatingTaskId === task.id}
                                      >
                                        {task.starred ? "Unfavorite" : "Favorite"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openTaskEditor(task)}
                                      >
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDuplicateTask(task)}
                                        disabled={creatingTask}
                                      >
                                        <Copy className="mr-2 size-4" />
                                        Duplicate
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id)}
                                        disabled={deletingTaskId === task.id}
                                      >
                                        {deletingTaskId === task.id ? "Removing..." : "Remove"}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="grid gap-3 xl:grid-cols-3">
                      {boardColumns.map((column) => (
                        <div
                          key={column.key}
                          className={`rounded-xl border bg-slate-50/70 p-3 ${draggingTaskId ? "ring-1 ring-sky-200" : ""}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => void handleDropToColumn(column.key)}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="font-medium">{column.label}</p>
                            <Badge variant="outline">{column.items.length}</Badge>
                          </div>
                          <div className="space-y-2">
                            {column.items.length === 0 ? (
                              <div className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">
                                No tasks
                              </div>
                            ) : (
                              column.items.map((task) => (
                                <Card
                                  key={task.id}
                                  className="bg-white"
                                  draggable
                                  onDragStart={() => setDraggingTaskId(task.id)}
                                  onDragEnd={() => setDraggingTaskId(null)}
                                >
                                  <CardContent className="space-y-2 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <GripVertical className="size-4 text-muted-foreground" />
                                      <p className="text-sm font-medium">{task.title}</p>
                                      <Badge variant={priorityColor(task.priority)}>{task.priority}</Badge>
                                      {task.starred && <Badge variant="secondary">Favorite</Badge>}
                                    </div>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                      {task.description || "No description"}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {task.status !== "todo" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUpdateTaskStatus(task.id, "todo")}
                                          disabled={updatingTaskId === task.id}
                                        >
                                          To Do
                                        </Button>
                                      )}
                                      {task.status !== "in_progress" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                                          disabled={updatingTaskId === task.id}
                                        >
                                          Progress
                                        </Button>
                                      )}
                                      {task.status !== "done" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUpdateTaskStatus(task.id, "done")}
                                          disabled={updatingTaskId === task.id}
                                        >
                                          Done
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleToggleStar(task)}
                                      >
                                        {task.starred ? "Unfav" : "Fav"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openTaskEditor(task)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDuplicateTask(task)}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
              <CardDescription>Recent actions across projects and tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet. Create or update a task to start the feed.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="rounded-md border bg-slate-50 p-3">
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editingProjectOpen} onOpenChange={setEditingProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editProjectName}
              onChange={(event) => setEditProjectName(event.target.value)}
              placeholder="Project name"
            />
            <Textarea
              value={editProjectDescription}
              onChange={(event) => setEditProjectDescription(event.target.value)}
              placeholder="Project description"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProjectEdit} disabled={savingProjectEdit || !editProjectName.trim()}>
              {savingProjectEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update title, description, and due date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editTaskTitle}
              onChange={(event) => setEditTaskTitle(event.target.value)}
              placeholder="Task title"
            />
            <Textarea
              value={editTaskDescription}
              onChange={(event) => setEditTaskDescription(event.target.value)}
              placeholder="Task description"
            />
            <Input
              type="date"
              value={editTaskDueDate}
              onChange={(event) => setEditTaskDueDate(event.target.value)}
            />
            <select
              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
              value={editTaskPriority}
              onChange={(event) => setEditTaskPriority(event.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTaskEdit} disabled={savingTaskEdit || !editTaskTitle.trim()}>
              {savingTaskEdit ? "Saving..." : "Save Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
