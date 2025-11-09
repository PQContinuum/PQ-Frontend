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
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { useChatStore } from './store';

export default function ChatPage() {
  const { replaceMessages } = useChatStore();

  const handleNewConversation = () => {
    replaceMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Hola, soy tu asistente IA. Estoy listo para ayudarte con cualquier idea. ¿Sobre qué quieres conversar hoy?',
      },
    ]);
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-black/5">
        <SidebarHeader className="border-b border-black/5 bg-[#f6f6f6]">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={handleNewConversation}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-[#111111]">
                  <Plus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Nuevo Chat</span>
                  <span className="truncate text-xs text-[#4c4c4c]">
                    Empezar una conversación
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="bg-[#f6f6f6]">
          <SidebarGroup>
            <SidebarGroupLabel className='gap-2'>
              <History className="size-4" />
              Recientes
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-black/5 bg-[#f6f6f6]">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-black/5 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#4c4c4c]">
                Teorema PQ
              </p>
              <h1 className="text-2xl font-semibold text-[#111111]">ChatGPT</h1>
            </div>
            <div className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm text-[#111111]">
              <span className="flex items-center gap-2">
                <Sparkles className="size-4" />
                GPT-4o mini
              </span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-0">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 pt-4">
            <div className="flex-1 overflow-y-auto">
              <ChatWindow />
            </div>
            <MessageInput />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
