import { CompetitionRules, CompetitionProfileId } from '../types/competition';
import { ASCEND_OPEN_PROFILE } from './ascend-open.profile';
import { IPF_COMPETITION_PROFILE, IPF_STANDARD_CATEGORIES, IPF_STANDARD_EQUIPMENT_CHECKLIST } from './ipf-technical.profile';
import { CUSTOM_COMPETITION_PROFILE } from './custom.profile';

export * from './ascend-open.profile';
export * from './ipf-technical.profile';
export * from './custom.profile';

export const PREDEFINED_PROFILES: Record<CompetitionProfileId, CompetitionRules> = {
  ascend_open: ASCEND_OPEN_PROFILE,
  ipf_inspired: IPF_COMPETITION_PROFILE,
  custom: CUSTOM_COMPETITION_PROFILE,
};

export function getProfileTemplate(profileId: CompetitionProfileId): CompetitionRules {
  const profile = PREDEFINED_PROFILES[profileId] || ASCEND_OPEN_PROFILE;
  // Return deep clone so caller cannot mutate templates
  return JSON.parse(JSON.stringify(profile));
}

