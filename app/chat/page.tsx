'use client';

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
};

type SSEPayload = {
  delta?: string;
  snapshot?: string;
  message?: string;
  response?: { error?: { message?: string } };
  [key: string]: unknown;
};

type SSEvent = {
  event: string;
  data: SSEPayload;
};

const createId = () => Math.random().toString(36).slice(2);

const parseSSEChunk = (chunk: string): SSEvent | null => {
  if (!chunk?.trim()) return null;
  const lines = chunk.split('\n');
  let event = 'message';
  let data = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim();
    }
  }

  if (!data) return null;

  try {
    return { event, data: JSON.parse(data) as SSEPayload };
  } catch {
    return null;
  }
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hola, soy tu asistente. Puedo ayudarte a escribir, idear y explicar cualquier tema. ¿Sobre qué quieres hablar hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endOfChatRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStreamEvent = useCallback(
    (assistantId: string, event: SSEvent) => {
      switch (event.event) {
        case 'response.output_text.delta': {
          const delta =
            typeof event.data?.delta === 'string' ? event.data.delta : '';
          const snapshot =
            typeof event.data?.snapshot === 'string' ? event.data.snapshot : null;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: snapshot ?? msg.content + delta,
                  }
                : msg,
            ),
          );
          break;
        }
        case 'response.completed': {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, pending: false } : msg,
            ),
          );
          break;
        }
        case 'response.failed':
        case 'error': {
          const failureMessage =
            event.data?.message ??
            event.data?.response?.error?.message ??
            'El asistente no pudo completar la respuesta.';

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: failureMessage, pending: false }
                : msg,
            ),
          );
          setError(failureMessage);
          break;
        }
        default:
          break;
      }
    },
    [],
  );

  const streamAssistant = useCallback(
    async (prompt: string, assistantId: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok || !response.body) {
        throw new Error('No se pudo establecer conexión con el asistente.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
        }
        if (done) break;

        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const event = parseSSEChunk(chunk);
          if (event) handleStreamEvent(assistantId, event);
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        const event = parseSSEChunk(buffer);
        if (event) handleStreamEvent(assistantId, event);
      }
    },
    [handleStreamEvent],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!input.trim() || isStreaming) return;

      const prompt = input.trim();
      const userMessage: Message = {
        id: createId(),
        role: 'user',
        content: prompt,
      };
      const assistantId = createId();

      setInput('');
      setError(null);
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '', pending: true },
      ]);

      setIsStreaming(true);
      try {
        await streamAssistant(prompt, assistantId);
      } catch (err) {
        const failure =
          err instanceof Error
            ? err.message
            : 'Ocurrió un problema al contactar al asistente.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: failure, pending: false }
              : msg,
          ),
        );
        setError(failure);
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, streamAssistant],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const quickPrompts = [
    'Explícame una idea compleja como si fuera para niños.',
    'Dame ideas frescas para mejorar mi productividad.',
    'Planifica un itinerario creativo para un fin de semana.',
  ];

  return (
    <main className="flex min-h-screen flex-col bg-[#343541] text-white">
      <header className="border-b border-white/10 bg-[#343541]/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">PQ Labs</p>
            <h1 className="text-2xl font-semibold text-white">Chat Experiments</h1>
          </div>
          <div className="rounded-full bg-[#10A37F]/10 px-4 py-1 text-sm text-[#10A37F]">
            En línea
          </div>
        </div>
      </header>

      <section className="flex flex-1 flex-col">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col gap-6 px-4 pb-32 pt-6">
          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:bg-white/10"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto rounded-3xl bg-[#444654]/60 p-6 shadow-2xl">
            <div className="flex flex-col gap-6">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div key={message.id} className="flex gap-3">
                    {!isUser && (
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#10A37F]/20 text-sm font-semibold text-[#10A37F]">
                        PQ
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2">
                      <span className="text-xs uppercase tracking-wide text-white/40">
                        {isUser ? 'Tú' : 'Asistente'}
                      </span>
                      <div
                        className={`w-fit rounded-2xl px-4 py-3 text-sm leading-relaxed shadow
                          ${isUser ? 'ml-auto bg-[#3E3F68]' : 'bg-[#343541]'}
                        `}
                      >
                        {message.content || (
                          <span className="flex items-center gap-2 text-white/50">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
                            Pensando...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endOfChatRef} />
            </div>
          </div>
        </div>
      </section>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="sticky bottom-0 flex w-full justify-center bg-gradient-to-t from-[#343541] via-[#343541]/95 to-transparent px-4 pb-6 pt-6"
      >
        <div className="flex w-full max-w-3xl items-end gap-3 rounded-3xl border border-white/10 bg-[#40414F]/80 p-4 shadow-2xl backdrop-blur">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Envía un mensaje a tu asistente..."
            className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="rounded-2xl bg-[#10A37F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0E8A6A] disabled:cursor-not-allowed disabled:bg-[#10A37F]/50"
          >
            {isStreaming ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </main>
  );
}
