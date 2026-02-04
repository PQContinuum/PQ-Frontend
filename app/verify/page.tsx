"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProfileVerificationWizard } from "@/components/verification";
import { useVerificationStatus } from "@/hooks/use-verification";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const { data: status, isLoading } = useVerificationStatus();

  // Redirect to chat if already verified
  useEffect(() => {
    if (status?.profileCompleted) {
      router.push("/chat");
    }
  }, [status, router]);

  const handleComplete = () => {
    router.push("/chat");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-[#00552b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenido a Continuum</h1>
          <p className="text-muted-foreground">
            Completa tu perfil para acceder a todas las funciones
          </p>
        </div>
        <div className="bg-card rounded-xl border shadow-lg p-6">
          <ProfileVerificationWizard onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
