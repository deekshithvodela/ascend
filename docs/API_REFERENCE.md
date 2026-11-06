# Ascend REST API Reference

The Ascend Competition Management API powers competition operations, rules configuration, attempt queuing, live 3-referee judging, and official document generation.

**Base URL**: `http://localhost:3001/api` (Local) or `<SUPABASE_URL>/functions/v1/api` (Production)  
**Content-Type**: `application/json`

---

## 1. Events & Rules Configuration

### 1.1 List Competition Events
```http
GET /api/events
```
**Response (200 OK)**:
```json
[
  {
    "id": "evt-ipf-nationals",
    "name": "National Powerlifting Championship",
    "date": "2024-09-15",
    "venue": "National Sports Center, Main Arena",
    "organizer": "National Powerlifting Federation",
    "status": "in_progress",
    "rulesSnapshot": {
      "profileId": "ipf_inspired",
      "profileName": "IPF Technical Competition Mode",
      "profileVersion": "2024.1.0",
      "federationRulebookVersion": "IPF Technical Rules Book 2024 (v1.0)",
      "isFederationCompliant": true,
      "primaryRankingMetric": "weight_category_total",
      "judgingMode": "three_referee"
    }
  }
]
```

### 1.2 Get Single Event
```http
GET /api/events/:id
```

### 1.3 Create Competition Event
```http
POST /api/events
```
**Payload**:
```json
{
  "name": "State Open Invitational",
  "venue": "Ironworks Gym",
  "organizer": "State Powerlifting Association",
  "profileId": "ascend_open",
  "date": "2024-11-20"
}
```

### 1.4 Update Event Rules
```http
PUT /api/events/:id/rules
```
**Payload**: Complete `CompetitionRules` object.  
**Validation**: Evaluates rules against `RulesDependencyValidator`. Returns HTTP 400 with `errors`, `warnings`, and `autoFixSuggestions` if dependencies conflict.

### 1.5 Finalize & Lock Event
```http
POST /api/events/:id/finalize
```
**Payload**:
```json
{
  "finalizedBy": "Jury President Dr. Vance"
}
```
**Effect**: Locks event status to `finalized`. Subsequent rule edits return HTTP 403. Appends `EVENT_FINALIZED` to audit trail.

---

## 2. Athlete Registration & Weigh-In

### 2.1 List Athletes
```http
GET /api/events/:id/athletes
```

### 2.2 Register Athlete
```http
POST /api/events/:id/athletes
```
**Payload**:
```json
{
  "firstName": "Alexander",
  "lastName": "Cole",
  "sex": "M",
  "ageCategory": "open",
  "equipmentDivision": "raw",
  "teamOrAffiliation": "Northern Barbell Club",
  "declaredWeightCategory": "83 kg"
}
```

### 2.3 Record Official Weigh-In
```http
POST /api/events/:id/athletes/:athleteId/weigh-in
```
**Payload**:
```json
{
  "measuredWeightKg": 82.60,
  "officialId": "ref-sterling",
  "officialName": "Referee Arthur Sterling",
  "notes": "Verified on calibrated digital platform scale"
}
```
**Response (200 OK)**:
```json
{
  "athlete": {
    "id": "ath-ipf-1",
    "officialBodyweightKg": 82.6,
    "weighInStatus": "passed"
  },
  "evaluation": {
    "status": "passed",
    "verifiedCategory": "83 kg",
    "isEligible": true,
    "message": "Verified bodyweight 82.6 kg within 83 kg limits."
  }
}
```

### 2.4 Update Platform Rack Heights
```http
PUT /api/events/:id/athletes/:athleteId/rack-heights
```
**Payload**:
```json
{
  "squatRackHeight": 13,
  "benchRackHeight": 11,
  "squatSafetyPin": 7,
  "benchSafetyPin": 5
}
```

---

## 3. Attempt Queuing & 3-Referee Judging

### 3.1 Declare / Change Attempt Weight
```http
POST /api/events/:id/attempts
```
**Payload**:
```json
{
  "athleteId": "ath-ipf-1",
  "liftType": "squat",
  "attemptNumber": 1,
  "weightKg": 225.0
}
```
*Note: If updating an existing attempt, deadline validation rules (including the 2-change limit on Deadlift 3rd attempt) are enforced.*

### 3.2 Cast Referee Decision Vote
```http
POST /api/events/:id/attempts/:attemptId/vote
```
**Payload**:
```json
{
  "refereeId": "ref-left",
  "refereeName": "Maria Santos",
  "refereeRole": "left",
  "decision": "no_lift",
  "infractionReasonCodes": ["SQ-01"]
}
```
*Note: When all 3 referee votes are cast, the server automatically computes the majority decision (2-1 or 3-0).*

### 3.3 Authorized Jury / Chief Referee Override
```http
POST /api/events/:id/attempts/:attemptId/override
```
**Payload**:
```json
{
  "overriddenDecision": "good_lift",
  "authorizedBy": "Jury President Dr. Vance",
  "reason": "Video review confirmed bar reached full lockout simultaneously."
}
```

### 3.4 Get Live Platform Queue & Plate Loading
```http
GET /api/events/:id/platform-queue?liftType=squat&round=1
```
**Response (200 OK)**:
```json
{
  "queue": {
    "currentLifter": { "athlete": { "firstName": "Alexander", "lastName": "Cole" }, "attempt": { "weightKg": 225.0 } },
    "onDeck": { "athlete": { "firstName": "Benjamin", "lastName": "Kim" }, "attempt": { "weightKg": 235.0 } },
    "inTheHole": { "athlete": { "firstName": "Marcus", "lastName": "O'Connor" }, "attempt": { "weightKg": 240.0 } },
    "completedCount": 0,
    "totalInRound": 3
  },
  "plateLoading": {
    "barbellWeightKg": 20,
    "collarsWeightKg": 5,
    "totalWeightKg": 225,
    "platesPerSide": [
      { "weightKg": 25, "count": 4, "color": "Red" }
    ]
  }
}
```

---

## 4. Standings & Official Documentation

### 4.1 Get Standings & Results
```http
GET /api/events/:id/results
```
Returns category standings, overall open standings, single-lift awards, team points, and explanatory tie-break notes for each competitor.

### 4.2 Render Official Sheet / Export CSV
```http
GET /api/events/:id/sheets/:sheetType
```
Supported `:sheetType` parameters:
- `score-sheet`: Formatted HTML of the official competition score sheet.
- `weigh-in`: Formatted HTML of the official weigh-in record sheet.
- `referee-records`: Formatted HTML breakdown of all 3 lights and infraction codes.
- `csv-results`: Downloadable CSV of official standings and attempts.
- `csv-weighin`: Downloadable CSV of verified weigh-in records.

---

## 5. Audit Trail

### 5.1 Query Event Audit Logs
```http
GET /api/events/:id/audit
```
Returns an append-only array of all recorded actions with actor IDs, roles, timestamps, and justifications.

