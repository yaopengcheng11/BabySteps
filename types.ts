
export enum LogType {
  FEEDING = 'FEEDING',
  SLEEP = 'SLEEP',
  DIAPER = 'DIAPER',
  GROWTH = 'GROWTH',
  NOTE = 'NOTE',
  VACCINE = 'VACCINE',
  ADVICE = 'ADVICE',
  TODO = 'TODO'
}

export enum FeedingMethod {
  BREAST = '母乳',
  BOTTLE = '瓶喂母乳',
  FORMULA = '奶粉',
  SOLID = '辅食'
}

export enum DiaperStatus {
  WET = '尿尿',
  DIRTY = '便便',
  BOTH = '都有'
}

export enum GrowthCategory {
  MILESTONE = '里程碑',
  PHYSICAL = '身体发育',
  TEETH = '牙齿',
  HEALTH = '健康状态',
  SKILL = '新技能'
}

export interface BabyLogBase {
  id: string;
  type: LogType;
  timestamp: number;
  note?: string;
}

export interface FeedingLog extends BabyLogBase {
  type: LogType.FEEDING;
  amount?: number;
  duration?: number;
  method: FeedingMethod;
}

export interface SleepLog extends BabyLogBase {
  type: LogType.SLEEP;
  duration: number;
  endTime: number;
}

export interface DiaperLog extends BabyLogBase {
  type: LogType.DIAPER;
  status: DiaperStatus;
}

export interface GrowthLog extends BabyLogBase {
  type: LogType.GROWTH;
  eventName: string; 
  category: GrowthCategory;
  weight?: number; // kg
  height?: number; // cm
}

export interface VaccineLog extends BabyLogBase {
  type: LogType.VACCINE;
  vaccineName: string;
  nextDoseDate?: string;
}

export interface NoteLog extends BabyLogBase {
  type: LogType.NOTE;
  content: string;
}

export interface AdviceLog extends BabyLogBase {
  type: LogType.ADVICE;
  content: string;
  title: string;
  reportType?: 'day' | 'week' | 'month' | 'custom';
}

export interface BabyTodo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  targetDate: number; 
  reminderTime?: number; // 新增：提醒的具体时间戳
  isNotified?: boolean;  // 新增：是否已触发过通知
  category?: 'shopping' | 'medical' | 'daily' | 'other';
}

export type BabyLog = FeedingLog | SleepLog | DiaperLog | GrowthLog | NoteLog | VaccineLog | AdviceLog;

export interface BabyProfile {
  name: string;
  birthDate: string;
  gender: 'boy' | 'girl';
}
