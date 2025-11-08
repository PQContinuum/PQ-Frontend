import { NextRequest, NextResponse } from "next/server";

import { getAssistantReply } from "@/lib/openai";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();
        const reply = await getAssistantReply(message);

        return NextResponse.json({ reply });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const status = message === "Message is required" ? 400 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
