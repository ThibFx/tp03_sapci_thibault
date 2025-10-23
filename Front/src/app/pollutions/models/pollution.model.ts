export interface Pollution {
  id: string;
  name: string;
  type: PollutionType;
  city: string;
  recordedAt: string;
  description: string;
  status: PollutionStatus;
}

export type PollutionType =
  | 'plastic'
  | 'chemical'
  | 'wild_dumping'
  | 'water'
  | 'air'
  | 'other';
export type PollutionStatus = 'open' | 'investigating' | 'resolved';

export const POLLUTION_TYPE_LABELS: Record<PollutionType, string> = {
  plastic: 'Plastique',
  chemical: 'Chimique',
  wild_dumping: 'Dépôt Sauvage',
  water: 'Eau',
  air: 'Air',
  other: 'Autre'
};

export const POLLUTION_STATUS_LABELS: Record<PollutionStatus, string> = {
  open: 'Ouvert',
  investigating: 'Investigation',
  resolved: 'Résolu'
};

export interface PollutionFilters {
  search?: string;
  type?: PollutionType | '';
  city?: string;
  status?: PollutionStatus | '';
}

export type PollutionPayload = Omit<Pollution, 'id'>;
