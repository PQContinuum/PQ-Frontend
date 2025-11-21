import OpenAI from "openai";
import type { ResponseInput } from "openai/resources/responses/responses";
import { pqChatInstructions } from "@/lib/pq-instructions";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4-turbo";

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
}

const client = new OpenAI({ apiKey });
const encoder = new TextEncoder();

const formatSSE = (event: string, data: unknown) =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

type ContentBlock = { type: "input_text"; text: string };

const toError = (value: unknown) => {
    if (value instanceof Error) return value;
    if (value && typeof value === "object" && "message" in value) {
        const message =
            typeof (value as { message?: unknown }).message === "string"
                ? (value as { message: string }).message
                : "OpenAI stream error";
        return new Error(message);
    }
    return new Error(typeof value === "string" ? value : "OpenAI stream error");
};

const toInputMessages = (history: ChatMessage[], fallback: string): string | ResponseInput => {
    if (!history.length) {
        return fallback;
    }

    const messages = history.reduce<ResponseInput>((acc, entry) => {
        const text = entry.content?.trim();
        if (!text) return acc;
        if (entry.role !== "user") return acc; // Responses API input only accepts user/system/developer
        acc.push({
            role: entry.role,
            content: [
                {
                    type: "input_text",
                    text,
                },
            ],
            type: "message",
        });
        return acc;
    }, []);

    return messages;
};

export async function streamAssistantReply(
    message: string,
    history: ChatMessage[] = [],
    userContext?: string  // ← NUEVO: Contexto del usuario (opcional)
) {
    const sanitizedMessage = message?.trim();
    if (!sanitizedMessage && !history.length) {
        throw new Error("Message is required");
    }

    const input = toInputMessages(history, sanitizedMessage);

    // Combinar instrucciones base con contexto del usuario (si existe)
    const finalInstructions = userContext
        ? `${pqChatInstructions}\n\n${userContext}`
        : pqChatInstructions;

    const responseStream = client.responses.stream({
        model,
        input,
        instructions: finalInstructions,  // ← Usar instrucciones combinadas
    });

    return new ReadableStream<Uint8Array>({
        start(controller) {
            let closed = false;

            const enqueue = (event: string, payload: unknown) => {
                if (closed) return;
                controller.enqueue(encoder.encode(formatSSE(event, payload)));
            };

            const closeStream = () => {
                if (closed) return;
                closed = true;
                controller.close();
            };

            const errorStream = (error: Error | string) => {
                if (closed) return;
                const message = error instanceof Error ? error.message : error;
                enqueue("error", { message });
                closed = true;
                controller.error(error instanceof Error ? error : new Error(message));
            };

            responseStream.on("response.output_text.delta", (event) => {
                enqueue("response.output_text.delta", { delta: event.delta });
            });

            responseStream.on("response.completed", () => {
                enqueue("response.completed", {});
                closeStream();
            });

            responseStream.on("response.failed", (event) => {
                const message =
                    (event.response as { error?: { message?: string } })?.error?.message ??
                    "OpenAI response failed";
                errorStream(message);
            });

            responseStream.on("end", () => {
                closeStream();
            });

            responseStream.on("error", (err) => {
                errorStream(toError(err));
            });

            responseStream.on("abort", (err) => {
                const reason =
                    err instanceof Error ? err : new Error("OpenAI stream aborted");
                errorStream(reason);
            });

            void responseStream.finalResponse().catch((err) => {
                errorStream(toError(err));
            });
        },
        cancel() {
            responseStream.abort();
        },
    });
}
