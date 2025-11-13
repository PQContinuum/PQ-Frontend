'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import {
  History,
  Plus,
  Settings,
  Sparkles,
  LogOut,
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { ConversationHistory } from './components/ConversationHistory';
import { SettingsDialog } from './components/SettingsDialog';
import { useChatStore } from './store';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { messages, replaceMessages, setConversationId } = useChatStore();
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [userPlan, setUserPlan] = React.useState('Gratis');
  const [selectValue, setSelectValue] = React.useState<string>('');
  const router = useRouter();

  React.useEffect(() => {
    const getUserData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      // TODO: Obtener el plan del usuario desde la base de datos
    };
    getUserData();
  }, []);

  const handleNewConversation = () => {
    setIsCreatingNew(true);
    setTimeout(() => {
      replaceMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Hola, soy tu asistente IA. Estoy listo para ayudarte con cualquier idea. ¿Sobre qué quieres conversar hoy?',
        },
      ]);
      setConversationId(null);
      setIsCreatingNew(false);
    }, 300);
  };

  const getConversationTitle = () => {
    const firstUserMessage = messages.find((msg) => msg.role === 'user');
    if (!firstUserMessage) {
      return 'Nueva conversación';
    }
    const title = firstUserMessage.content.slice(0, 25);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  const handleSelectAction = (value: string) => {
    switch (value) {
      case 'upgrade':
        router.push('/payment');
        break;
      case 'logout':
        handleLogout();
        break;
      case 'settings':
        setSettingsOpen(true);
        break;
    }
    // Reset select value after action
    setTimeout(() => setSelectValue(''), 100);
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-black/5">
        <SidebarHeader className="space-y-2 bg-[#f6f6f6]">
          <motion.div
            className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="flex aspect-square size-12 items-center justify-center rounded-lg"
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Image
                src="/logo.png"
                alt="PQ Logo"
                width={48}
                height={48}
                className="size-12"
              />
            </motion.div>
            <motion.span
              className="text-xl font-bold text-[#111111] group-data-[collapsible=icon]:hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              PQ Continuum
            </motion.span>
          </motion.div>

          <SidebarMenu>
            <SidebarMenuItem>
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                animate={isCreatingNew ? { scale: [1, 1.05, 1] } : {}}
                transition={isCreatingNew ? { duration: 0.4, ease: "easeInOut" } : { type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="absolute -inset-[2px] rounded-lg opacity-0"
                  style={{
                    background: 'linear-gradient(90deg, #00552b, #00aa56, #00552b, #00aa56)',
                    backgroundSize: '200% 100%'
                  }}
                  whileHover={{
                    opacity: 1,
                    backgroundPosition: ['0% 0%', '200% 0%']
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    backgroundPosition: { duration: 1.5, ease: "linear", repeat: Infinity }
                  }}
                />
                <SidebarMenuButton
                  size="lg"
                  onClick={handleNewConversation}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground relative overflow-hidden bg-[#f6f6f6]"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#00552b]/0 via-[#00552b]/10 to-[#00552b]/0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    animate={isCreatingNew ? { x: '100%' } : {}}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-[#111111] relative z-10"
                    whileHover={{ rotate: 720 }}
                    animate={isCreatingNew ? { rotate: 180, scale: [1, 1.2, 1] } : { rotate: 0 }}
                    transition={isCreatingNew ? { duration: 0.4, ease: "easeInOut" } : { duration: 0.6, ease: "easeOut" }}
                  >
                    <Plus className="size-4" />
                  </motion.div>
                  <div className="grid flex-1 text-left text-sm leading-tight relative z-10">
                    <motion.span
                      className="truncate font-semibold"
                      animate={isCreatingNew ? { opacity: [1, 0.5, 1] } : {}}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      whileHover={{ color: "#00552b" }}
                    >
                      Nuevo Chat
                    </motion.span>
                    <span className="truncate text-xs text-[#4c4c4c]">
                      Empezar una conversación
                    </span>
                  </div>
                </SidebarMenuButton>
              </motion.div>
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
                <ConversationHistory />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-[#f6f6f6]">
          <SidebarMenu>
            <SidebarMenuItem>
              <Select value={selectValue} onValueChange={handleSelectAction}>
                <SelectTrigger className="w-full border-0 bg-transparent hover:bg-white/50 transition-colors [&>svg]:group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                    <div className="text-2xl">👤</div>
                    <div className="flex flex-col items-start flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium truncate w-full text-left">
                        {userEmail
                          ? userEmail.length > 20
                            ? `${userEmail.slice(0, 20)}...`
                            : userEmail
                          : 'Usuario'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Gratis
                      </span>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upgrade">
                    <Link href={'/payment'}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4" />
                      <span>Mejorar Plan</span>
                    </div>
                    </Link>
                  </SelectItem>
                  <SelectItem value="settings">
                    <div className="flex items-center gap-2">
                      <Settings className="size-4" />
                      <span>Configuración</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="logout">
                    <div className="flex items-center gap-2">
                      <LogOut className="size-4" />
                      <span>Cerrar sesión</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-black/5 bg-white px-4 [backface-visibility:hidden] [transform:translateZ(0)]">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-md font-semibold tracking-wide text-[#4c4c4c] truncate max-w-md">
                {getConversationTitle()}
              </p>
            </div>
            <div className="group rounded-full border-2 border-yellow-600 bg-yellow-50 px-4 py-1.5 text-sm text-[#111111] cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <span className="flex items-center gap-2 text-yellow-600 font-semibold">
                Asistente PQ 0.0.1
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="mx-auto w-full max-w-4xl px-4 py-4"
            animate={isCreatingNew ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChatWindow />
          </motion.div>
        </div>

        <div className="sticky bottom-0 z-10 shrink-0 border-t border-black/5 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)] [backface-visibility:hidden] [transform:translateZ(0)]">
          <div className="mx-auto w-full max-w-4xl px-4 py-4">
            <MessageInput />
          </div>
        </div>
      </SidebarInset>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userEmail={userEmail}
        userPlan={userPlan}
      />
    </SidebarProvider>
  );
}
