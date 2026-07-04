import { WorkoutTemplate } from "./types";

export const defaultTemplates: WorkoutTemplate[] = [
  {
    id: "tpl-bodyweight",
    name: "Home Bodyweight — 20 min",
    description: "Full body no-equipment circuit. Great for building consistency.",
    exercises: [
      { name: "Push-ups", type: "strength", sets: 3, reps: 12 },
      { name: "Squats", type: "strength", sets: 3, reps: 15 },
      { name: "Plank", type: "strength", sets: 3, durationMinutes: 1 },
      { name: "Jumping Jacks", type: "cardio", sets: 3, reps: 20 },
    ],
  },
  {
    id: "tpl-cardio",
    name: "Quick Cardio — 15 min",
    description: "Brisk walk or jog to get the blood flowing.",
    exercises: [
      { name: "Brisk Walk or Jog", type: "cardio", durationMinutes: 15 },
    ],
  },
  {
    id: "tpl-stretch",
    name: "Desk Break Stretch — 5 min",
    description: "Quick stretches to reset between applications.",
    exercises: [
      { name: "Neck Rolls", type: "flexibility", durationMinutes: 1 },
      { name: "Shoulder Stretch", type: "flexibility", durationMinutes: 1 },
      { name: "Hamstring Stretch", type: "flexibility", durationMinutes: 1.5 },
      { name: "Wrist Circles", type: "flexibility", durationMinutes: 0.5 },
    ],
  },
];
