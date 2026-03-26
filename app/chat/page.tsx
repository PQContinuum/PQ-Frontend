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
  Images,
  MessageSquare,
  ImageIcon,
  Video,
  Sparkles,
  Globe,
  MapPin,
  Paperclip,
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
import { useMessages, useReplaceMessages, useSetConversationId, useSetPendingInput, useSetPendingAction } from './store';
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

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  const getPlanStyle = (planName?: string) => {
    const p = planName?.toLowerCase() || 'free';
    if (p.includes('enterprise') || p.includes('empresarial'))
      return { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' };
    if (p.includes('professional') || p.includes('pro'))
      return { color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' };
    if (p.includes('basic') || p.includes('básico'))
      return { color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10' };
    return { color: 'text-[#64748B]', bg: 'bg-[#64748B]/10' };
  };

  const planStyle = getPlanStyle(userPlan?.planName);

  return (
    <SidebarFooter className="bg-[#f6f6f6] gap-1.5 pb-3">
      {/* Multimedia Button */}
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/characters" className="block">
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-[#FF8B3D] text-white hover:bg-[#e67a2e] transition-colors ${
                isCollapsed ? 'justify-center mx-auto w-fit px-2.5' : ''
              }`}
            >
              <Images className="size-4" />
              {!isCollapsed && (
                <span className="text-sm font-semibold">Multimedia</span>
              )}
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>

      <FeedbackWidget isCollapsed={isCollapsed} />

      {/* User account */}
      <SidebarMenu>
        <SidebarMenuItem>
          <Select value={selectValue} onValueChange={handleSelectAction}>
            <SelectTrigger className="w-full border-0 bg-transparent hover:bg-white/60 rounded-lg transition-colors [&>svg]:group-data-[collapsible=icon]:hidden h-auto py-2">
              <div className="flex items-center gap-2.5 w-full group-data-[collapsible=icon]:justify-center">
                <div className="size-8 rounded-full bg-[#FF8B3D] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">{userInitial}</span>
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="text-[13px] font-medium truncate w-full text-left text-[#111]">
                    {userEmail
                      ? userEmail.length > 22
                        ? `${userEmail.slice(0, 22)}...`
                        : userEmail
                      : 'Usuario'}
                  </span>
                  <span className={`text-[11px] font-semibold ${planStyle.color}`}>
                    {userPlan?.planName || 'Free'}
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
  const setPendingInput = useSetPendingInput();
  const setPendingAction = useSetPendingAction();
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
              <SidebarMenuButton
                size="lg"
                onClick={handleNewConversation}
                className="hover:bg-white/60 transition-colors group/new"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm text-[#FF8B3D] group-hover/new:shadow transition-shadow">
                  <Plus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-[#111] group-hover/new:text-[#FF8B3D] transition-colors">
                    Nuevo Chat
                  </span>
                  <span className="truncate text-xs text-[#999]">
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
                className="flex items-center justify-center size-8 rounded-full text-[#4c4c4c] hover:text-[#FF8B3D] hover:bg-[#FF8B3D]/10 transition-all"
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
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
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
              {/* Logo + Greeting */}
              <motion.div
                className="text-center space-y-4 mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex justify-center"
                >
                  <Image
                    src="/icon-192x192.png"
                    alt="Continuum AI"
                    width={80}
                    height={80}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="space-y-3"
                >
                  <h2 className="text-2xl md:text-3xl font-semibold text-[#111111] tracking-tight">
                    ¿En qué puedo ayudarte?
                  </h2>
                  <p className="text-[13px] md:text-sm text-[#999] max-w-md mx-auto leading-relaxed">
                    Chat con contexto, imágenes, video, audio y lectura de documentos
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    en un solo flujo inteligente.
                  </p>
                </motion.div>
              </motion.div>

              {/* Input */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="w-full"
              >
                <MessageInput />
              </motion.div>

              {/* Tool suggestion chips */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-6 w-full max-w-2xl"
              >
                {[
                  { icon: MessageSquare, label: 'Chat', action: 'chat' },
                  { icon: ImageIcon, label: 'Generar imagen', action: 'image' },
                  { icon: Video, label: 'Generar video', action: 'video' },
                  { icon: Sparkles, label: 'LISA', action: 'lisa' },
                  { icon: Globe, label: 'Web Search', action: 'web-search' },
                  { icon: MapPin, label: 'GeoCultural', action: 'geocultural' },
                  { icon: Paperclip, label: 'Archivos', action: 'files' },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={action}
                    onClick={() => {
                      if (action === 'chat') {
                        setPendingInput('');
                      } else {
                        setPendingAction(action);
                      }
                    }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-black/[0.06] bg-white hover:bg-neutral-50 hover:border-black/[0.1] transition-all text-left group"
                  >
                    <Icon className="size-4 text-[#bbb] group-hover:text-[#FF8B3D] transition-colors shrink-0" />
                    <span className="text-[13px] text-[#666] group-hover:text-[#111] transition-colors">{label}</span>
                  </button>
                ))}
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
