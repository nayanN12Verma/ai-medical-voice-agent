import { openai } from "@/config/openAi";
import { AIDoctorAgents } from "@/shared/list";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful medical AI. Based on symptoms, choose the TWO most suitable doctor IDs from this list: ${JSON.stringify(
            AIDoctorAgents
          )}. Return only their IDs.`,
        },
        {
          role: "user",
          content: `User notes/symptoms: ${notes}. Based on this, return a JSON object in this format: { "doctors": [id1, id2] }`,
        },
      ],
    });

    const rawContent = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(rawContent);

    const matchedDoctors = AIDoctorAgents.filter((doc) =>
      parsed.doctors?.includes(doc.id)
    );

    if (!matchedDoctors.length) {
      return NextResponse.json({ error: "No matching doctors found" }, { status: 404 });
    }

    return NextResponse.json(matchedDoctors); // send array of matched doctors
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ error: "Failed to suggest doctors" }, { status: 500 });
  }
}
