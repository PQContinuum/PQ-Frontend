"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "¿Puedo cancelar en cualquier momento?",
    answer:
      "Sí, sin contratos ni permanencias. Tu plan sigue activo hasta el final del período facturado.",
  },
  {
    question: "¿Guardan mis conversaciones?",
    answer:
      "Solo si activas el historial. Por defecto, no almacenamos nada sin tu permiso explícito.",
  },
  {
    question: "¿El plan Free es realmente gratis?",
    answer:
      "Totalmente. Sin tarjeta, sin trampas. Acceso permanente.",
  },
  {
    question: "¿Requiere tarjeta para el Free?",
    answer: "No. Solo email para crear tu cuenta.",
  },
  {
    question: "¿Puedo cambiar de plan después?",
    answer:
      "Sí. Actualiza o degrada cuando quieras desde tu panel.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Tarjeta de crédito/débito, PayPal y transferencia (solo plan anual).",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#00552b]/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-neutral-400">
            Todo lo que necesitas saber
          </p>
        </div>

        {/* FAQ list */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="border-white/5 bg-black/40 backdrop-blur-sm hover:border-[#00552b]/30 transition-all duration-300"
            >
              <CardContent className="p-0">
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group"
                >
                  <span className="text-lg font-semibold text-white group-hover:text-[#00552b] transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-400 transition-transform flex-shrink-0 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact info */}
        <p className="text-center text-sm text-neutral-500 mt-12">
          ¿Tienes otra pregunta?{" "}
          <a
            href="#"
            className="text-[#00552b] hover:text-[#00552b]/80 hover:underline transition-colors"
          >
            Contáctanos
          </a>
        </p>
      </div>
    </section>
  );
}
