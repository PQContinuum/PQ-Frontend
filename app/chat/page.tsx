'use client';

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

import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { useChatStore } from './store';

const suggestions = [
  'Explica teoría de juegos aplicada a startups.',
  'Genera ideas para mejorar mi flujo creativo.',
  'Elabora un resumen de mi jornada de trabajo.',
  'Ayúdame a escribir una introducción inspiradora.',
];

export default function ChatPage() {
  const { replaceMessages } = useChatStore();

  const handleNewConversation = () => {
    replaceMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Hola, soy ChatGPT. Estoy listo para ayudarte con cualquier idea. ¿Sobre qué quieres conversar hoy?',
      },
    ]);
  };

  return (
    <SidebarProvider className="bg-white text-[#111111]">
      <div className="flex min-h-screen w-full bg-white text-[#111111]">
        <Sidebar
          collapsible="icon"
          className="border-r border-black/5 bg-[#f6f6f6] text-[#111111]"
        >
          <SidebarHeader className="px-4 pt-6">
            <button
              type="button"
              onClick={handleNewConversation}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#111111] transition hover:border-black/40"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#4c4c4c]">
                <History className="h-4 w-4" />
                Recents
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {suggestions.map((item) => (
                    <SidebarMenuItem key={item}>
                      <SidebarMenuButton className="rounded-2xl border border-transparent bg-transparent text-[#111111]/70 transition hover:-translate-y-0.5 hover:border-black/10 hover:bg-white hover:text-[#111111]">
                        <MessageSquareText className="h-4 w-4 text-[#4c4c4c]" />
                        <span className="truncate">{item}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator className="bg-black/5" />

          <SidebarFooter className="gap-3 px-4 pb-6">
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111111]/70 transition hover:border-black/40"
            >
              <Sparkles className="h-4 w-4 text-[#111111]" />
              Explore
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111111]/70 transition hover:border-black/40"
            >
              <LifeBuoy className="h-4 w-4 text-[#4c4c4c]" />
              Help
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111111]/70 transition hover:border-black/40"
            >
              <Settings className="h-4 w-4 text-[#4c4c4c]" />
              Settings
            </button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-white text-[#111111] max-w-4xl mx-auto">
          <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-[#4c4c4c] hover:text-[#111111] md:hidden" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#4c4c4c]">
                  Teorema PQ
                </p>
                <h1 className="text-2xl font-semibold text-[#111111]">ChatGPT</h1>
              </div>
            </div>
            <div className="rounded-full border border-black/10 bg-white px-4 py-1 text-sm text-[#111111]">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#111111]" />
                GPT-4o mini
              </span>
            </div>
          </header>

          <main className="relative flex flex-1 min-h-0 flex-col px-4 pb-8 pt-6 sm:px-8">
            <div className="flex-1 min-h-0">
              <ChatWindow />
            </div>
            <div className="sticky bottom-0 left-0 right-0 w-full bg-white/95 px-0 pb-0 pt-6 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-0">
              <MessageInput />
              <p className="mt-4 text-center text-xs text-[#4c4c4c]">
                PQ puede generar información inexacta. Verifica los datos
                importantes.
              </p>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
