import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
}

const client = new OpenAI({ apiKey });

type OutputTextBlock = {
    type: "output_text";
    text: string;
};

type OutputMessage = {
    type: "message";
    content: OutputTextBlock[];
};

function extractTextFromResponse(
    output: Array<OutputMessage | unknown>,
    fallback: string | null | undefined,
) {
    if (fallback?.trim()) return fallback;

    for (const item of output) {
        if ((item as OutputMessage)?.type !== "message") continue;
        const message = item as OutputMessage;
        const block = message.content.find(
            (content): content is OutputTextBlock => content.type === "output_text",
        );
        if (block?.text?.trim()) return block.text;
    }

    throw new Error("Assistant response is missing text content");
}

export async function getAssistantReply(message: string) {
    const sanitizedMessage = message?.trim();
    if (!sanitizedMessage) {
        throw new Error("Message is required");
    }

    const response = await client.responses.create({
        model,
        input: sanitizedMessage,
    });

    return extractTextFromResponse(
        (response.output as Array<OutputMessage | unknown>) ?? [],
        response.output_text,
    );
}
