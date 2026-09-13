// Local storage-based store (will migrate to Lovable Cloud later)
import { useState, useEffect, useCallback } from 'react';

export interface DailyReport {
  id: string;
  date: string;
  mathCorrect: number;
  mathTotal: number;
  englishCorrect: number;
  englishTotal: number;
  timeSpent: number;
  status: 'easy' | 'hard' | 'distracted';
  biggestMistakes: string;
  mistakeReason: 'concept' | 'careless' | 'time_pressure';
}

export interface MistakeEntry {
  id: string;
  date: string;
  description: string;
  correctSolution: string;
  tags: string[];
  imageUrl?: string;
  reason: 'concept' | 'careless' | 'time_pressure';
}

export interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  dateAdded: string;
  learned: boolean;
  reviewDate?: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  tasks: PlanTask[];
}

export interface PlanTask {
  id: string;
  description: string;
  completed: boolean;
  reason?: string;
}

const CURRENT_USER = 'ilyosbek';

function getKey(key: string) {
  return `sat_${CURRENT_USER}_${key}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(getKey(key));
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(getKey(key), JSON.stringify(data));
}

export function useStore<T>(key: string, fallback: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [data, setData] = useState<T>(() => load(key, fallback));

  const update = useCallback((val: T | ((prev: T) => T)) => {
    setData(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
      save(key, next);
      return next;
    });
  }, [key]);

  return [data, update];
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const TAGS = ['Algebra', 'Geometry', 'Probability', 'Statistics', 'Grammar', 'Reading', 'Writing', 'Vocabulary', 'Data Analysis', 'Advanced Math'] as const;

export const QUOTES = [
  "Discipline beats talent.",
  "You don't need motivation, you need a system.",
  "Small daily improvements lead to stunning results.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Success is the sum of small efforts, repeated.",
  "Don't count the days. Make the days count.",
  "Hard work beats talent when talent doesn't work hard.",
  "The only way to do great work is to love what you do.",
  "Push yourself, because no one else is going to do it for you.",
  "It's not about being the best. It's about being better than yesterday.",
];
