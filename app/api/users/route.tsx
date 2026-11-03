import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { users } from "@/config/schema"; // This is the table
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized or email missing" }, { status: 401 });
    }

    const email = user.primaryEmailAddress.emailAddress;

    // 2. Check if user already exists in DB
    const existingUsers = await db.select().from(users).where(eq(users.email, email));

    // 3. If user does not exist, insert new one
    if (existingUsers.length === 0) {
      const newUser = await db
        .insert(users)
        .values({
          email,
          name: user.firstName || "Anonymous", // Change fields as needed
          credits: 10,
        })
        .returning({users: users.id, name: users.name, email: users.email, credits: users.credits, createdAt: users.createdAt});
      return NextResponse.json(newUser[0]?.users);
    }

    // 4. User already exists
    return NextResponse.json(existingUsers[0]);
  } catch (e) {
    console.error("Error in POST /api/user:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
