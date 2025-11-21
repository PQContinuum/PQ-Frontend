import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamAssistantReply } from "@/lib/openai";
import { getUserContextForPrompt } from "@/lib/memory/user-context";
import { getUserPlanName } from "@/lib/subscription";

export async function POST(req: NextRequest) {
    try {
        const { message, messages = [] } = await req.json();

        // ✅ NUEVO: Obtener contexto del usuario
        let userContext = '';
        try {
            const supabase = await createSupabaseServerClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (!authError && user) {
                // Obtener plan del usuario
                const planName = await getUserPlanName(user.id);

                // Obtener contexto personalizado según el plan
                userContext = await getUserContextForPrompt(
                    user.id,
                    planName,
                    message // Mensaje actual para búsqueda relevante
                );
            }
        } catch (contextError) {
            // Si falla la obtención del contexto, continuar sin él
            console.error('Error getting user context:', contextError);
        }

        // Llamar a OpenAI con el contexto del usuario
        const stream = await streamAssistantReply(message, messages, userContext);

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
