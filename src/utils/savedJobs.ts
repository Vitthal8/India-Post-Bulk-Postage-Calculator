import { ConsignmentItem } from '../types/consignment';
import { TariffVersion } from '../data/indiaPostTariffs';
import { CalculatorMode } from '../services/indiaPostApi';

const STORAGE_KEY = 'india-post-bulk-saved-jobs-v1';
const ACTIVE_JOB_KEY = 'india-post-bulk-active-job-v1';

export interface SavedJobState {
  items: ConsignmentItem[];
  originPin: string;
  activeTab: 'spreadsheet' | 'single' | 'tariffs' | 'circles';
  isDark: boolean;
  calculatorMode: CalculatorMode;
  tariffVersion: TariffVersion;
}

export interface SavedJob {
  id: string;
  name: string;
  savedAt: string;
  state: SavedJobState;
}

function isSavedJob(value: unknown): value is SavedJob {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedJob>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.savedAt === 'string' &&
    !!candidate.state &&
    Array.isArray(candidate.state.items) &&
    typeof candidate.state.originPin === 'string'
  );
}

export function readSavedJobs(): SavedJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedJob) : [];
  } catch {
    return [];
  }
}

export function writeSavedJobs(jobs: SavedJob[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function readActiveJobId(): string | null {
  return localStorage.getItem(ACTIVE_JOB_KEY);
}

export function writeActiveJobId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_JOB_KEY, id);
  else localStorage.removeItem(ACTIVE_JOB_KEY);
}

export function createJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
