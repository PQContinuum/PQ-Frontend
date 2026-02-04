"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Globe,
  Mail,
  Phone,
  Briefcase,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerificationCodeInput } from "./VerificationCodeInput";
import {
  COUNTRIES,
  OCCUPATIONS,
  getCountryByCode,
} from "@/lib/verification/constants";
import type { OccupationType } from "@/lib/api-client";
import {
  useVerificationStatus,
  useResendEmailVerification,
  useSendPhoneOtp,
  useVerifyPhoneCode,
  useCompleteProfile,
} from "@/hooks/use-verification";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface WizardState {
  fullName: string;
  country: string;
  phone: string;
  occupation: OccupationType[];
  phoneCode: string;
}

type Step = "name" | "country" | "email" | "phone" | "occupation" | "complete";

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  userEmail?: string | null;
}

// Name Step
function NameStep({ state, updateState, onNext }: StepProps) {
  const isValid = state.fullName.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-[#00552b]/10 mb-2">
          <User className="w-8 h-8 text-[#00552b]" />
        </div>
        <h2 className="text-2xl font-bold">Como te llamas?</h2>
        <p className="text-muted-foreground">
          Ingresa tu nombre completo como te gustaria que te llamemos.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          value={state.fullName}
          onChange={(e) => updateState({ fullName: e.target.value })}
          placeholder="Tu nombre completo"
          className="h-12 text-lg"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && isValid && onNext()}
        />
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full h-12 bg-[#00552b] hover:bg-[#00552b]/90"
      >
        Continuar
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}

// Country Step
function CountryStep({ state, updateState, onNext, onBack }: StepProps) {
  const selectedCountry = useMemo(
    () => getCountryByCode(state.country),
    [state.country]
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-[#00552b]/10 mb-2">
          <Globe className="w-8 h-8 text-[#00552b]" />
        </div>
        <h2 className="text-2xl font-bold">Donde te encuentras?</h2>
        <p className="text-muted-foreground">
          Selecciona tu pais de residencia.
        </p>
      </div>

      <div className="space-y-4">
        <Select
          value={state.country}
          onValueChange={(value) => updateState({ country: value })}
        >
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="Selecciona tu pais">
              {selectedCountry && (
                <span>
                  {selectedCountry.name} ({selectedCountry.phoneCode})
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name} ({country.phoneCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-12 flex-1">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Atras
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.country}
          className="h-12 flex-1 bg-[#00552b] hover:bg-[#00552b]/90"
        >
          Continuar
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Email Verification Step (via Supabase)
function EmailStep({ onNext, onBack, emailVerified, userEmail }: StepProps) {
  const [resendCountdown, setResendCountdown] = useState(0);
  const resendEmail = useResendEmailVerification();
  const { refetch } = useVerificationStatus();

  const handleResendEmail = useCallback(async () => {
    try {
      await resendEmail.mutateAsync();
      setResendCountdown(60);

      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error resending email:", err);
    }
  }, [resendEmail]);

  // Poll for email verification status
  useEffect(() => {
    if (emailVerified) return;

    const interval = setInterval(() => {
      refetch();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [emailVerified, refetch]);

  // If already verified, show success
  if (emailVerified) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Email Verificado</h2>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="h-12 flex-1">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Atras
          </Button>
          <Button
            onClick={onNext}
            className="h-12 flex-1 bg-[#00552b] hover:bg-[#00552b]/90"
          >
            Continuar
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-[#00552b]/10 mb-2">
          <Mail className="w-8 h-8 text-[#00552b]" />
        </div>
        <h2 className="text-2xl font-bold">Verifica tu Email</h2>
        <p className="text-muted-foreground">
          Hemos enviado un enlace de verificacion a:
        </p>
        <p className="font-medium text-lg">{userEmail}</p>
      </div>

      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Revisa tu bandeja de entrada y haz clic en el enlace de verificacion.
          Si no lo encuentras, revisa la carpeta de spam.
        </p>
      </div>

      <div className="text-center space-y-3">
        {resendCountdown > 0 ? (
          <p className="text-sm text-muted-foreground">
            Reenviar email en {resendCountdown}s
          </p>
        ) : (
          <button
            onClick={handleResendEmail}
            disabled={resendEmail.isPending}
            className="text-[#00552b] hover:underline text-sm flex items-center justify-center gap-2 mx-auto"
          >
            {resendEmail.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Reenviar email de verificacion
              </>
            )}
          </button>
        )}

        <p className="text-xs text-muted-foreground">
          Esta pagina se actualizara automaticamente cuando verifiques tu email.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-12 flex-1">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Atras
        </Button>
      </div>
    </div>
  );
}

// Phone Verification Step (via Supabase OTP)
function PhoneStep({
  state,
  updateState,
  onNext,
  onBack,
  phoneVerified,
}: StepProps) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sendPhoneOtp = useSendPhoneOtp();
  const verifyPhoneCode = useVerifyPhoneCode();

  const selectedCountry = useMemo(
    () => getCountryByCode(state.country),
    [state.country]
  );

  const fullPhoneNumber = useMemo(() => {
    if (!selectedCountry || !state.phone) return "";
    const cleanPhone = state.phone.replace(/\D/g, "");
    return `${selectedCountry.phoneCode}${cleanPhone}`;
  }, [selectedCountry, state.phone]);

  const isPhoneValid = useMemo(
    () => state.phone.replace(/\D/g, "").length >= 8,
    [state.phone]
  );

  const handleSendCode = useCallback(async () => {
    if (!isPhoneValid) return;

    setError(null);
    try {
      await sendPhoneOtp.mutateAsync({ phone: fullPhoneNumber });
      setShowCodeInput(true);
      setResendCountdown(60);

      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el SMS");
    }
  }, [fullPhoneNumber, isPhoneValid, sendPhoneOtp]);

  const handleVerifyCode = useCallback(
    async (code: string) => {
      setError(null);
      try {
        const result = await verifyPhoneCode.mutateAsync({
          phone: fullPhoneNumber,
          code,
        });
        if (result.verified) {
          onNext();
        } else {
          setError("Codigo incorrecto. Intenta de nuevo.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al verificar el codigo"
        );
      }
    },
    [fullPhoneNumber, verifyPhoneCode, onNext]
  );

  // If already verified
  if (phoneVerified) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Telefono Verificado</h2>
          <p className="text-muted-foreground">{fullPhoneNumber || "Tu telefono ha sido verificado"}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="h-12 flex-1">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Atras
          </Button>
          <Button
            onClick={onNext}
            className="h-12 flex-1 bg-[#00552b] hover:bg-[#00552b]/90"
          >
            Continuar
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-[#00552b]/10 mb-2">
          <Phone className="w-8 h-8 text-[#00552b]" />
        </div>
        <h2 className="text-2xl font-bold">Verifica tu Telefono</h2>
        <p className="text-muted-foreground">
          {showCodeInput
            ? `Ingresa el codigo de 6 digitos enviado a ${fullPhoneNumber}`
            : "Te enviaremos un codigo de verificacion por SMS."}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      {!showCodeInput ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <Input
                value={selectedCountry?.phoneCode || ""}
                disabled
                className="h-12 text-center font-mono"
              />
            </div>
            <Input
              type="tel"
              value={state.phone}
              onChange={(e) => updateState({ phone: e.target.value })}
              placeholder="Tu numero de telefono"
              className="h-12 flex-1"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="h-12 flex-1">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Atras
            </Button>
            <Button
              onClick={handleSendCode}
              disabled={!isPhoneValid || sendPhoneOtp.isPending}
              className="h-12 flex-1 bg-[#00552b] hover:bg-[#00552b]/90"
            >
              {sendPhoneOtp.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Enviar SMS
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <VerificationCodeInput
            value={state.phoneCode}
            onChange={(value) => updateState({ phoneCode: value })}
            onComplete={handleVerifyCode}
            disabled={verifyPhoneCode.isPending}
            error={!!error}
            autoFocus
          />

          {verifyPhoneCode.isPending && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#00552b]" />
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {resendCountdown > 0 ? (
              <span>Reenviar codigo en {resendCountdown}s</span>
            ) : (
              <button
                onClick={handleSendCode}
                disabled={sendPhoneOtp.isPending}
                className="text-[#00552b] hover:underline"
              >
                Reenviar SMS
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCodeInput(false);
                updateState({ phoneCode: "" });
              }}
              className="h-12 flex-1"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Cambiar Telefono
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Occupation Step
function OccupationStep({
  state,
  updateState,
  onNext,
  onBack,
  isLoading,
}: StepProps) {
  const toggleOccupation = useCallback(
    (value: OccupationType) => {
      const current = state.occupation;
      if (current.includes(value)) {
        updateState({ occupation: current.filter((o) => o !== value) });
      } else {
        updateState({ occupation: [...current, value] });
      }
    },
    [state.occupation, updateState]
  );

  const isValid = state.occupation.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-[#00552b]/10 mb-2">
          <Briefcase className="w-8 h-8 text-[#00552b]" />
        </div>
        <h2 className="text-2xl font-bold">A que te dedicas?</h2>
        <p className="text-muted-foreground">
          Selecciona una o mas opciones que te describan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OCCUPATIONS.map((occupation) => {
          const isSelected = state.occupation.includes(occupation.value);
          return (
            <button
              key={occupation.value}
              onClick={() => toggleOccupation(occupation.value)}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                isSelected
                  ? "border-[#00552b] bg-[#00552b]/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <div className="font-medium">{occupation.label}</div>
              <div className="text-sm text-muted-foreground">
                {occupation.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-12 flex-1">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Atras
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid || isLoading}
          className="h-12 flex-1 bg-[#00552b] hover:bg-[#00552b]/90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Completar
              <CheckCircle className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Complete Step
function CompleteStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex p-4 rounded-full bg-green-500/10">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Verificacion Completa!</h2>
        <p className="text-muted-foreground">
          Tu perfil ha sido verificado exitosamente. Ya puedes acceder a todas
          las funciones de la plataforma.
        </p>
      </div>

      <Button
        onClick={onComplete}
        className="w-full h-12 bg-[#00552b] hover:bg-[#00552b]/90"
      >
        Comenzar a Explorar
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

interface ProfileVerificationWizardProps {
  onComplete?: () => void;
}

export function ProfileVerificationWizard({
  onComplete,
}: ProfileVerificationWizardProps) {
  const { data: status, isLoading: isStatusLoading } = useVerificationStatus();
  const completeProfile = useCompleteProfile();

  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [state, setState] = useState<WizardState>({
    fullName: "",
    country: "",
    phone: "",
    occupation: [],
    phoneCode: "",
  });

  // Initialize from server status
  useEffect(() => {
    if (status) {
      setState((prev) => ({
        ...prev,
        fullName: status.fullName || prev.fullName,
        country: status.country || prev.country,
        occupation: status.occupation || prev.occupation,
      }));
    }
  }, [status]);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const steps: Step[] = ["name", "country", "email", "phone", "occupation"];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = useCallback(async () => {
    if (currentStep === "occupation") {
      // Submit profile completion
      try {
        await completeProfile.mutateAsync({
          fullName: state.fullName,
          country: state.country,
          occupation: state.occupation,
        });
        setCurrentStep("complete");
      } catch (error) {
        console.error("Error completing profile:", error);
      }
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex]);
      }
    }
  }, [currentStep, currentStepIndex, steps, state, completeProfile]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  }, [currentStepIndex, steps]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Loading state
  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00552b]" />
      </div>
    );
  }

  const stepProps: StepProps = {
    state,
    updateState,
    onNext: handleNext,
    onBack: handleBack,
    isLoading: completeProfile.isPending,
    emailVerified: status?.emailVerified ?? false,
    phoneVerified: status?.phoneVerified ?? false,
    userEmail: status?.email,
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      {currentStep !== "complete" && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Paso {currentStepIndex + 1} de {steps.length}
            </span>
            <span className="text-sm font-medium">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00552b] transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>Tus datos estan seguros con Supabase</span>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === "name" && <NameStep {...stepProps} />}
          {currentStep === "country" && <CountryStep {...stepProps} />}
          {currentStep === "email" && <EmailStep {...stepProps} />}
          {currentStep === "phone" && <PhoneStep {...stepProps} />}
          {currentStep === "occupation" && <OccupationStep {...stepProps} />}
          {currentStep === "complete" && (
            <CompleteStep onComplete={handleComplete} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
