export interface Pollution {
  id: string;
  name: string;
  type: PollutionType;
  city: string;
  level: number;
  recordedAt: string;
  description: string;
  status: PollutionStatus;
}

export type PollutionType = 'air' | 'water' | 'soil' | 'noise' | 'other';
export type PollutionStatus = 'open' | 'investigating' | 'resolved';

export interface PollutionFilters {
  search?: string;
  type?: PollutionType | '';
  city?: string;
  status?: PollutionStatus | '';
  minLevel?: number | null;
  maxLevel?: number | null;
}

export type PollutionPayload = Omit<Pollution, 'id'>;

