'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  CreditCard,
  Database,
  Upload,
  MessageSquare,
  ExternalLink,
  Loader2,
  Crown,
  Check,
  Sparkles,
  Users,
  Trash2,
  Eye,
  Clock,
  Mail,
  Shield,
  FileText,
  HelpCircle,
  Trash,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChatGPTImportDialog } from './ChatGPTImportDialog';
import { DeleteCharacterModal } from './lisa/DeleteCharacterModal';
import { billingApi } from '@/lib/api-client';
import { useCharacters } from '@/hooks/use-characters';
import type { Character } from '@/lib/lisa/types';

const CHATGPT_GREEN = '#10a37f';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string | null;
  userPlan: string;
}

type TabKey = 'account' | 'plans' | 'data' | 'lisa';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'account', label: 'Cuenta', icon: User },
  { key: 'plans', label: 'Planes', icon: CreditCard },
  { key: 'data', label: 'Datos', icon: Database },
  { key: 'lisa', label: 'LISA', icon: Sparkles },
];

const getPlanColors = (plan: string) => {
  const p = plan.toLowerCase();
  if (p.includes('basic') || p.includes('básico'))
    return { bg: 'from-[#FF8B3D] to-[#e67a2e]', label: 'Básico' };
  if (p.includes('professional') || p.includes('pro'))
    return { bg: 'from-[#c9851a] to-[#a06d12]', label: 'Profesional' };
  if (p.includes('enterprise') || p.includes('empresarial'))
    return { bg: 'from-[#1a1a2e] to-[#16213e]', label: 'Enterprise' };
  return { bg: 'from-[#888] to-[#666]', label: 'Gratis' };
};

const planFeatures: Record<string, string[]> = {
  free: [
    'Conversaciones básicas',
    'Historial de 7 días',
    'Modelos estándar',
    'Soporte por comunidad',
  ],
  paid: [
    'Conversaciones ilimitadas',
    'Historial completo',
    'Modelos avanzados',
    'Soporte prioritario 24/7',
    'Integraciones y API',
  ],
};

// --- Shared sub-components ---

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-[#111]">{title}</h3>
      <p className="text-[13px] text-[#888] mt-0.5">{subtitle}</p>
    </div>
  );
}

function InfoNote({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl bg-neutral-50 border border-black/[0.06] p-4">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#888]">
            <span className="mt-1 block size-1 rounded-full bg-[#bbb] shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-black/[0.06] p-5 ${className || ''}`}>
      {children}
    </div>
  );
}

// --- Main component ---

