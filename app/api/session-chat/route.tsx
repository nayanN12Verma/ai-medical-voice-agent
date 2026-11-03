import { SessionChatTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@/config/db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";


export async function POST(req: NextRequest) {
  try {
    const { notes, selectedDoctor } = await req.json();
    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = uuidv4();

    const result = await db
      .insert(SessionChatTable)
      .values({
        sessionId: sessionId,
        createdBy: user.primaryEmailAddress.emailAddress,
        notes: notes,
        report: null, // optional fields if not passed
        conversation: null,
        selectedDoctor: selectedDoctor,
        createdon: new Date(), // keep as Date, not string
      })
      .returning();

    return NextResponse.json({
      sessionId,
      data: result[0], // return only first inserted row
    });

  } catch (e) {
    console.error("Error inserting session chat:", e);
    return NextResponse.json({ error: "Failed to insert session chat" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const user = await currentUser();

  if(sessionId == 'all'){
    const result = await db.select().from(SessionChatTable)
    // @ts-ignore
    .where(eq(SessionChatTable.createdBy,user?.primaryEmailAddress?.emailAddress))
    .orderBy(desc(SessionChatTable.id))

    return NextResponse.json(result);
  }else{
    const result = await db.select().from(SessionChatTable)
    // @ts-ignore
    .where(eq(SessionChatTable.sessionId,sessionId))

    return NextResponse.json(result[0]);
  }
}