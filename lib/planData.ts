import { Task, Project, Profile, TaskKind, ResetCadence } from "./types";

export const defaultProfile: Profile = {
  name: "Linard T. Cordero",
  targetRoles: "Junior Full Stack Developer / Junior Laravel Developer / Junior Web Developer",
  github: "github.com/Nardszi",
  email: "linardtipagad@gmail.com",
  phone: "09942522882",
};

export const defaultProjects: Project[] = [
  {
    id: "p1",
    name: "NONECO Document Tracking System",
    description:
      "Document tracking system built with React and PostgreSQL, deployed on Vercel with Supabase storage.",
    techStack: ["React", "TypeScript", "PostgreSQL", "Supabase", "Vercel"],
    liveUrl: "",
    githubUrl: "",
    status: "In Progress",
  },
  {
    id: "p2",
    name: "SCOUTMASTER",
    description:
      "Boy Scout management system handling registration with expiring ID numbers, badge tracking, event attendance, and video call meetings for scouts.",
    techStack: ["PHP", "Laravel", "MySQL"],
    liveUrl: "",
    githubUrl: "",
    status: "Completed",
  },
  {
    id: "p3",
    name: "OFW-PORTAL-JOB",
    description: "Thesis project — job portal platform for OFWs.",
    techStack: ["PHP", "Laravel", "MySQL"],
    liveUrl: "",
    githubUrl: "",
    status: "Completed",
  },
  {
    id: "p4",
    name: "Supply Office Inventory System",
    description: "Inventory management system for a supply office.",
    techStack: ["PHP", "MySQL"],
    liveUrl: "",
    githubUrl: "",
    status: "Completed",
  },
];

function t(phase: Task["phase"], section: string, title: string, i: number): Task {
  return { id: `${phase}-${i}`, phase, section, title, completed: false };
}

function tp(
  phase: Task["phase"],
  section: string,
  title: string,
  i: number,
  target: number,
  resetCadence: ResetCadence = "none"
): Task {
  return {
    id: `${phase}-${i}`,
    phase,
    section,
    title,
    completed: false,
    kind: "progress",
    target,
    current: 0,
    resetCadence,
    lastResetDate: new Date().toISOString().slice(0, 10),
  };
}

export const defaultTasks: Task[] = [
  // Days 1-30
  t("30", "Portfolio & Presence", "Deploy NONECO Document Tracking System live (Vercel + Supabase)", 1),
  t("30", "Portfolio & Presence", "Deploy SCOUTMASTER live", 2),
  t("30", "Portfolio & Presence", "Deploy OFW-PORTAL-JOB live", 3),
  t("30", "Portfolio & Presence", "Write clear READMEs (problem, stack, role, screenshots) for each project", 4),
  t("30", "Portfolio & Presence", "Polish GitHub profile README and pin top 3-4 projects", 5),
  tp("30", "Applications", "Apply to 10 remote/WFH junior dev roles per day", 6, 10, "daily"),
  t("30", "Applications", "Customize resume + cover letter per role", 7),
  t("30", "Applications", "Set up application tracker spreadsheet/tool", 8),
  t("30", "Skill Sharpening", "Learn Docker basics / deployment & CI-CD fundamentals", 9),
  t("30", "Skill Sharpening", "Review common IT interview questions", 10),

  // Days 31-60
  tp("60", "Interview Readiness", "Practice mock technical interviews (Laravel/React/PostgreSQL)", 11, 3, "none"),
  t("60", "Interview Readiness", "Practice behavioral answers using STAR method", 12),
  t("60", "Interview Readiness", "Prepare 2-3 strong project walkthroughs", 13),
  t("60", "Widen the Net", "Add freelance gigs on Upwork/Fiverr for income + portfolio", 14),
  t("60", "Widen the Net", "Follow up on all silent applications (1+ week no response)", 15),
  t("60", "Widen the Net", "Track response rate and revisit resume if under 10%", 16),
  t("60", "Networking", "Connect with CPSU alumni in IT on LinkedIn", 17),
  t("60", "Networking", "Join Filipino dev communities for remote job leads", 18),

  // Days 61-90
  t("90", "Prioritize Live Processes", "Push hardest on roles at case-study/technical-interview stage", 19),
  t("90", "Prioritize Live Processes", "Prep specifically for each company's known interview style", 20),
  t("90", "Decision Point", "Compare offers on pay, remote flexibility, growth, tech fit", 21),
  t("90", "Decision Point", "If still searching, widen role titles (IT Support, QA, Tech Support)", 22),
  t("90", "Decision Point", "Revisit portfolio based on interview feedback patterns", 23),
];

export function normalizeTask(raw: Task): Task {
  const kind: TaskKind = raw.kind ?? "binary";
  const task: Task = {
    id: raw.id,
    phase: raw.phase,
    section: raw.section,
    title: raw.title,
    completed: raw.completed,
    kind,
    custom: raw.custom,
    note: raw.note,
    order: raw.order,
  };
  if (kind === "progress") {
    task.target = raw.target ?? 1;
    task.current = raw.current ?? 0;
    task.resetCadence = raw.resetCadence ?? "none";
    task.lastResetDate = raw.lastResetDate ?? new Date().toISOString().slice(0, 10);
  }
  return task;
}

export function dailyResetTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  const updated = tasks.map((task) => {
    if (task.kind === "progress" && task.resetCadence === "daily") {
      if (task.lastResetDate !== today) {
        changed = true;
        return {
          ...task,
          current: 0,
          completed: false,
          lastResetDate: today,
        };
      }
    }
    return task;
  });
  return changed ? updated : tasks;
}