export function SettingsDialog({
  open,
  onOpenChange,
  userEmail,
  userPlan,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>('account');
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = React.useState(false);
  const [characterToDelete, setCharacterToDelete] = React.useState<Character | null>(null);

  const planColors = getPlanColors(userPlan);
  const isFree = userPlan.toLowerCase() === 'gratis' || userPlan.toLowerCase() === 'free';

  const { data: characters, isLoading: isLoadingCharacters } = useCharacters();

  const handleManageSubscription = React.useCallback(async () => {
    setIsLoadingPortal(true);
    try {
      const response = await billingApi.createPortalSession({
        returnUrl: window.location.href,
      });
      window.location.href = response.url;
    } catch (error) {
      console.error('Error opening subscription portal:', error);
    } finally {
      setIsLoadingPortal(false);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[860px] w-full h-[80vh] max-h-[680px] p-0 gap-0 overflow-hidden border-black/[0.08]"
        showCloseButton={false}
      >
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* ---- Sidebar ---- */}
          <div className="w-full md:w-56 bg-neutral-50/80 border-b md:border-b-0 md:border-r border-black/[0.06] flex-shrink-0 flex flex-col">
            <div className="px-5 pt-6 pb-2">
              <h2 className="text-[15px] font-semibold text-[#111]">Configuración</h2>
            </div>

            <nav className="px-3 py-2 flex-1">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
                    activeTab === key
                      ? 'bg-white text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-black/[0.06]'
                      : 'text-[#888] hover:text-[#555] hover:bg-white/60'
                  }`}
                >
                  <Icon className="size-[15px]" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Sidebar footer */}
            <div className="px-5 pb-5 mt-auto hidden md:block">
              <div className="border-t border-black/[0.06] pt-4">
                <p className="text-[11px] text-[#bbb]">Continuum AI v0.1.0</p>
              </div>
            </div>
          </div>

          {/* ---- Content ---- */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-5 md:p-7">
              <AnimatePresence mode="wait">
                {/* ======== CUENTA ======== */}
                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <SectionHeader
                      title="Cuenta"
                      subtitle="Tu información personal y estado de cuenta"
                    />

                    {/* Email */}
                    <SettingsCard>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[#FF8B3D]/8 flex items-center justify-center">
                          <Mail className="size-[18px] text-[#FF8B3D]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#111] truncate">
                            {userEmail || 'No disponible'}
                          </p>
                          <p className="text-[12px] text-[#10b981] font-medium flex items-center gap-1">
                            <Check className="size-3" />
                            Verificado
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          isFree
                            ? 'bg-neutral-100 text-[#888]'
                            : 'bg-[#FF8B3D]/10 text-[#FF8B3D]'
                        }`}>
                          {planColors.label}
                        </span>
                      </div>
                    </SettingsCard>

                    {/* Upgrade banner - only for free users */}
                    {isFree && (
                      <SettingsCard className="!bg-[#FF8B3D]/[0.04] !border-[#FF8B3D]/15">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-[13px] font-semibold text-[#111] mb-0.5">
                              Mejora tu experiencia
                            </h4>
                            <p className="text-[12px] text-[#888]">
                              Desbloquea conversaciones ilimitadas y modelos avanzados
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              onOpenChange(false);
                              window.location.href = '/payment';
                            }}
                            className="bg-[#FF8B3D] hover:bg-[#e67a2e] text-white text-[12px] px-4 h-8 font-medium shrink-0"
                          >
                            Ver planes
                            <ChevronRight className="size-3.5 ml-0.5" />
                          </Button>
                        </div>
                      </SettingsCard>
                    )}

                    {/* Quick links */}
                    <div className="space-y-1">
                      <p className="text-[12px] font-medium text-[#999] mb-2 px-1">
                        Enlaces
                      </p>
                      {[
                        { icon: FileText, label: 'Términos y condiciones', href: '/legal/terminos' },
                        { icon: Shield, label: 'Política de privacidad', href: '/legal/privacidad' },
                        { icon: HelpCircle, label: 'Soporte', href: 'mailto:soporte@continuumai.llc' },
                      ].map(({ icon: Icon, label, href }) => (
                        <a
                          key={label}
                          href={href}
                          target={href.startsWith('mailto') ? undefined : '_blank'}
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-[#666] hover:bg-neutral-50 hover:text-[#111] transition-colors"
                        >
                          <Icon className="size-[15px] text-[#bbb]" />
                          {label}
                          <ExternalLink className="size-3 text-[#ccc] ml-auto" />
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ======== PLANES ======== */}
                {activeTab === 'plans' && (
                  <motion.div
                    key="plans"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <SectionHeader
                      title="Tu plan"
                      subtitle="Gestiona tu suscripción actual"
                    />

                    {/* Current plan card */}
                    <div className={`bg-gradient-to-br ${planColors.bg} rounded-xl p-5 text-white`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[12px] opacity-80 font-medium mb-0.5">Plan actual</p>
                          <h4 className="text-2xl font-bold">{userPlan}</h4>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2">
                          <Crown className="size-5" />
                        </div>
                      </div>
                      <p className="text-[13px] opacity-90">
                        {isFree
                          ? 'Acceso básico a Continuum AI'
                          : `Funciones premium de ${planColors.label} activas`}
                      </p>
                    </div>

                    {/* Features */}
                    <SettingsCard>
                      <p className="text-[13px] font-semibold text-[#111] mb-3">
                        Incluido en tu plan
                      </p>
                      <ul className="space-y-2.5">
                        {(isFree ? planFeatures.free : planFeatures.paid).map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-[13px] text-[#666]">
                            <div className="size-5 rounded-full bg-[#FF8B3D]/10 flex items-center justify-center shrink-0">
                              <Check className="size-3 text-[#FF8B3D]" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </SettingsCard>

                    {/* CTA */}
                    {isFree ? (
                      <SettingsCard className="!border-dashed text-center">
                        <p className="text-[13px] font-semibold text-[#111] mb-1">
                          Desbloquea más con un plan premium
                        </p>
                        <p className="text-[12px] text-[#888] mb-4">
                          Mensajes ilimitados, modelos avanzados y más
                        </p>
                        <Button
                          onClick={() => {
                            onOpenChange(false);
                            window.location.href = '/payment';
                          }}
                          className="bg-[#FF8B3D] hover:bg-[#e67a2e] text-white text-[13px] px-5 h-9 font-medium"
                        >
                          Ver planes disponibles
                        </Button>
                      </SettingsCard>
                    ) : (
                      <SettingsCard>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-[#111]">
                              Gestionar suscripción
                            </p>
                            <p className="text-[12px] text-[#888]">
                              Cambia tu plan, método de pago o cancela
                            </p>
                          </div>
                          <Button
                            onClick={handleManageSubscription}
                            disabled={isLoadingPortal}
                            className="bg-[#FF8B3D] hover:bg-[#e67a2e] text-white text-[13px] px-5 h-9 font-medium shrink-0"
                          >
                            {isLoadingPortal ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <>
                                <ExternalLink className="size-3.5 mr-1.5" />
                                Gestionar
                              </>
                            )}
                          </Button>
                        </div>
                      </SettingsCard>
                    )}
                  </motion.div>
                )}

                {/* ======== DATOS ======== */}
                {activeTab === 'data' && (
                  <motion.div
                    key="data"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <SectionHeader
                      title="Datos"
                      subtitle="Importa, exporta y gestiona tus conversaciones"
                    />

                    {/* Import from ChatGPT */}
                    <SettingsCard>
                      <div className="flex items-start gap-3.5">
                        <div
                          className="size-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${CHATGPT_GREEN}10` }}
                        >
                          <MessageSquare className="size-[18px]" style={{ color: CHATGPT_GREEN }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-semibold text-[#111] mb-0.5">
                            Importar desde ChatGPT
                          </h4>
                          <p className="text-[12px] text-[#888] mb-3 leading-relaxed">
                            Soporta archivos ZIP (export completo) o JSON (conversations.json)
                          </p>
                          <Button
                            onClick={() => setImportDialogOpen(true)}
                            className="h-8 text-[12px] font-medium text-white"
                            style={{ backgroundColor: CHATGPT_GREEN }}
                          >
                            <Upload className="size-3.5 mr-1.5" />
                            Importar
                          </Button>
                        </div>
                      </div>
                    </SettingsCard>

                    {/* Export */}
                    <SettingsCard className="!bg-neutral-50/50">
                      <div className="flex items-start gap-3.5">
                        <div className="size-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <Database className="size-[18px] text-[#bbb]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-semibold text-[#111] mb-0.5">
                            Exportar tus datos
                          </h4>
                          <p className="text-[12px] text-[#888] mb-3">
                            Descarga todas tus conversaciones y datos
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#bbb] bg-neutral-100 px-2.5 py-1 rounded-full">
                            <Clock className="size-3" />
                            Próximamente
                          </span>
                        </div>
                      </div>
                    </SettingsCard>

                    {/* Delete conversations */}
                    <SettingsCard className="!border-red-100">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                            <Trash className="size-[18px] text-red-400" />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-semibold text-[#111] mb-0.5">
                              Eliminar conversaciones
                            </h4>
                            <p className="text-[12px] text-[#888]">
                              Elimina conversaciones individualmente desde el sidebar
                            </p>
                          </div>
                        </div>
                      </div>
                    </SettingsCard>

                    <InfoNote
                      items={[
                        'Tus conversaciones se almacenan de forma segura y encriptada',
                        'Al importar, los datos originales de ChatGPT no se modifican',
                      ]}
                    />
                  </motion.div>
                )}

                {/* ======== LISA ======== */}
                {activeTab === 'lisa' && (
                  <motion.div
                    key="lisa"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <SectionHeader
                      title="LISA — Personajes"
                      subtitle="Personajes que has creado para generación de contenido"
                    />

                    {/* Characters list */}
                    <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
                      <div className="px-5 py-3 border-b border-black/[0.04] flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[#111]">
                          Mis personajes
                        </p>
                        <span className="text-[11px] text-[#999] bg-neutral-100 px-2 py-0.5 rounded-full font-medium">
                          {characters?.length || 0}
                        </span>
                      </div>

                      {isLoadingCharacters ? (
                        <div className="p-10 flex items-center justify-center">
                          <Loader2 className="size-5 text-[#ccc] animate-spin" />
                        </div>
                      ) : !characters || characters.length === 0 ? (
                        <div className="p-10 text-center">
                          <Users className="size-8 text-[#ddd] mx-auto mb-2" />
                          <p className="text-[13px] text-[#999]">
                            Sin personajes creados
                          </p>
                          <p className="text-[12px] text-[#bbb] mt-0.5">
                            Crea personajes desde el wizard de LISA
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-black/[0.04] max-h-[360px] overflow-y-auto">
                          {characters.map((character) => (
                            <div
                              key={character.id}
                              className="px-5 py-3 flex items-center gap-3 hover:bg-neutral-50/60 transition-colors"
                            >
                              {character.referenceImageUrl ? (
                                <img
                                  src={character.referenceImageUrl}
                                  alt={character.name}
                                  className="size-10 rounded-lg object-cover border border-black/[0.06]"
                                />
                              ) : (
                                <div className="size-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                                  <Users className="size-4 text-[#bbb]" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-[#111] truncate">
                                  {character.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-[#999] capitalize">
                                    {character.visualStyle || 'Sin estilo'}
                                  </span>
                                  {character.isPublic && (
                                    <span className="text-[11px] text-[#FF8B3D] flex items-center gap-0.5 font-medium">
                                      <Eye className="size-2.5" />
                                      Público
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => setCharacterToDelete(character)}
                                className="p-1.5 text-[#ccc] hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar personaje"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <InfoNote
                      items={[
                        'Los personajes mantienen consistencia visual en tus generaciones',
                        'Puedes hacer públicos tus personajes para que otros los usen',
                        'Eliminar un personaje es permanente',
                      ]}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ChatGPT Import Dialog */}
        <ChatGPTImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
        />

        {/* Delete Character Modal */}
        {characterToDelete && (
          <DeleteCharacterModal
            character={characterToDelete}
            isOpen={!!characterToDelete}
            onClose={() => setCharacterToDelete(null)}
            onSuccess={() => setCharacterToDelete(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
