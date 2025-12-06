import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionContentPart } from "openai/resources/chat/completions";
import { getPqChatInstructions } from "@/lib/pq-instructions";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4o"; // Changed to gpt-4o for vision support

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
}

const client = new OpenAI({ apiKey });

export type ChatMessage = {
    role: "user" | "assistant";
    content: string | ChatCompletionContentPart[]; // Support multimodal content
};

export type AttachmentInput = {
    type: 'image' | 'document';
    url: string;
    mimeType: string;
};

/**
 * Build message content with attachments
 */
async function buildMessageContent(
    message: string,
    attachments?: AttachmentInput[]
): Promise<string | ChatCompletionContentPart[]> {
    if (!attachments || attachments.length === 0) {
        return message;
    }

    const contentParts: ChatCompletionContentPart[] = [
        { type: "text", text: message },
    ];

    // Process attachments
    for (const attachment of attachments) {
        if (attachment.type === 'image') {
            // Add image as image_url
            contentParts.push({
                type: "image_url",
                image_url: {
                    url: attachment.url,
                    detail: "high", // Use "high" for detailed analysis, "low" for speed
                },
            });
        } else if (attachment.type === 'document') {
            // For text documents, fetch and add content as text
            if (attachment.mimeType === 'text/plain' || attachment.mimeType === 'text/markdown') {
                try {
                    const response = await fetch(attachment.url);
                    if (response.ok) {
                        const textContent = await response.text();
                        contentParts.push({
                            type: "text",
                            text: `\n\n--- Contenido del archivo "${attachment.url.split('/').pop()}" ---\n${textContent}\n--- Fin del archivo ---\n`,
                        });
                    }
                } catch (error) {
                    console.error(`Error reading document ${attachment.url}:`, error);
                    contentParts.push({
                        type: "text",
                        text: `\n[Error: No se pudo leer el archivo]\n`,
                    });
                }
            } else if (attachment.mimeType === 'application/pdf') {
                // For PDFs, add a note that it's a PDF (future: extract text)
                contentParts.push({
                    type: "text",
                    text: `\n[Archivo PDF adjunto: ${attachment.url.split('/').pop()}]\n`,
                });
            }
        }
    }

    return contentParts;
}

/**
 * Creates an array of messages in the format expected by the Chat Completions API.
 */
async function buildMessages(
    message: string,
    history: ChatMessage[] = [],
    userContext?: string,
    attachments?: AttachmentInput[]
): Promise<ChatCompletionMessageParam[]> {
    // Obtener instrucciones con fecha actual
    const baseInstructions = getPqChatInstructions();

    const finalInstructions = userContext
        ? `${baseInstructions}\n\n${userContext}`
        : baseInstructions;

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

    // Add the current user message with attachments
    messages.push({
        role: "user",
        content: await buildMessageContent(message, attachments),
    });

    return messages;
}

/**
 * Returns a streaming reply from the OpenAI Chat Completions API with vision support.
 */
export async function streamAssistantReply(
    message: string,
    history: ChatMessage[] = [],
    userContext?: string,
    attachments?: AttachmentInput[]
) {
    const messages = await buildMessages(message, history, userContext, attachments);

    const stream = await client.chat.completions.create({
        model,
        messages,
        stream: true,
        max_tokens: attachments && attachments.length > 0 ? 4096 : undefined, // Increase for vision
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
 * Returns a complete, non-streaming reply with vision support.
 */
export async function getAssistantReply(
    message: string,
    history: ChatMessage[] = [],
    userContext?: string,
    attachments?: AttachmentInput[]
): Promise<string> {
    const messages = await buildMessages(message, history, userContext, attachments);

    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            stream: false, // Ensure streaming is off
            max_tokens: attachments && attachments.length > 0 ? 4096 : undefined,
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
