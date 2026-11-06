export type Sex = 'M' | 'F' | 'MX';

export type AgeCategory =
  | 'open'
  | 'sub_junior'
  | 'junior'
  | 'master_1'
  | 'master_2'
  | 'master_3'
  | 'master_4'
  | 'custom';

export type EquipmentDivision =
  | 'raw'
  | 'classic'
  | 'equipped'
  | 'single_ply'
  | 'multi_ply'
  | 'unrestricted';

export type WeighInStatus = 'pending' | 'passed' | 'failed' | 'disqualified';

export type LifterStatus =
  | 'active'
  | 'completed'
  | 'eliminated'
  | 'disqualified'
  | 'withdrawn'
  | 'incomplete';

export interface WeighInRecord {
  id: string;
  attemptNumber: number;
  timestamp: string;
  measuredWeightKg: number;
  officialId: string;
  officialName: string;
  status: WeighInStatus;
  notes?: string;
}

export interface RackHeights {
  squatRackHeight?: number;
  squatSafetyPin?: number;
  benchRackHeight?: number;
  benchSafetyPin?: number;
}

export interface Athlete {
  id: string;
  eventId: string;
  lotNumber: number;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  sex: Sex;
  ageCategory: AgeCategory;
  equipmentDivision: EquipmentDivision;
  teamOrAffiliation?: string;
  declaredWeightCategory: string;
  verifiedWeightCategory?: string;
  officialBodyweightKg?: number;
  weighInRecords: WeighInRecord[];
  weighInStatus: WeighInStatus;
  rackHeights: RackHeights;
  lifterStatus: LifterStatus;
  statusReason?: string;
  flight?: string;
  createdAt: string;
  updatedAt: string;
}

