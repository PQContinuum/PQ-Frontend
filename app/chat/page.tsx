'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import {
  History,
  Plus,
  Settings,
  TrendingUp,
  LogOut,
  Loader2,
  Volume2,
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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { ConversationHistory } from './components/ConversationHistory';
import { SettingsDialog } from './components/SettingsDialog';
import { TTSSettingsModal } from './components/TTSSettingsModal';
import { PendingJobsBanner } from './components/PendingJobsBanner';
import { ScrollNavigation } from './components/ScrollNavigation';
import { FeedbackWidget } from '@/components/feedback-widget';
import { useMessages, useReplaceMessages, useSetConversationId, useIsStreaming } from './store';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUserPlan } from '@/hooks/use-user-plan';

// Component for the sidebar footer that needs sidebar state
function SidebarFooterContent({
  userEmail,
  userPlan,
  selectValue,
  handleSelectAction,
}: {
  userEmail: string | null;
  userPlan: { planName: string } | undefined;
  selectValue: string;
  handleSelectAction: (value: string) => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarFooter className="bg-[#f6f6f6] gap-2">
      <FeedbackWidget isCollapsed={isCollapsed} />
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
                  <span className={`text-xs font-semibold ${
                    userPlan?.planName === 'Free' || !userPlan?.planName
                      ? 'text-[#64748B]'
                      : userPlan?.planName === 'Básico' || userPlan?.planName === 'Basic'
                      ? 'text-[#3B82F6]'
                      : userPlan?.planName === 'Profesional' || userPlan?.planName === 'Professional'
                      ? 'text-[#8B5CF6]'
                      : userPlan?.planName === 'Enterprise' || userPlan?.planName === 'Empresarial'
                      ? 'text-[#F59E0B]'
                      : 'text-[#64748B]'
                  }`}>
                    Plan {userPlan?.planName || 'Free'}
                  </span>
                </div>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upgrade">
                <Link href={'/payment'}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4" />
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
              <SelectItem value="voice">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-4" />
                  <span>Configuración de Voz</span>
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
  );
}

