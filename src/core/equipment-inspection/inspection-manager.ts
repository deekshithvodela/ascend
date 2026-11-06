import { EquipmentChecklistItem } from '../types/competition';

export type InspectionStatus = 'pass' | 'fail' | 'na';

export interface InspectionRecord {
  itemId: string;
  athleteId: string;
  status: InspectionStatus;
  inspectorName: string;
  inspectorId: string;
  timestamp: string;
  notes?: string;
}

export class EquipmentInspectionManager {
  /**
   * Evaluates overall athlete equipment clearance.
   */
  public static evaluateClearance(
    checklist: EquipmentChecklistItem[],
    records: InspectionRecord[]
  ): { isCleared: boolean; failedItems: string[]; pendingItems: string[] } {
    const recordMap = new Map(records.map((r) => [r.itemId, r]));

    const failedItems: string[] = [];
    const pendingItems: string[] = [];

    for (const item of checklist) {
      const record = recordMap.get(item.id);
      if (!record) {
        if (item.required) {
          pendingItems.push(item.name);
        }
      } else if (record.status === 'fail') {
        failedItems.push(item.name);
      }
    }

    const isCleared = failedItems.length === 0 && pendingItems.length === 0;

    return {
      isCleared,
      failedItems,
      pendingItems,
    };
  }
}

