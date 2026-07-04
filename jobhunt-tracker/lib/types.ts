export type TaskPhase = "30" | "60" | "90";

export interface Task {
  id: string;
  phase: TaskPhase;
  section: string;
  title: string;
  completed: boolean;
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
