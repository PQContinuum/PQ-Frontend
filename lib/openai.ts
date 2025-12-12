import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionContentPart } from "openai/resources/chat/completions";
import { getPqChatInstructions } from "@/lib/pq-instructions";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL ?? "gpt-5.2"; // GPT-5.2: Latest flagship model (Dec 2025) - 400K context, best for coding & planning

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
            const fileName = attachment.url.split('/').pop() || 'archivo';

            // Handle PDFs separately (need special parsing)
            if (attachment.mimeType === 'application/pdf') {
                try {
                    const response = await fetch(attachment.url);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    // Check if response is actually PDF content, not HTML error page
                    const contentType = response.headers.get('content-type');
                    if (contentType?.includes('text/html')) {
                        throw new Error('Received HTML instead of PDF content - URL may have expired');
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    // Dynamic import of pdfjs-dist
                    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

                    // Disable worker to avoid compatibility issues
                    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

                    // Load the PDF document
                    const loadingTask = pdfjsLib.getDocument({
                        data: uint8Array,
                        useWorkerFetch: false,
                        isEvalSupported: false,
                        useSystemFonts: true,
                    });
                    const pdfDocument = await loadingTask.promise;

                    let pdfText = '';

                    // Extract text from all pages
                    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                        const page = await pdfDocument.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map((item) => {
                                // TextItem has str property, TextMarkedContent doesn't
                                if ('str' in item) {
                                    return item.str;
                                }
                                return '';
                            })
                            .join(' ');
                        pdfText += pageText + '\n\n';
                    }

                    pdfText = pdfText.trim();

                    if (pdfText) {
                        contentParts.push({
                            type: "text",
                            text: `\n\n--- Contenido del archivo PDF "${fileName}" ---\n${pdfText}\n--- Fin del archivo ---\n`,
                        });
                    } else {
                        contentParts.push({
                            type: "text",
                            text: `\n[Archivo PDF "${fileName}" adjunto - no se pudo extraer texto]\n`,
                        });
                    }
                } catch (error) {
                    console.error(`Error reading PDF ${attachment.url}:`, error);
                    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                    contentParts.push({
                        type: "text",
                        text: `\n[Error al leer el archivo PDF "${fileName}": ${errorMsg}]\n`,
                    });
                }
            } else {
                // Handle Office documents (Word, Excel, PowerPoint, ODT, etc.) with officeparser
                const isOfficeDoc = attachment.mimeType && (
                    attachment.mimeType.includes('wordprocessingml') || // .docx
                    attachment.mimeType.includes('msword') || // .doc
                    attachment.mimeType.includes('spreadsheetml') || // .xlsx
                    attachment.mimeType.includes('ms-excel') || // .xls
                    attachment.mimeType.includes('presentationml') || // .pptx
                    attachment.mimeType.includes('ms-powerpoint') || // .ppt
                    attachment.mimeType.includes('opendocument') || // .odt, .ods, .odp
                    attachment.mimeType.includes('rtf') || // .rtf
                    attachment.mimeType.includes('epub') // .epub
                );

                if (isOfficeDoc) {
                    try {
                        const response = await fetch(attachment.url);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);

                        // Dynamic import of officeparser
                        const officeParser = await import('officeparser');

                        // Extract text from Office document
                        const extractedText = await officeParser.parseOfficeAsync(buffer);
                        const docText = extractedText.trim();

                        // Detect document type
                        let docType = 'documento';
                        if (attachment.mimeType?.includes('word')) docType = 'Word';
                        else if (attachment.mimeType?.includes('excel') || attachment.mimeType?.includes('spreadsheet')) docType = 'Excel';
                        else if (attachment.mimeType?.includes('powerpoint') || attachment.mimeType?.includes('presentation')) docType = 'PowerPoint';
                        else if (attachment.mimeType?.includes('opendocument.text')) docType = 'ODT';
                        else if (attachment.mimeType?.includes('opendocument.spreadsheet')) docType = 'ODS';
                        else if (attachment.mimeType?.includes('opendocument.presentation')) docType = 'ODP';
                        else if (attachment.mimeType?.includes('rtf')) docType = 'RTF';
                        else if (attachment.mimeType?.includes('epub')) docType = 'EPUB';

                        if (docText) {
                            contentParts.push({
                                type: "text",
                                text: `\n\n--- Contenido del documento ${docType} "${fileName}" ---\n${docText}\n--- Fin del documento ---\n`,
                            });
                        } else {
                            contentParts.push({
                                type: "text",
                                text: `\n[Documento ${docType} "${fileName}" adjunto - no se pudo extraer texto]\n`,
                            });
                        }
                    } catch (error) {
                        console.error(`Error reading Office document ${attachment.url}:`, error);
                        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                        contentParts.push({
                            type: "text",
                            text: `\n[Error al leer el documento "${fileName}": ${errorMsg}]\n`,
                        });
                    }
                } else {
                    // For all other text-based documents (TXT, MD, JSON, CSV, XML, HTML, YAML, CSS, SQL, código fuente, etc.)
                    try {
                        const response = await fetch(attachment.url);

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        // Check if response is actually text/binary content, not HTML error page
                        const contentType = response.headers.get('content-type');
                        if (contentType?.includes('text/html') && !attachment.mimeType?.includes('html')) {
                            throw new Error('Received HTML instead of file content - URL may have expired');
                        }

                        const textContent = await response.text();

                        // Detectar tipo de archivo para mejor contexto
                        let fileType = 'texto';
                        if (attachment.mimeType?.includes('json')) fileType = 'JSON';
                        else if (attachment.mimeType?.includes('csv')) fileType = 'CSV';
                        else if (attachment.mimeType?.includes('xml')) fileType = 'XML';
                        else if (attachment.mimeType?.includes('html')) fileType = 'HTML';
                        else if (attachment.mimeType?.includes('yaml')) fileType = 'YAML';
                        else if (attachment.mimeType?.includes('javascript')) fileType = 'JavaScript';
                        else if (attachment.mimeType?.includes('typescript')) fileType = 'TypeScript';
                        else if (attachment.mimeType?.includes('python')) fileType = 'Python';
                        else if (attachment.mimeType?.includes('java')) fileType = 'Java';
                        else if (attachment.mimeType?.includes('markdown')) fileType = 'Markdown';
                        else if (attachment.mimeType?.includes('css')) fileType = 'CSS';
                        else if (attachment.mimeType?.includes('sql')) fileType = 'SQL';
                        else if (attachment.mimeType?.includes('ipynb')) fileType = 'Jupyter Notebook';

                        contentParts.push({
                            type: "text",
                            text: `\n\n--- Contenido del archivo ${fileType} "${fileName}" ---\n${textContent}\n--- Fin del archivo ---\n`,
                        });
                    } catch (error) {
                        console.error(`Error reading document ${attachment.url}:`, error);
                        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
                        contentParts.push({
                            type: "text",
                            text: `\n[Error al leer el archivo "${fileName}": ${errorMsg}]\n`,
                        });
                    }
                }
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
            if (msg.role === 'user') {
                messages.push({ role: 'user', content: msg.content });
            } else {
                // Assistant messages must be strings, not content parts
                const textContent = typeof msg.content === 'string' ? msg.content : '';
                messages.push({ role: 'assistant', content: textContent });
            }
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
