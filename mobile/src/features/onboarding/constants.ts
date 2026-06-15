export const QUICK_NOTES_COLLECTION_NAME = 'Quick Notes';

export const ONBOARDING_STORAGE_KEYS = {
  completed: 'memora.onboarding.completed',
  knowledgeCategory: 'memora.onboarding.knowledgeCategory',
} as const;

export interface KnowledgeCategory {
  id: string;
  label: string;
  icon: string;
  notePlaceholder: string;
  suggestedQuestion: string;
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: 'work',
    label: 'Work & Career',
    icon: '💼',
    notePlaceholder: 'Meeting notes, project ideas, or career goals…',
    suggestedQuestion: 'What are the key takeaways from my work notes?',
  },
  {
    id: 'personal',
    label: 'Personal Notes',
    icon: '📝',
    notePlaceholder: 'Thoughts, reminders, or personal reflections…',
    suggestedQuestion: 'Summarize the main themes in my personal notes.',
  },
  {
    id: 'study',
    label: 'Study & Learning',
    icon: '📚',
    notePlaceholder: 'Lecture notes, study topics, or research…',
    suggestedQuestion: 'Help me review and recall what I saved in my notes.',
  },
  {
    id: 'projects',
    label: 'Projects & Ideas',
    icon: '💡',
    notePlaceholder: 'Brainstorm ideas, plans, or creative sparks…',
    suggestedQuestion: 'What ideas stand out in my saved notes?',
  },
  {
    id: 'health',
    label: 'Health & Wellness',
    icon: '🎯',
    notePlaceholder: 'Fitness goals, habits, or wellness notes…',
    suggestedQuestion: 'What patterns do you notice in my wellness notes?',
  },
  {
    id: 'other',
    label: 'Something Else',
    icon: '🔖',
    notePlaceholder: 'Anything you want Memora to remember…',
    suggestedQuestion: 'What did I save in my notes?',
  },
];

export const ONBOARDING_STEPS = 5;

export function getCategoryById(id: string | null): KnowledgeCategory {
  return KNOWLEDGE_CATEGORIES.find((category) => category.id === id) ?? KNOWLEDGE_CATEGORIES[0];
}
