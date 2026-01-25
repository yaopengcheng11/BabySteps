
export enum LogType {
  FEEDING = 'FEEDING',
  SLEEP = 'SLEEP',
  DIAPER = 'DIAPER',
  GROWTH = 'GROWTH',
  NOTE = 'NOTE',
  VACCINE = 'VACCINE'
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

// 新增：成长事件分类
export enum GrowthCategory {
  MILESTONE = '里程碑', // 第一次坐、走等
  PHYSICAL = '身体发育', // 身高、体重
  TEETH = '牙齿',     // 长牙
  HEALTH = '健康状态', // 精神、过敏等
  SKILL = '新技能'    // 抓握、发声等
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

// 扩展：成长记录现在支持事件名称、分类以及可选的身体指标
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

export type BabyLog = FeedingLog | SleepLog | DiaperLog | GrowthLog | NoteLog | VaccineLog;

export interface BabyProfile {
  name: string;
  birthDate: string;
  gender: 'boy' | 'girl';
}
