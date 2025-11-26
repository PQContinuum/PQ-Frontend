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
  Loader2,
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
import { useMessages, useReplaceMessages, useSetConversationId } from './store';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUserPlan } from '@/hooks/use-user-plan';

export default function ChatPage() {
  const messages = useMessages();
  const replaceMessages = useReplaceMessages();
  const setConversationId = useSetConversationId();
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { data: userPlan } = useUserPlan();
  const [selectValue, setSelectValue] = React.useState<string>('');
  const router = useRouter();

  // Verificar si hay mensajes de usuario (no solo el mensaje de bienvenida)
  const hasUserMessages = messages.some((msg) => msg.role === 'user');

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
      const supabase = createSupabaseBrowserClient();
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
    }
    // Reset select value after action
    setTimeout(() => setSelectValue(''), 100);
  }, [router]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-black/5">
        <SidebarHeader className="space-y-2 bg-[#f6f6f6]">
          <Link
            href={"/"}
            className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center cursor-pointer"
          >
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg">
              <Image
                src="/images/logo.svg"
                alt="PQ Logo"
                width={36}
                height={36}
                className="size-10"
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
                      <span className={`text-xs font-semibold ${
                        userPlan?.planName === 'Free' || !userPlan?.planName
                          ? 'text-[#7EEFB2]'
                          : userPlan?.planName === 'Básico' || userPlan?.planName === 'Basic'
                          ? 'text-[#3CCB75]'
                          : userPlan?.planName === 'Profesional' || userPlan?.planName === 'Professional'
                          ? 'text-[#DAA520]'
                          : userPlan?.planName === 'Enterprise' || userPlan?.planName === 'Empresarial'
                          ? 'text-[#0A4D68]'
                          : 'text-[#7EEFB2]'
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
              <div className={`group rounded-full border-2 px-4 py-1.5 text-sm cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                userPlan?.planName === 'Free' || !userPlan?.planName
                  ? 'border-[#7EEFB2] bg-[#7EEFB2]/10'
                  : userPlan?.planName === 'Básico' || userPlan?.planName === 'Basic'
                  ? 'border-[#3CCB75] bg-[#3CCB75]/10'
                  : userPlan?.planName === 'Profesional' || userPlan?.planName === 'Professional'
                  ? 'border-[#DAA520] bg-[#DAA520]/10'
                  : userPlan?.planName === 'Enterprise' || userPlan?.planName === 'Empresarial'
                  ? 'border-[#0A4D68] bg-[#0A4D68]/10'
                  : 'border-[#7EEFB2] bg-[#7EEFB2]/10'
              }`}>
                <span className={`flex items-center gap-2 font-semibold ${
                  userPlan?.planName === 'Free' || !userPlan?.planName
                    ? 'text-[#7EEFB2]'
                    : userPlan?.planName === 'Básico' || userPlan?.planName === 'Basic'
                    ? 'text-[#3CCB75]'
                    : userPlan?.planName === 'Profesional' || userPlan?.planName === 'Professional'
                    ? 'text-[#DAA520]'
                    : userPlan?.planName === 'Enterprise' || userPlan?.planName === 'Empresarial'
                    ? 'text-[#0A4D68]'
                    : 'text-[#7EEFB2]'
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
              </div>
            </div>
          </motion.header>
        )}

        {!hasUserMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-3xl space-y-8"
            >
              <motion.div
                className="text-center space-y-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold text-[#111111] leading-relaxed">
                  Hola! 👋 Soy <span className='text-[#00552b] underline'>Continuum AI </span><br/> ¿Cómo te puedo ayudar hoy?
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <MessageInput />
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <>
            <motion.div
              className="flex-1 overflow-y-auto"
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
