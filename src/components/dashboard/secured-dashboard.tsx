"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, FolderKanban, LayoutGrid, List, Loader2, LogOut, Plus, Search, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type Task = {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiError = {
  error?: string;
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
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState("");

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
    if (!normalizedSearch) {
      return tasks;
    }
    return tasks.filter((task) => {
      const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [tasks, search]);

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
      toast.success("Project deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete project";
      toast.error(message);
    } finally {
      setDeletingProject(false);
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
      setProjects((previous) =>
        previous.map((project) =>
          project.id === activeProjectId
            ? { ...project, totalTasks: project.totalTasks + 1 }
            : project,
        ),
      );
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
          dueDate: dueDate ? dueDate.toISOString() : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      const payload = (await response.json()) as { task: Task };
      setTasks((previous) => [payload.task, ...previous]);
      setQuickPrompt("");
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update task";
      toast.error(message);
    } finally {
      setUpdatingTaskId(null);
    }
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete task";
      toast.error(message);
    } finally {
      setDeletingTaskId(null);
    }
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
              Secure workspace powered by authenticated APIs.
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
                  <form className="grid gap-3 rounded-xl border bg-slate-50/80 p-4 md:grid-cols-[1fr_1fr_180px_auto]" onSubmit={handleCreateTask}>
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
                        <div key={column.key} className="rounded-xl border bg-slate-50/70 p-3">
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
                                <Card key={task.id} className="bg-white">
                                  <CardContent className="space-y-2 p-3">
                                    <p className="text-sm font-medium">{task.title}</p>
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
        </div>
      </div>
    </main>
  );
}
