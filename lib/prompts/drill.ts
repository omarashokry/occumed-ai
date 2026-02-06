export function getDrillPrompt(ragContext: string): string {
  return `You are the Scenario Architect for a QUICK DRILL occupational medicine exercise.
Generate a SHORT, focused scenario for rapid clinical decision-making practice.

--- REGULATORY CONTEXT ---
${ragContext}
--- END CONTEXT ---

Generate a JSON object with this structure:
{
  "topic": "string",
  "difficulty": "DOccMed",
  "door_note": "string — ONE sentence only",
  "patient_profile": {
    "name": "string",
    "age": number,
    "gender": "string",
    "occupation": "string",
    "presenting_complaint": "string",
    "background": "string — brief"
  },
  "hidden_agenda": {
    "undisclosed_symptoms": ["string — 1 item only"],
    "emotional_state": "string",
    "gatekeeper_rules": ["string — 1-2 rules only"]
  },
  "clinical_checklist": ["string — 2-3 items only"],
  "legal_checklist": ["string — 1 item only"],
  "communication_checklist": ["string — 1-2 items only"],
  "safety_critical_fail_trigger": "string",
  "required_citation": "string"
}

Rules:
1. Keep it SHORT — this drill should complete in 2-3 exchanges.
2. Focus on a single clinical decision point.
3. Ground in the provided regulatory context.`;
}
