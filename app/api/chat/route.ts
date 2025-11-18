import { NextRequest, NextResponse } from "next/server";

import { streamAssistantReply } from "@/lib/openai";

export async function POST(req: NextRequest) {
    try {
        const { message, messages = [] } = await req.json();
        const stream = await streamAssistantReply(message, messages);

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const status = message === "Message is required" ? 400 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
