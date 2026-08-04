import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CircleAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface CircleMember {
  id: string;
  threadId: string;
  userId: string;
  role: 'member' | 'moderator' | 'owner';
  status: 'active' | 'muted' | 'left';
  joinedAt: string;
  lastReadAt: string | null;
  user: CircleAuthor;
}

export interface CircleSchedule {
  id: string;
  circleId: string;
  dayOfWeek: number;
  timeOfDay: string;
  timezone: string;
}

export interface CircleGoal {
  id: string;
  circleId: string;
  createdBy: string;
  title: string;
  description: string | null;
  target: number;
  progress: number;
  week: string;
  status: 'active' | 'completed';
  createdAt: string;
  user: CircleAuthor;
}

export interface CircleNote {
  id: string;
  circleId: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CircleAuthor;
}

export interface CircleSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  score: number | null;
  createdAt: string;
  user: CircleAuthor;
}

export interface CircleAssignment {
  id: string;
  circleId: string;
  createdBy: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  creator: CircleAuthor;
  submissionCount?: number;
  submissions?: CircleSubmission[];
}

export interface Circle {
  id: string;
  title: string;
  body: string;
  category: string;
  threadType: string;
  isLocked: boolean;
  author: CircleAuthor;
  memberCount: number;
  activityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CircleDetail extends Circle {
  members: CircleMember[];
  schedule: CircleSchedule | null;
  goals: CircleGoal[];
  notes: CircleNote[];
  assignments: CircleAssignment[];
}

export interface CirclesResponse {
  circles: Circle[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MembersResponse {
  members: CircleMember[];
}

export interface GoalsResponse {
  goals: CircleGoal[];
}

export interface AssignmentsResponse {
  assignments: CircleAssignment[];
}

export interface CalendarResponse {
  schedule: CircleSchedule | null;
  assignments: { id: string; title: string; dueDate: string | null }[];
  goals: { id: string; title: string; week: string; status: string }[];
}

// ─── API Service ────────────────────────────────────────────────────────────

const api = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchCircles(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CirclesResponse> {
  const query: Record<string, string> = {};
  if (params?.search) query.search = params.search;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  const { data } = await api.get('/api/study-circles/circles', { params: query });
  return data;
}

export async function fetchCircle(id: string): Promise<CircleDetail> {
  const { data } = await api.get(`/api/study-circles/circles/${id}`);
  return data;
}

export async function createCircle(payload: {
  title: string;
  description: string;
  category?: string;
}): Promise<Circle> {
  const { data } = await api.post('/api/study-circles/circles', payload);
  return data;
}

export async function joinCircle(id: string): Promise<unknown> {
  const { data } = await api.post(`/api/study-circles/circles/${id}/join`);
  return data;
}

export async function leaveCircle(id: string): Promise<unknown> {
  const { data } = await api.post(`/api/study-circles/circles/${id}/leave`);
  return data;
}

export async function fetchMembers(id: string): Promise<CircleMember[]> {
  const { data } = await api.get<MembersResponse>(`/api/study-circles/circles/${id}/members`);
  return data.members;
}

export async function setModerator(id: string, targetUserId: string): Promise<unknown> {
  const { data } = await api.post(`/api/study-circles/circles/${id}/moderator`, {
    targetUserId,
  });
  return data;
}

export async function fetchSchedule(id: string): Promise<CircleSchedule | null> {
  const { data } = await api.get(`/api/study-circles/circles/${id}/schedule`);
  return data;
}

export async function updateSchedule(
  id: string,
  payload: { dayOfWeek: number; timeOfDay: string; timezone: string }
): Promise<CircleSchedule> {
  const { data } = await api.put(`/api/study-circles/circles/${id}/schedule`, payload);
  return data;
}

export async function fetchGoals(id: string, week?: string): Promise<CircleGoal[]> {
  const { data } = await api.get<GoalsResponse>(`/api/study-circles/circles/${id}/goals`, {
    params: week ? { week } : {},
  });
  return data.goals;
}

export async function createGoal(
  id: string,
  payload: { title: string; description?: string; target: number; week: string }
): Promise<CircleGoal> {
  const { data } = await api.post(`/api/study-circles/circles/${id}/goals`, payload);
  return data;
}

export async function updateGoalProgress(goalId: string, progress: number): Promise<CircleGoal> {
  const { data } = await api.put(`/api/study-circles/goals/${goalId}`, { progress });
  return data;
}

export async function createNote(
  id: string,
  payload: { title: string; content: string }
): Promise<CircleNote> {
  const { data } = await api.post(`/api/study-circles/circles/${id}/notes`, payload);
  return data;
}

export async function updateNote(
  noteId: string,
  payload: { title?: string; content?: string }
): Promise<CircleNote> {
  const { data } = await api.put(`/api/study-circles/notes/${noteId}`, payload);
  return data;
}

export async function deleteNote(noteId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/api/study-circles/notes/${noteId}`);
  return data;
}

export async function fetchAssignments(id: string): Promise<CircleAssignment[]> {
  const { data } = await api.get<AssignmentsResponse>(
    `/api/study-circles/circles/${id}/assignments`
  );
  return data.assignments;
}

export async function createAssignment(
  id: string,
  payload: { title: string; description?: string; dueDate?: string }
): Promise<CircleAssignment> {
  const { data } = await api.post(`/api/study-circles/circles/${id}/assignments`, payload);
  return data;
}

export async function submitAssignment(
  assignmentId: string,
  content: string
): Promise<CircleSubmission> {
  const { data } = await api.post(`/api/study-circles/assignments/${assignmentId}/submit`, {
    content,
  });
  return data;
}

export async function scoreSubmission(submissionId: string, score: number): Promise<CircleSubmission> {
  const { data } = await api.post(`/api/study-circles/submissions/${submissionId}/score`, {
    score,
  });
  return data;
}

export async function fetchCalendar(id: string): Promise<CalendarResponse> {
  const { data } = await api.get(`/api/study-circles/circles/${id}/calendar`);
  return data;
}
