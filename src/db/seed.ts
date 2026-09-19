import type { Exercise, Routine } from './schema';
import { newId } from './schema';

interface SeedExercise {
  name: string;
  muscleGroup: string;
  increment: number;
  defaultSets: number;
  defaultReps: number;
}

const PUSH: SeedExercise[] = [
  { name: 'Barbell Bench Press', muscleGroup: 'Chest', increment: 2.5, defaultSets: 4, defaultReps: 8 },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', increment: 2, defaultSets: 3, defaultReps: 10 },
  { name: 'Overhead Press', muscleGroup: 'Shoulders', increment: 2.5, defaultSets: 3, defaultReps: 8 },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders', increment: 2, defaultSets: 3, defaultReps: 14 },
  { name: 'Triceps Pushdown', muscleGroup: 'Triceps', increment: 2.5, defaultSets: 3, defaultReps: 12 },
];

const PULL: SeedExercise[] = [
  { name: 'Deadlift', muscleGroup: 'Back', increment: 5, defaultSets: 3, defaultReps: 5 },
  { name: 'Barbell Row', muscleGroup: 'Back', increment: 2.5, defaultSets: 4, defaultReps: 8 },
  { name: 'Lat Pulldown', muscleGroup: 'Back', increment: 2.5, defaultSets: 3, defaultReps: 10 },
  { name: 'Seated Cable Row', muscleGroup: 'Back', increment: 2.5, defaultSets: 3, defaultReps: 10 },
  { name: 'Face Pull', muscleGroup: 'Rear Delts', increment: 2.5, defaultSets: 3, defaultReps: 15 },
  { name: 'Barbell Curl', muscleGroup: 'Biceps', increment: 2.5, defaultSets: 3, defaultReps: 10 },
];

const LEGS: SeedExercise[] = [
  { name: 'Back Squat', muscleGroup: 'Quads', increment: 2.5, defaultSets: 4, defaultReps: 6 },
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', increment: 2.5, defaultSets: 3, defaultReps: 8 },
  { name: 'Leg Press', muscleGroup: 'Quads', increment: 5, defaultSets: 3, defaultReps: 12 },
  { name: 'Leg Curl', muscleGroup: 'Hamstrings', increment: 2.5, defaultSets: 3, defaultReps: 12 },
  { name: 'Standing Calf Raise', muscleGroup: 'Calves', increment: 2.5, defaultSets: 4, defaultReps: 12 },
];

export function buildSeed(): { exercises: Exercise[]; routines: Routine[] } {
  const exercises: Exercise[] = [];
  const createdAt = Date.now();

  const make = (group: SeedExercise[]): string[] =>
    group.map((s) => {
      const exercise: Exercise = { ...s, id: newId(), archived: false, createdAt };
      exercises.push(exercise);
      return exercise.id;
    });

  const routines: Routine[] = [
    { id: newId(), name: 'Push Day', exerciseIds: make(PUSH), archived: false },
    { id: newId(), name: 'Pull Day', exerciseIds: make(PULL), archived: false },
    { id: newId(), name: 'Leg Day', exerciseIds: make(LEGS), archived: false },
  ];

  return { exercises, routines };
}