export default function ChatPage() {
  const messages = useMessages();
  const replaceMessages = useReplaceMessages();
  const setConversationId = useSetConversationId();
  const isStreaming = useIsStreaming();
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [ttsSettingsOpen, setTtsSettingsOpen] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { data: userPlan } = useUserPlan();
  const [selectValue, setSelectValue] = React.useState<string>('');
  const router = useRouter();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Verificar si hay mensajes de usuario (no solo el mensaje de bienvenida)
  const hasUserMessages = messages.some((msg) => msg.role === 'user');

  React.useEffect(() => {
    const getUserData = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      // TODO: Obtener el plan del usuario desde la base de datos
    };
    getUserData();
  }, []);

  const handleNewConversation = React.useCallback(() => {
    setIsCreatingNew(true);
    setTimeout(() => {
      replaceMessages([]);
      setConversationId(null);
      setIsCreatingNew(false);
    }, 300);
  }, [replaceMessages, setConversationId]);

  const getConversationTitle = React.useCallback(() => {
    const firstUserMessage = messages.find((msg) => msg.role === 'user');
    if (!firstUserMessage) {
      return 'Nueva conversación';
    }
    const title = firstUserMessage.content.slice(0, 25);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }, [messages]);

  const handleLogout = React.useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/auth');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  }, [router]);

  const handleSelectAction = React.useCallback((value: string) => {
    switch (value) {
      case 'upgrade':
        router.push('/payment');
        break;
      case 'logout':
        setLogoutDialogOpen(true);
        break;
      case 'settings':
        setSettingsOpen(true);
        break;
      case 'voice':
        setTtsSettingsOpen(true);
        break;
    }
    // Reset select value after action
    setTimeout(() => setSelectValue(''), 100);
  }, [router]);

  return (
    <SidebarProvider>
      {/* Banner de jobs pendientes - se muestra cuando hay generaciones en progreso */}
      <PendingJobsBanner />

      <Sidebar collapsible="icon" className="border-r border-black/5">
        <SidebarHeader className="space-y-2 bg-[#f6f6f6]">
          <Link
            href={"/"}
            className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center cursor-pointer"
          >
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg">
              <Image
                src="/apple-touch-icon.png"
                alt="Continuum AI Logo"
                width={36}
                height={36}
                className="size-10 rounded-lg"
              />
            </div>
            <span className="text-xl font-bold text-[#111111] group-data-[collapsible=icon]:hidden">
              Continuum AI
            </span>
          </Link>

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

        <SidebarFooterContent
          userEmail={userEmail}
          userPlan={userPlan}
          selectValue={selectValue}
          handleSelectAction={handleSelectAction}
        />

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {hasUserMessages && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-black/5 bg-white px-4 [backface-visibility:hidden] [transform:translateZ(0)]"
          >
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <p className="text-md font-semibold tracking-wide text-[#4c4c4c] truncate max-w-md">
                  {getConversationTitle()}
                </p>
              </div>
              <button
                onClick={() => setTtsSettingsOpen(true)}
                className="flex items-center justify-center size-8 rounded-full text-[#4c4c4c] hover:text-[#00552b] hover:bg-[#00552b]/10 transition-all"
                title="Configuración de voz"
                aria-label="Configuración de voz"
              >
                <Volume2 className="size-4" />
              </button>
              {/*<div className={`group rounded-full border-2 px-4 py-1.5 text-sm cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                userPlan?.planName === 'Free' || !userPlan?.planName
                  ? 'border-[#64748B] bg-[#64748B]/10'
                  : userPlan?.planName === 'Básico' || userPlan?.planName === 'Basic'
                  ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                  : userPlan?.planName === 'Profesional' || userPlan?.planName === 'Professional'
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                  : userPlan?.planName === 'Enterprise' || userPlan?.planName === 'Empresarial'
                  ? 'border-[#F59E0B] bg-[#F59E0B]/10'
                  : 'border-[#64748B] bg-[#64748B]/10'
              }`}>
                <span className={`flex items-center gap-2 font-semibold ${
                  userPlan?.planName === 'Free' || !userPlan?.planName
                    ? 'text-[#64748B]'
                    : userPlan?.planName === 'Básico' || userPlan?.planName === 'Basic'
                    ? 'text-[#3B82F6]'
                    : userPlan?.planName === 'Profesional' || userPlan?.planName === 'Professional'
                    ? 'text-[#8B5CF6]'
                    : userPlan?.planName === 'Enterprise' || userPlan?.planName === 'Empresarial'
                    ? 'text-[#F59E0B]'
                    : 'text-[#64748B]'
                }`}>
                  {userPlan?.planName === 'Free' || !userPlan?.planName
                    ? '180 tokens ahorrados'
                    : userPlan?.planName === 'Básico' || userPlan?.planName === 'Basic'
                    ? '850 tokens ahorrados'
                    : userPlan?.planName === 'Profesional' || userPlan?.planName === 'Professional'
                    ? '5k tokens ahorrados'
                    : userPlan?.planName === 'Enterprise' || userPlan?.planName === 'Empresarial'
                    ? '180k tokens ahorrados'
                    : '180k tokens restantes'}
                </span>
              </div>*/}
            </div>
          </motion.header>
        )}

        {!hasUserMessages ? (
          <div className="flex-1 flex flex-col items-center px-4 relative pt-16 md:pt-24">
            {/* Mobile menu trigger */}
            <div className="absolute top-4 left-4 md:hidden">
              <SidebarTrigger />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              {/* Sistema de identidad - Jerarquía clara */}
              <motion.div
                className="text-center space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {/* Logo símbolo */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex justify-center"
                >
                  <Image
                    src="/icon-192x192.png"
                    alt="Continuum AI"
                    width={100}
                    height={100}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full"
                  />
                </motion.div>

                {/* Nombre del sistema - tipografía espaciada */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <h1 className="text-xl md:text-2xl font-light tracking-[0.3em] text-[#00552b] uppercase">
                    Continuum AI
                  </h1>
                </motion.div>

                {/* Núcleo cognitivo - título principal */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="space-y-2"
                >
                  <h2 className="text-2xl md:text-3xl font-semibold text-[#111111] tracking-tight">
                    Núcleo Cognitivo Avanzado
                  </h2>
                  <p className="text-sm md:text-base text-[#4c4c4c] font-light tracking-wide">
                    Sistema de razonamiento continuo en operación
                  </p>
                </motion.div>

                {/* Línea divisoria - glow sutil */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="relative w-full max-w-2xl mx-auto h-[1px]"
                >
                  {/* Línea base ultra fina */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#22c55e]/30 to-transparent" />
                  {/* Glow suave */}
                  <div className="absolute inset-y-0 left-1/4 right-1/4 bg-gradient-to-r from-transparent via-[#22c55e]/50 to-transparent blur-[3px]" />
                  {/* Glow más amplio y difuso */}
                  <div className="absolute -inset-y-2 left-1/3 right-1/3 bg-gradient-to-r from-transparent via-[#22c55e]/20 to-transparent blur-[8px]" />
                </motion.div>

                {/* Instrucción de uso - call to action */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="text-lg md:text-xl text-[#111111]/70 font-light leading-relaxed max-w-lg mx-auto"
                >
                  Ingrese la intención o el problema
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  a procesar por el núcleo cognitivo.
                </motion.p>
              </motion.div>

              {/* Input - centrado */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="w-full mt-10"
              >
                <MessageInput />
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <>
            <motion.div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="mx-auto w-full max-w-4xl px-4 py-4"
                animate={isCreatingNew ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <ChatWindow />
              </motion.div>
            </motion.div>

            <ScrollNavigation
              scrollContainerRef={scrollContainerRef}
              hasNewMessages={isStreaming}
            />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="sticky bottom-0 z-10 shrink-0 border-t border-black/5 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)] [backface-visibility:hidden] [transform:translateZ(0)]"
            >
              <div className="mx-auto w-full max-w-4xl px-4 py-4">
                <MessageInput />
              </div>
            </motion.div>
          </>
        )}
      </SidebarInset>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userEmail={userEmail}
        userPlan={userPlan?.planName || 'Free'}
      />

      <TTSSettingsModal
        open={ttsSettingsOpen}
        onOpenChange={setTtsSettingsOpen}
      />

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#111111]">
              Cerrar sesión
            </DialogTitle>
            <DialogDescription className="text-[#4c4c4c] pt-2">
              ¿Estás seguro de que deseas cerrar sesión? Perderás el acceso a tus conversaciones hasta que vuelvas a iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 space-x-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={isLoggingOut}
              className="border-black/10 hover:bg-black/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cerrando sesión...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
