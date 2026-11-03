// /api/generate-report.ts

import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/config/openAi";
import { SessionChatTable } from "@/config/schema";
import { db } from "@/config/db";
import { eq } from "drizzle-orm";

const REPORT_GEN_PROMPT = `You are an AI Medical Voice Agent that has just completed a consultation. Based on the doctor agent info and the conversation between the user and agent, extract and return the following details:

sessionId – A unique identifier for the session
agent – The name of the medical specialist (e.g., “General Physician AI”)
user – Name of the patient, or "Anonymous" if not provided
timestamp – Current date and time in ISO 8601 format
chiefComplaint – One-sentence summary of the user’s main health concern
summary – 2–3 sentence summary of the consultation, symptoms discussed, and key information
symptoms – List of symptoms mentioned by the user
duration – Duration for which the symptoms have been present
severity – Severity of symptoms: “mild”, “moderate”, or “severe”
medicationsMentioned – List of any medications the user mentioned
recommendations – List of AI suggestions (e.g., rest, consult a doctor, take a test)

Return the output strictly in the following JSON format (with only valid and available fields):
{
  "sessionId": "string",
  "agent": "string",
  "user": "string",
  "timestamp": "ISO Date string",
  "chiefComplaint": "string",
  "summary": "string",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "string",
  "severity": "mild | moderate | severe",
  "medicationsMentioned": ["med1", "med2"],
  "recommendations": ["rec1", "rec2"]
}
Respond with only the valid JSON. Do not include any extra explanation or formatting.
`;

export async function POST(req: NextRequest) {
    try {
      const { sessionId, sessionDetails, messages } = await req.json();
  
      const UserInput =
        "AI Doctor Agent info: " + JSON.stringify(sessionDetails) +
        "\nUser messages: " + JSON.stringify(messages);
  
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: REPORT_GEN_PROMPT },
          { role: "user", content: UserInput },
        ],
      });
  
      const rawContent = completion.choices[0]?.message?.content || "{}";
  
      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (parseErr) {
        console.error("❌ JSON parsing failed:", rawContent);
        return NextResponse.json(
          { error: "Invalid JSON format from OpenAI" },
          { status: 500 }
        );
      }
  
      // ✅ Only update the report
      await db
        .update(SessionChatTable)
        .set({ report: parsed })
        .where(eq(SessionChatTable.sessionId, sessionId));
  
      return NextResponse.json(parsed);
    } catch (error) {
      console.error("❌ Report generation error:", error);
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 }
      );
    }
  }