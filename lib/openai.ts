import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
}

const client = new OpenAI({ apiKey });
const encoder = new TextEncoder();

const formatSSE = (event: string, data: unknown) =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

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

export async function streamAssistantReply(message: string) {
    const sanitizedMessage = message?.trim();
    if (!sanitizedMessage) {
        throw new Error("Message is required");
    }

    const responseStream = client.responses.stream({
        model,
        input: sanitizedMessage,
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

            responseStream.on("event", (event) => {
                enqueue(event.type, event);
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
