'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Zap, Building2, Rocket, Crown, Loader2, LogOut } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserPlan } from '@/hooks/use-user-plan';
import { billingApi, userApi, type PlanFeatureConfig } from '@/lib/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { mapModelName } from '@/lib/model-names';

const PLAN_ICONS: Record<string, typeof Zap> = {
  Basic: Rocket,
  Pro: Crown,
  Premium: Building2,
  Enterprise: Zap,
};

const PLAN_CTA: Record<string, string> = {
  Basic: 'Comenzar con Basic',
  Pro: 'Actualizar a Pro',
  Premium: 'Actualizar a Premium',
  Enterprise: 'Contactar ventas',
};

// Stripe Price IDs mapped to plan names
const STRIPE_PRICE_IDS: Record<string, { monthly: string | null; yearly: string | null }> = {
  Basic: { monthly: 'PENDING_BASIC_MONTHLY', yearly: 'PENDING_BASIC_YEARLY' },
  Pro: { monthly: 'PENDING_PRO_MONTHLY', yearly: 'PENDING_PRO_YEARLY' },
  Premium: { monthly: 'PENDING_PREMIUM_MONTHLY', yearly: 'PENDING_PREMIUM_YEARLY' },
  Enterprise: { monthly: null, yearly: null },
};

const PLAN_PRICES_USD: Record<string, { monthly: number | null; yearly: number | null }> = {
  Basic: { monthly: 10, yearly: 100 },
  Pro: { monthly: 20, yearly: 200 },
  Premium: { monthly: 149, yearly: 1490 },
  Enterprise: { monthly: null, yearly: null },
};

const PLAN_PRICES_MXN: Record<string, { monthly: number | null; yearly: number | null }> = {
  Basic: { monthly: 200, yearly: 2000 },
  Pro: { monthly: 400, yearly: 4000 },
  Premium: { monthly: 2980, yearly: 29800 },
  Enterprise: { monthly: null, yearly: null },
};

