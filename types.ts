export enum Language {
  HTML = 'HTML',
  CSS = 'CSS',
  JavaScript = 'JavaScript',
}

export interface ProjectCode {
  html?: string;
  css?: string;
  js?: string;
}

export interface ValidationResult {
  success: boolean;
  message: string;
  updatedProjectCode?: ProjectCode;
}

export interface Task {
  id: string;
  instruction: string;
  longDescription?: string;
  language: Language;
  starterCode?: string | ((projectCode?: ProjectCode) => string);
  validate: (code: string, currentProjectCode?: ProjectCode) => ValidationResult;
  hint?: string;
  expectedOutputPreview?: string; // HTML string showing expected visual output
}

export interface Level {
  id: string;
  title: string;
  description: string;
  icon?: string; // e.g., simple emoji or SVG path for level selector
  tasks: Task[];
  projectType?: 'calculator' | 'amazon_clone';
  unlocksNextLevel?: string | null; // ID of the next level, null if last
}

export interface UserProgress {
  [levelId: string]: {
    completedTasks: Set<string>;
    currentProjectCode: ProjectCode;
    isCompleted: boolean;
  };
}

export type AppView = 'level_selector' | 'level_view';