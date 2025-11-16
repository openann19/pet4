/**
 * Quiz System
 *
 * Educational quizzes for pet care and safety
 */

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type QuizTopic = 'safety' | 'care' | 'training' | 'health' | 'socialization';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: QuizTopic;
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
  points: number;
  timeLimit?: number; // in seconds
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizAttempt {
  quizId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, number>;
  score?: number;
  passed?: boolean;
}

export interface QuizResult {
  attempt: QuizAttempt;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  pointsEarned: number;
  passed: boolean;
}

export const QUIZZES: Quiz[] = [
  {
    id: 'safety-basics',
    title: 'Pet Safety Basics',
    description: 'Test your knowledge of pet safety',
    topic: 'safety',
    difficulty: 'easy',
    points: 50,
    questions: [
      {
        id: 'q1',
        question: 'What should you do before meeting a new pet?',
        options: [
          'Approach immediately',
          'Ask the owner for permission',
          'Make loud noises',
          'Ignore the pet',
        ],
        correctAnswer: 1,
        explanation: 'Always ask the owner for permission before approaching their pet.',
      },
      {
        id: 'q2',
        question: 'What is the safest way to introduce two dogs?',
        options: [
          'Let them meet off-leash immediately',
          'Introduce them in a neutral, controlled environment',
          'Force them to interact',
          'Keep them separated forever',
        ],
        correctAnswer: 1,
        explanation: 'Neutral, controlled environments reduce territorial behavior.',
      },
    ],
  },
  {
    id: 'care-essentials',
    title: 'Pet Care Essentials',
    description: 'Learn about basic pet care',
    topic: 'care',
    difficulty: 'medium',
    points: 75,
    questions: [
      {
        id: 'q1',
        question: 'How often should you take your dog for a walk?',
        options: [
          'Once a week',
          'Once a day',
          'Multiple times daily',
          'Never',
        ],
        correctAnswer: 2,
        explanation: 'Dogs need regular exercise, typically multiple walks per day.',
      },
    ],
  },
];

export function calculateQuizScore(quiz: Quiz, attempt: QuizAttempt): QuizResult {
  const correctAnswers = quiz.questions.filter(
    (q) => attempt.answers[q.id] === q.correctAnswer
  ).length;
  const totalQuestions = quiz.questions.length;
  const percentage = (correctAnswers / totalQuestions) * 100;
  const passed = percentage >= 70; // 70% passing threshold
  const pointsEarned = passed ? quiz.points : Math.floor(quiz.points * (percentage / 100));

  return {
    attempt: {
      ...attempt,
      score: percentage,
      passed,
      completedAt: new Date().toISOString(),
    },
    correctAnswers,
    totalQuestions,
    percentage,
    pointsEarned,
    passed,
  };
}

export function getQuizById(id: string): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id);
}

export function getQuizzesByTopic(topic: QuizTopic): Quiz[] {
  return QUIZZES.filter((q) => q.topic === topic);
}

