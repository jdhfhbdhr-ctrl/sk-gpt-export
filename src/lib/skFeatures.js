
export const SK_FEATURES = [
  { id: "goal-finish", name: "Goal-to-Finish Mode", category: "Productivity", description: "Turn a goal into actionable steps, milestones and progress." },
  { id: "change-radar", name: "Answer Change Radar", category: "Research", description: "Track changes in saved answers and their sources." },
  { id: "truth-receipt", name: "Truth Receipt", category: "Trust", description: "Record sources, verification status and uncertainty." },
  { id: "memory-passport", name: "Memory Permission Passport", category: "Privacy", description: "Control what information may be remembered and for how long." },
  { id: "contradiction-lab", name: "Contradiction Lab", category: "Research", description: "Compare explanations and evidence for competing claims." },
  { id: "chat-branches", name: "Chat Branch & Merge", category: "Chat", description: "Explore alternative conversation paths and combine decisions." },
  { id: "knowledge-map", name: "Knowledge Relationship Map", category: "Knowledge", description: "Connect saved facts, projects and their sources." },
  { id: "file-delta", name: "File Delta Intelligence", category: "Files", description: "Compare document versions and highlight meaningful changes." },
  { id: "meaning-lock", name: "Meaning Lock Translator", category: "Language", description: "Preserve terminology, tone and meaning during translation." },
  { id: "decision-room", name: "Decision Simulation Room", category: "Planning", description: "Explore possible outcomes before making a decision." },
  { id: "workflow-dna", name: "Personal Workflow DNA", category: "Productivity", description: "Save reusable workflows with steps and test cases." },
  { id: "handoff-capsule", name: "Project Handoff Capsule", category: "Projects", description: "Export project context, decisions and pending tasks." }
];

const STORAGE_KEY = "sk-gpt-features-v1";

export function getFeatureSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveFeatureSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isFeatureEnabled(id) {
  return getFeatureSettings()[id] !== false;
}
