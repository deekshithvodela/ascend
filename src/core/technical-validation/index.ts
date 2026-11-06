import { TechnicalInfractionCode } from '../types/judging';

export type { TechnicalInfractionCode };

export const IPF_SQUAT_INFRACTIONS: TechnicalInfractionCode[] = [
  {
    code: 'SQ-01',
    liftType: 'squat',
    cardColor: 'red',
    title: 'Insufficient Depth',
    description: 'Failure to bend the knees and lower the body until the top surface of the legs at the hip joint is lower than the top of the knees.',
    rulebookSection: 'IPF Rulebook - Squat Causes for Disqualification 1',
  },
  {
    code: 'SQ-02',
    liftType: 'squat',
    cardColor: 'blue',
    title: 'Double Bounce / Downward Motion',
    description: 'Double bouncing or more than one downward movement during the ascent from the bottom of the squat.',
    rulebookSection: 'IPF Rulebook - Squat Causes for Disqualification 2',
  },
  {
    code: 'SQ-03',
    liftType: 'squat',
    cardColor: 'blue',
    title: 'Failure to Lock Out Knees / Erect Position',
    description: 'Failure to assume an upright position with the knees locked at the commencement and at the completion of the lift.',
    rulebookSection: 'IPF Rulebook - Squat Causes for Disqualification 3',
  },
  {
    code: 'SQ-04',
    liftType: 'squat',
    cardColor: 'yellow',
    title: 'Stepping / Foot Movement',
    description: 'Any stepping backward or forward or lateral movement of the feet after the lift commences.',
    rulebookSection: 'IPF Rulebook - Squat Causes for Disqualification 4',
  },
  {
    code: 'SQ-05',
    liftType: 'squat',
    cardColor: 'yellow',
    title: 'Chief Referee Signal Violation',
    description: 'Failure to wait for the Chief Referee’s signal to start the lift ("Squat") or to rack the bar ("Rack").',
    rulebookSection: 'IPF Rulebook - Squat Causes for Disqualification 5',
  },
  {
    code: 'SQ-06',
    liftType: 'squat',
    cardColor: 'yellow',
    title: 'Spotter Contact',
    description: 'Contact of the bar or the lifter with the spotters/loaders during the lift without referee call.',
    rulebookSection: 'IPF Rulebook - Squat Causes for Disqualification 6',
  },
];

export const IPF_BENCH_INFRACTIONS: TechnicalInfractionCode[] = [
  {
    code: 'BP-01',
    liftType: 'bench_press',
    cardColor: 'yellow',
    title: 'Signal Violation (Start / Press / Rack)',
    description: 'Failure to wait for the Chief Referee’s signal at the start ("Start"), during the motionless pause ("Press"), or to rack ("Rack").',
    rulebookSection: 'IPF Rulebook - Bench Press Causes for Disqualification 1',
  },
  {
    code: 'BP-02',
    liftType: 'bench_press',
    cardColor: 'blue',
    title: 'Bouncing / Sinking into Chest',
    description: 'Bouncing the bar off the chest, or sinking the bar into the chest after it has become motionless.',
    rulebookSection: 'IPF Rulebook - Bench Press Causes for Disqualification 2',
  },
  {
    code: 'BP-03',
    liftType: 'bench_press',
    cardColor: 'blue',
    title: 'Downward Movement of Bar',
    description: 'Any downward movement of the whole of the bar during the upward press toward lockout.',
    rulebookSection: 'IPF Rulebook - Bench Press Causes for Disqualification 3',
  },
  {
    code: 'BP-04',
    liftType: 'bench_press',
    cardColor: 'red',
    title: 'Incomplete Lockout / Uneven Extension',
    description: 'Failure to press the bar to full extension of the arms with elbows locked simultaneously at the completion.',
    rulebookSection: 'IPF Rulebook - Bench Press Causes for Disqualification 4',
  },
  {
    code: 'BP-05',
    liftType: 'bench_press',
    cardColor: 'yellow',
    title: 'Buttocks / Head / Feet Movement',
    description: 'Lifting the buttocks off the bench surface or lateral movement of feet during the active lift.',
    rulebookSection: 'IPF Rulebook - Bench Press Causes for Disqualification 5',
  },
  {
    code: 'BP-06',
    liftType: 'bench_press',
    cardColor: 'yellow',
    title: 'Contact with Uprights',
    description: 'Contact of the bar with the rack uprights during the lift which facilitates the lift.',
    rulebookSection: 'IPF Rulebook - Bench Press Causes for Disqualification 6',
  },
];

export const IPF_DEADLIFT_INFRACTIONS: TechnicalInfractionCode[] = [
  {
    code: 'DL-01',
    liftType: 'deadlift',
    cardColor: 'red',
    title: 'Failure to Lock Knees / Shoulders Back',
    description: 'Failure to lock the knees upright and erect, and/or failure to bring the shoulders back at the completion of the lift.',
    rulebookSection: 'IPF Rulebook - Deadlift Causes for Disqualification 1',
  },
  {
    code: 'DL-02',
    liftType: 'deadlift',
    cardColor: 'blue',
    title: 'Downward Movement of Bar',
    description: 'Any downward movement of the bar before it reaches the final locked-out position.',
    rulebookSection: 'IPF Rulebook - Deadlift Causes for Disqualification 2',
  },
  {
    code: 'DL-03',
    liftType: 'deadlift',
    cardColor: 'blue',
    title: 'Supporting Bar on Thighs ("Hitching")',
    description: 'Supporting the bar on the thighs during the performance of the lift ("hitching").',
    rulebookSection: 'IPF Rulebook - Deadlift Causes for Disqualification 3',
  },
  {
    code: 'DL-04',
    liftType: 'deadlift',
    cardColor: 'yellow',
    title: 'Stepping / Foot Movement',
    description: 'Stepping backward or forward or lateral movement of the feet during the lift.',
    rulebookSection: 'IPF Rulebook - Deadlift Causes for Disqualification 4',
  },
  {
    code: 'DL-05',
    liftType: 'deadlift',
    cardColor: 'yellow',
    title: 'Early Lowering / Dropping Bar',
    description: 'Lowering the bar before the Chief Referee’s signal ("Down"), or allowing the bar to return to the platform without maintaining control with both hands.',
    rulebookSection: 'IPF Rulebook - Deadlift Causes for Disqualification 5',
  },
];

export const ALL_TECHNICAL_INFRACTIONS = [
  ...IPF_SQUAT_INFRACTIONS,
  ...IPF_BENCH_INFRACTIONS,
  ...IPF_DEADLIFT_INFRACTIONS,
];

export function getInfractionsForLift(liftType: string): TechnicalInfractionCode[] {
  switch (liftType) {
    case 'squat':
      return IPF_SQUAT_INFRACTIONS;
    case 'bench_press':
      return IPF_BENCH_INFRACTIONS;
    case 'deadlift':
      return IPF_DEADLIFT_INFRACTIONS;
    default:
      return [];
  }
}
