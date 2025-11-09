'use client';

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  History,
  LifeBuoy,
  MessageSquareText,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';

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

const createAssistantGreeting = (): Message => ({
  id: createId(),
  role: 'assistant',
  content:
    'Hola, soy tu asistente. Puedo ayudarte a escribir, idear y explicar cualquier tema. ¿Sobre qué quieres hablar hoy?',
});

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

const quickPrompts = [
  'Explícame una idea compleja como si fuera para niños.',
  'Dame ideas frescas para mejorar mi productividad.',
  'Planifica un itinerario creativo para un fin de semana.',
];

const savedChats = [
  {
    id: 'daily-brief',
    title: 'Resumen diario del equipo',
    prompt: 'Haz un resumen del día destacando logros y pendientes.',
  },
  {
    id: 'launch-plan',
    title: 'Plan de lanzamiento',
    prompt: 'Ayúdame a planificar un lanzamiento creativo para un producto SaaS.',
  },
  {
    id: 'blog-draft',
    title: 'Ideas para blog',
    prompt: 'Genera tres conceptos de blog sobre IA aplicada a la educación.',
  },
  {
    id: 'pitch-refine',
    title: 'Mejorar pitch',
    prompt: 'Refina este pitch y hazlo más convincente.',
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => [
    createAssistantGreeting(),
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endOfChatRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setMessages([createAssistantGreeting()]);
    setInput('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

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

  return (
    <SidebarProvider className="bg-[#202123] text-white">
      <div className="flex min-h-screen w-full bg-[#202123]">
        <Sidebar
          collapsible="icon"
          className="border-r border-white/5 bg-[#202123] text-white"
        >
          <SidebarHeader className="px-4 pt-6">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Nueva conversación
            </button>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-white/40">
                <History className="h-4 w-4" />
                Recientes
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {savedChats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        className="bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setInput(chat.prompt);
                          textareaRef.current?.focus();
                        }}
                      >
                        <MessageSquareText className="h-4 w-4 text-white/50" />
                        <span className="truncate">{chat.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator className="bg-white/5" />
          <SidebarFooter className="gap-3 px-4 pb-6">
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            >
              <Sparkles className="h-4 w-4 text-[#10A37F]" />
              Explorar novedades
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            >
              <LifeBuoy className="h-4 w-4 text-white/60" />
              Ayuda
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            >
              <Settings className="h-4 w-4 text-white/60" />
              Ajustes
            </button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-[#343541] text-white">
          <section className="flex min-h-screen flex-col bg-[#343541]">
            <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white md:hidden" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    PQ Labs
                  </p>
                  <h1 className="text-2xl font-semibold text-white">
                    ChatGPT Replica
                  </h1>
                </div>
              </div>
              <div className="rounded-full border border-white/10 px-4 py-1 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#10A37F]" />
                  Modelo activo
                </span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-8">
              {error && (
                <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    <Sparkles className="mt-1 h-4 w-4 text-[#10A37F]" />
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {messages.map((message) => {
                  const isUser = message.role === 'user';
                  return (
                    <div
                      key={message.id}
                      className={`rounded-3xl px-6 py-5 text-[15px] leading-relaxed shadow-lg ${
                        isUser ? 'bg-[#3E3F4B]' : 'bg-[#444654]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
                        {isUser ? 'Tú' : 'ChatGPT'}
                      </div>
                      <div className="mt-3 whitespace-pre-line text-[#ECECF1]">
                        {message.content || (
                          <span className="flex items-center gap-2 text-white/50">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
                            Pensando...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endOfChatRef} />
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#343541]/95 px-4 py-6 sm:px-8">
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex w-full items-end gap-3 rounded-3xl border border-white/10 bg-[#40414F]/80 p-4 shadow-2xl backdrop-blur"
              >
                <textarea
                  ref={textareaRef}
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
              </form>
              <p className="mt-3 text-center text-xs text-white/40">
                ChatGPT recreado para PQ. Es posible que el asistente cometa errores.
              </p>
            </div>
          </section>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
