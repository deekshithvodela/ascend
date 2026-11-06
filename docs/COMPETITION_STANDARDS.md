# Powerlifting Competition Standards & Technical Compliance Guide

Ascend provides native support for two distinct competition philosophies:
1. **Ascend Open Mode**: An unconstrained, highly adaptable format built for recreational meets, gym competitions, and local leagues.
2. **IPF Competition Mode**: A formal, federation-grade rules engine adhering to the official **IPF Technical Rulebook**.

This document specifies the exact technical requirements, judging workflows, scoring criteria, and tie-breaking procedures for each format.

---

## 1. Technical Standards Comparison Matrix

| Standard / Procedure | Ascend Open Mode | IPF Competition Mode |
| :--- | :--- | :--- |
| **Weight Categories** | Optional. Open-weight competition by default. | Mandatory official IPF weight categories. |
| **Primary Leaderboard Metric** | **Bodyweight Ratio** ($\frac{\text{Total Lifted}}{\text{Bodyweight}}$) | **Weight-Category Total Lifted Weight** |
| **Secondary Metrics** | Total weight, DOTS, Wilks | DOTS points (display only; never alters ranking) |
| **Weigh-In Period** | Flexible. Self-reported or measured. | Strict official 2-hour window prior to lifting. |
| **Re-Weighing** | Permitted at organizer discretion. | Permitted within official 2-hour window only. |
| **Platform Judging** | Single operator, multi-judge, or 3 referees. | **Three independent referees** (Chief, Left, Right). |
| **Majority Decision Rule** | 1 operator or configurable threshold. | **2 or 3 White Lights** = Good Lift; **2 or 3 Red Lights** = No Lift. |
| **Technical Red-Card Reasons**| Optional. | Mandatory lift-specific infraction codes. |
| **Scorekeeper Overrides** | Allowed by platform operator. | **Prohibited.** Authorized Jury / Chief correction only. |
| **Attempt Scheduling** | Simple sequential queue or rounds. | **Round-based flights** (maximum 14 lifters). |
| **Lifting Order Tie-Breaker** | Operator selection or lot number. | **Lower lot number lifts first** on identical weights. |
| **Attempt Weight Changes** | Flexible. | 2nd attempt locked; **3rd attempt deadlift permits 2 changes**. |
| **Three Misses in One Lift** | Subtotal reflects successful lifts. | **Automatic elimination from the total** (subtotal = 0). |
| **Single-Lift Award Eligibility**| Configurable. | Lifters eliminated from total remain eligible for single lift medals. |
| **Tie-Breaking Sequence** | 1. Bodyweight Ratio<br>2. Higher Total<br>3. Lower Bodyweight | 1. **Higher Total**<br>2. **Lower Official Bodyweight**<br>3. **Order of Achievement / Lot #** |
| **Substitution of Formulas** | Permitted. | **Strictly prohibited.** Total weight is authoritative. |

---

## 2. Ascend Open Mode Specification

### 2.1 Philosophy
Ascend Open Mode is designed for maximum accessibility. It eliminates arbitrary weight cutting and rigid category restrictions, allowing athletes of all bodyweights to compete fairly on a single leaderboard using bodyweight ratio.

### 2.2 Bodyweight Ratio Scoring Formula
$$\text{Bodyweight Ratio} = \frac{\text{Total Successful Lifted Weight (kg)}}{\text{Official Competition Bodyweight (kg)}}$$

#### Calculation Constraints (Section 21.3.D):
1. **Completion Requirement**: A finalized bodyweight ratio is never calculated until all contested lifts are completed. Provisional ratios may be displayed during the meet.
2. **Ineligibility Guard**: If an athlete is eliminated, disqualified, or withdraws, their ratio is invalidated.
3. **Configurable Precision**: Rounded to 2 decimal places by default using standard half-up rounding.

---

## 3. IPF Competition Mode Specification

