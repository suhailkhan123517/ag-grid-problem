import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const students = await db.students.findMany({
      orderBy: {
        first_name: "asc",
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.log("error :>> ", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
