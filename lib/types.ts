export type TaskPhase = "30" | "60" | "90";

export type TaskKind = "binary" | "progress";
export type ResetCadence = "none" | "daily";

export interface Task {
  id: string;
  phase: TaskPhase;
  section: string;
  title: string;
  completed: boolean;
  kind?: TaskKind;
  target?: number;
  current?: number;
  resetCadence?: ResetCadence;
  lastResetDate?: string;
}

export type AppStatus =
  | "Applied"
  | "Interview Scheduled"
  | "Case Study"
  | "Offer"
  | "Rejected"
  | "Ghosted";

export interface Application {
  id: string;
  company: string;
  role: string;
  dateApplied: string;
  status: AppStatus;
  followUpDate: string;
  notes: string;
  jobUrl: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  liveUrl: string;
  githubUrl: string;
  status: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface Profile {
  name: string;
  targetRoles: string;
  github: string;
  email: string;
  phone: string;
}

export type ExerciseType = "strength" | "cardio" | "flexibility" | "other";

export interface ExerciseEntry {
  id: string;
  name: string;
  type: ExerciseType;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationMinutes?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  date: string;
  templateId?: string;
  exercises: ExerciseEntry[];
  completed: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: Omit<ExerciseEntry, "id">[];
}

export interface BodyStat {
  id: string;
  date: string;
  weightKg?: number;
  notes?: string;
}
