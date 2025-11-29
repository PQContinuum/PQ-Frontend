import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { pqChatInstructions } from "@/lib/pq-instructions";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4-turbo";

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
}

const client = new OpenAI({ apiKey });

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

/**
 * Creates an array of messages in the format expected by the Chat Completions API.
 */
function buildMessages(
    message: string,
    history: ChatMessage[] = [],
    userContext?: string
): ChatCompletionMessageParam[] {
    const finalInstructions = userContext
        ? `${pqChatInstructions}\n\n${userContext}`
        : pqChatInstructions;

    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: finalInstructions,
        },
    ];

    // Add historical messages
    for (const msg of history) {
        if (msg.role && msg.content) {
            messages.push({ role: msg.role, content: msg.content });
        }
    }

    // Add the current user message
    messages.push({
        role: "user",
        content: message,
    });

    return messages;
}

/**
 * Returns a streaming reply from the OpenAI Chat Completions API.
 */
export async function streamAssistantReply(
    message: string,
    history: ChatMessage[] = [],
    userContext?: string
) {
    const messages = buildMessages(message, history, userContext);

    const stream = await client.chat.completions.create({
        model,
        messages,
        stream: true,
    });

    const readableStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || "";
                if (delta) {
                    // This format is compatible with the original SSE format expected by the client
                    const formattedChunk = `event: response.output_text.delta\ndata: ${JSON.stringify({ delta })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(formattedChunk));
                }
            }
            controller.close();
        },
    });

    return readableStream;
}

/**
 * Returns a complete, non-streaming reply from the OpenAI Chat Completions API.
 */
export async function getAssistantReply(
    message: string,
    history: ChatMessage[] = [],
    userContext?: string
): Promise<string> {
    const messages = buildMessages(message, history, userContext);

    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            stream: false, // Ensure streaming is off
        });

        const content = response.choices[0]?.message?.content;

        if (content) {
            // Handle potential markdown code blocks for JSON
            if (content.trim().startsWith('```json')) {
                return content.replace(/```json\n|```/g, '').trim();
            }
            return content;
        }

        console.error("OpenAI response did not contain valid content:", JSON.stringify(response, null, 2));
        throw new Error("No content received from OpenAI.");

    } catch (error) {
        console.error("Error getting assistant reply from Chat Completions API:", error);
        throw new Error("Failed to get response from OpenAI.");
    }
}
