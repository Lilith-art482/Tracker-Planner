import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { PlanItem, Task, Project, Note, TaskStatus, Priority, Category } from "@/types";

function userCol(userId: string, sub: string) {
  return collection(db, "users", userId, sub);
}

function userDoc(userId: string, sub: string, id: string) {
  return doc(db, "users", userId, sub, id);
}

// ─── Plan Items ──────────────────────────────────────────────

export async function createPlanItem(
  userId: string,
  data: Omit<PlanItem, "id" | "createdAt">
) {
  const ref = await addDoc(userCol(userId, "plans"), {
    ...data,
    date: Timestamp.fromDate(data.date),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPlanItems(userId: string, type?: "weekly" | "monthly", period?: string) {
  const constraints: QueryConstraint[] = [orderBy("date", "desc")];
  if (type) constraints.push(where("type", "==", type));
  if (period) {
    const key = type === "monthly" ? "month" : "weekStart";
    constraints.push(where(key, "==", period));
  }
  const snap = await getDocs(query(userCol(userId, "plans"), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() ?? new Date() })) as PlanItem[];
}

export async function updatePlanItem(userId: string, id: string, data: Partial<PlanItem>) {
  const payload: Record<string, unknown> = { ...data };
  if (data.date) payload.date = Timestamp.fromDate(data.date);
  await updateDoc(userDoc(userId, "plans", id), payload);
}

export async function deletePlanItem(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "plans", id));
}

// ─── Tasks ───────────────────────────────────────────────────

export async function createTask(
  userId: string,
  data: Omit<Task, "id" | "createdAt" | "updatedAt">
) {
  const ref = await addDoc(userCol(userId, "tasks"), {
    ...data,
    date: Timestamp.fromDate(data.date),
    deadline: Timestamp.fromDate(data.deadline),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTasks(
  userId: string,
  dateFrom?: Date,
  dateTo?: Date,
  projectId?: string | null
) {
  const constraints: QueryConstraint[] = [orderBy("date", "asc")];
  if (dateFrom) constraints.push(where("date", ">=", Timestamp.fromDate(dateFrom)));
  if (dateTo) constraints.push(where("date", "<=", Timestamp.fromDate(dateTo)));
  if (projectId !== undefined) constraints.push(where("projectId", "==", projectId));
  const snap = await getDocs(query(userCol(userId, "tasks"), ...constraints));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      date: data.date?.toDate() ?? new Date(),
      deadline: data.deadline?.toDate() ?? new Date(),
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    } as Task;
  });
}

export async function updateTask(userId: string, id: string, data: Partial<Task>) {
  const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.date) payload.date = Timestamp.fromDate(data.date);
  if (data.deadline) payload.deadline = Timestamp.fromDate(data.deadline);
  await updateDoc(userDoc(userId, "tasks", id), payload);
}

export async function deleteTask(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "tasks", id));
}

// ─── Projects ────────────────────────────────────────────────

export async function createProject(
  userId: string,
  data: Omit<Project, "id" | "createdAt" | "updatedAt">
) {
  const ref = await addDoc(userCol(userId, "projects"), {
    ...data,
    features: data.features ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getProjects(userId: string) {
  const snap = await getDocs(query(userCol(userId, "projects"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    } as Project;
  });
}

export async function getProject(userId: string, id: string) {
  const snap = await getDoc(userDoc(userId, "projects", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as Project;
}

export async function updateProject(userId: string, id: string, data: Partial<Project>) {
  await updateDoc(userDoc(userId, "projects", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProject(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "projects", id));
}

// ─── Notes ───────────────────────────────────────────────────

export async function createNote(
  userId: string,
  data: Omit<Note, "id" | "createdAt" | "updatedAt">
) {
  const ref = await addDoc(userCol(userId, "notes"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getNotes(userId: string) {
  const snap = await getDocs(query(userCol(userId, "notes"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    } as Note;
  });
}

export async function updateNote(userId: string, id: string, data: Partial<Note>) {
  await updateDoc(userDoc(userId, "notes", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteNote(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "notes", id));
}

// ─── Categories ──────────────────────────────────────────────

export async function getCategories(userId: string) {
  const snap = await getDocs(query(userCol(userId, "categories"), orderBy("createdAt", "asc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate() ?? new Date(),
    } as Category;
  });
}

export async function createCategory(
  userId: string,
  data: Omit<Category, "id" | "createdAt">
) {
  const ref = await addDoc(userCol(userId, "categories"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(userId: string, id: string, data: Partial<Category>) {
  await updateDoc(userDoc(userId, "categories", id), data);
}

export async function deleteCategory(userId: string, id: string) {
  await deleteDoc(userDoc(userId, "categories", id));
}