export default function PaymentPage() {
  const [frequency, setFrequency] = useState<string>('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: userPlan } = useUserPlan();
  const router = useRouter();

  // Fetch plan features from backend (single source of truth)
  const { data: planFeaturesData } = useQuery({
    queryKey: ['plan-features'],
    queryFn: () => billingApi.getPlanFeatures(),
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  const planConfigs = planFeaturesData?.plans ?? [];

  const handleLogout = useCallback(async () => {
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

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  const handleCheckout = useCallback(async (planName: string) => {
    const priceId = STRIPE_PRICE_IDS[planName]?.[frequency as 'monthly' | 'yearly'];
    if (!priceId) return;

    setLoadingPlanId(planName);
    setCheckoutError(null);
    try {
      try {
        await userApi.getProfile();
      } catch {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await userApi.getProfile();
      }

      const response = await billingApi.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment`,
      });
      if (response.url) {
        setRedirectUrl(response.url);
      } else {
        setCheckoutError('No se pudo obtener la URL de pago. Intenta nuevamente.');
        setLoadingPlanId(null);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const message = error instanceof Error ? error.message : 'Error al procesar el pago.';
      setCheckoutError(message);
      setLoadingPlanId(null);
    }
  }, [frequency]);

  return (
    <div className="min-h-screen bg-black">
      {/* Background grid pattern */}
      <div className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,rgba(255,139,61,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,139,61,0.1)_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_300px,rgba(255,139,61,0.1),transparent)]"></div>
      </div>

      <div className="relative flex flex-col gap-16 px-8 py-24 text-center">
        {/* Navigation */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Volver
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Cerrar sesión
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-8">
          {/* Header */}
          <h1 className="mb-0 text-balance font-bold text-5xl md:text-6xl tracking-tight text-white">
            Precios simples y transparentes
          </h1>
          <p className="mx-auto mt-0 mb-0 max-w-2xl text-balance text-lg text-neutral-400">
            Gestionar tu negocio es suficientemente difícil, así que ¿por qué no
            hacerte la vida más fácil? Nuestros planes escalan contigo.
          </p>

          {/* Tabs for billing frequency */}
          <Tabs defaultValue={frequency} onValueChange={setFrequency}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="monthly" className="data-[state=active]:bg-[#FF8B3D] text-white data-[state=active]:font-semibold">
                Mensual
              </TabsTrigger>
              <TabsTrigger value="yearly" className="data-[state=active]:bg-[#FF8B3D] text-white data-[state=active]:font-semibold">
                Anual
                <Badge variant="secondary" className="ml-2 bg-[#FF8B3D]/20 text-white border-0">
                  Ahorra 8%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Error message */}
          {checkoutError && (
            <div className="max-w-md mx-auto rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {checkoutError}
            </div>
          )}

          {/* Pricing cards — dynamically rendered from backend data */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {planConfigs.map((plan) => {
              const Icon = PLAN_ICONS[plan.name] ?? Zap;
              const isCurrentPlan = userPlan?.planName === plan.display.name
                || userPlan?.planName === plan.display.label;
              const pricesUsd = PLAN_PRICES_USD[plan.name];
              const priceUsd = pricesUsd?.[frequency as 'monthly' | 'yearly'];
              const pricesMxn = PLAN_PRICES_MXN[plan.name];
              const priceMxn = pricesMxn?.[frequency as 'monthly' | 'yearly'];
              const isPopular = plan.display.popular;
              const isEnterprise = plan.name === 'Enterprise';
              const isBasic = plan.name === 'Basic';
              const cta = PLAN_CTA[plan.name] ?? 'Comenzar';

              return (
                <Card
                  className={cn(
                    'relative w-full text-left border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-300',
                    isPopular && !isCurrentPlan && 'ring-2 ring-[#FF8B3D] scale-105',
                    isCurrentPlan && 'ring-2 ring-[#FF8B3D] scale-105 bg-[#FF8B3D]/5'
                  )}
                  key={plan.name}
                >
                  {isCurrentPlan ? (
                    <Badge className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 rounded-full bg-[#FF8B3D] shadow-lg shadow-[#FF8B3D]/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Tu Plan Actual
                    </Badge>
                  ) : isPopular ? (
                    <Badge className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 rounded-full bg-[#FF8B3D] hover:bg-[#FF8B3D]/90">
                      Más popular
                    </Badge>
                  ) : null}
                  <CardHeader>
                    <div className="w-12 h-12 rounded-2xl bg-[#FF8B3D]/15 flex items-center justify-center mb-4 border border-[#FF8B3D]/30">
                      <Icon className="w-6 h-6 text-[#FF8B3D]" />
                    </div>

                    <CardTitle className="font-bold text-2xl text-white">
                      {plan.display.label}
                      {isBasic && (
                        <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          7 días gratis
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      {plan.display.description}
                    </CardDescription>

                    <div className="mt-4 px-6">
                      {priceUsd != null ? (
                        <div>
                          <div className="font-semibold text-white text-3xl">
                            ${priceUsd}
                            <span className="text-lg text-neutral-400 font-normal">
                              {' '}USD/{frequency === 'monthly' ? 'mes' : 'año'}
                            </span>
                          </div>
                          {priceMxn != null && (
                            <p className="text-xs text-neutral-500 mt-1">
                              (~${priceMxn.toLocaleString()} MXN/{frequency === 'monthly' ? 'mes' : 'año'})
                            </p>
                          )}
                          <p className="text-xs text-neutral-500 mt-2">
                            Facturado {frequency === 'monthly' ? 'mensualmente' : 'anualmente'}
                          </p>
                        </div>
                      ) : (
                        <div className="font-semibold text-white text-xl">
                          Personalizado
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {plan.display.features.map((feature, index) => (
                      <div
                        className="flex items-start gap-3 text-neutral-300 text-sm"
                        key={index}
                      >
                        <Check className="h-5 w-5 text-[#FF8B3D] flex-shrink-0 mt-0.5" />
                        <span>{mapModelName(feature)}</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    {isEnterprise ? (
                      <Link href="/corporativo" className="w-full">
                        <Button
                          className="w-full border-white/20 bg-white/5 text-white hover:bg-[#FF8B3D] hover:text-white hover:border-[#FF8B3D] transition-all"
                          variant="outline"
                        >
                          {cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : isCurrentPlan ? (
                      <Button
                        className="w-full bg-[#FF8B3D]/20 text-[#d9753e] border-[#FF8B3D]/30 cursor-default"
                        variant="outline"
                        disabled
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Plan actual
                      </Button>
                    ) : (
                      <Button
                        className={cn(
                          'w-full transition-all',
                          isPopular
                            ? 'bg-[#FF8B3D] hover:bg-[#FF8B3D]/90 text-white'
                            : 'border-white/20 bg-white/5 text-white hover:bg-[#FF8B3D] hover:text-white hover:border-[#FF8B3D]'
                        )}
                        variant={isPopular ? 'default' : 'outline'}
                        disabled={loadingPlanId !== null}
                        onClick={() => handleCheckout(plan.name)}
                      >
                        {loadingPlanId === plan.name ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            {cta}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Footer info */}
          <p className="text-sm text-neutral-500 max-w-2xl mx-auto mt-8">
            Todos los planes incluyen actualizaciones gratuitas, cifrado end-to-end
            y la opción de cancelar en cualquier momento. Sin permanencia.
          </p>
        </div>
      </div>
    </div>
  );
}