### 3.1 Rulebook Authority & Disclaimer
- **Authoritative Reference**: International Powerlifting Federation (IPF) Technical Rules Book (Version `IPF-2024.1.0`, Effective 2024-01-01).
- **Official Source**: [https://www.powerlifting.sport/rules/codes/info/technical-rules](https://www.powerlifting.sport/rules/codes/info/technical-rules)
- **Compliance Disclaimer**: Implementing these procedures does not itself confer IPF sanctioning, certification, or official recognition. Actual compliance must be validated against the applicable federation requirements and conducted by qualified competition officials.

### 3.2 Official Weight Categories

#### Men's Divisions:
- **53.0 kg** (Sub-Junior and Junior championships only)
- **59.0 kg** (Up to 59.00 kg)
- **66.0 kg** (59.01 kg to 66.00 kg)
- **74.0 kg** (66.01 kg to 74.00 kg)
- **83.0 kg** (74.01 kg to 83.00 kg)
- **93.0 kg** (83.01 kg to 93.00 kg)
- **105.0 kg** (93.01 kg to 105.00 kg)
- **120.0 kg** (105.01 kg to 120.00 kg)
- **120.0+ kg** (120.01 kg and above, unlimited)

#### Women's Divisions:
- **43.0 kg** (Sub-Junior and Junior championships only)
- **47.0 kg** (Up to 47.00 kg)
- **52.0 kg** (47.01 kg to 52.00 kg)
- **57.0 kg** (52.01 kg to 57.00 kg)
- **63.0 kg** (57.01 kg to 63.00 kg)
- **69.0 kg** (63.01 kg to 69.00 kg)
- **76.0 kg** (69.01 kg to 76.00 kg)
- **84.0 kg** (76.01 kg to 84.00 kg)
- **84.0+ kg** (84.01 kg and above, unlimited)

---

## 4. Official 3-Referee Judging System & Technical Codes

### 4.1 Referee Roles & Decision Consensus
The referee panel consists of:
1. **Chief Referee** (Positioned center, in front of the platform; gives audible and visual signals: "Squat", "Rack", "Press", "Down").
2. **Left-Side Referee** (Positioned to the left of the platform).
3. **Right-Side Referee** (Positioned to the right of the platform).

Each referee submits an independent **Good Lift (White Card)** or **No Lift (Red Card)** decision. A majority of 2 or 3 white lights determines a Good Lift.

### 4.2 IPF Technical Infraction Reason Codes

#### Squat Infractions:
- **`SQ-01` (Red Card — Depth)**: Failure to bend the knees and lower the body until the top surface of the legs at the hip joint is lower than the top of the knees.
- **`SQ-02` (Blue Card — Movement)**: Double bounce or more than one downward movement during the ascent.
- **`SQ-03` (Blue Card — Lockout)**: Failure to assume an upright position with knees locked at start or finish.
- **`SQ-04` (Yellow Card — Footwork)**: Any stepping backward, forward, or lateral movement of the feet.
- **`SQ-05` (Yellow Card — Signals)**: Failure to wait for Chief Referee's signal ("Squat" or "Rack").
- **`SQ-06` (Yellow Card — Spotters)**: Contact of bar or lifter with spotters/loaders during the lift.

#### Bench Press Infractions:
- **`BP-01` (Yellow Card — Signals)**: Failure to wait for Chief Referee's signal ("Start", "Press", or "Rack").
- **`BP-02` (Blue Card — Chest Motion)**: Bouncing bar off chest or sinking into chest after the motionless pause.
- **`BP-03` (Blue Card — Downward Movement)**: Any downward movement of the bar during the upward press toward lockout.
- **`BP-04` (Red Card — Lockout)**: Failure to press the bar to full extension with elbows locked simultaneously.
- **`BP-05` (Yellow Card — Position)**: Lifting buttocks off the bench or lateral foot movement.
- **`BP-06` (Yellow Card — Uprights)**: Bar contact with rack uprights that assists the lifter.

#### Deadlift Infractions:
- **`DL-01` (Red Card — Lockout)**: Failure to lock the knees upright and bring shoulders back at completion.
- **`DL-02` (Blue Card — Downward Movement)**: Any downward movement of the bar before reaching final locked position.
- **`DL-03` (Blue Card — Hitching)**: Supporting the bar on the thighs during ascent ("hitching").
- **`DL-04` (Yellow Card — Footwork)**: Stepping backward or forward during the lift.
- **`DL-05` (Yellow Card — Control)**: Lowering bar before Chief Referee's signal ("Down"), or dropping the bar without maintaining two-handed control.

---

## 5. Official IPF Tie-Breaking Sequence

When two or more lifters in the same weight category record the same total weight lifted, the winner is determined strictly by:

1. **Higher Total Weight**: The lifter who achieved the higher total lifted weight wins.
2. **Lower Official Bodyweight**: If totals are identical, the lifter who weighed in lighter at the official weigh-in wins (e.g. 82.10 kg beats 82.60 kg).
3. **Order of Achievement / Lot Number**: If both total and bodyweight are identical, the lifter who achieved the total earlier (or who had the lower lot number) is declared the winner.

> [!CAUTION]
> **Strict Federation Prohibition:** Bodyweight ratio, DOTS, and Wilks formulas must **never** be substituted for official IPF ranking. They may only be displayed as supplemental display statistics.

