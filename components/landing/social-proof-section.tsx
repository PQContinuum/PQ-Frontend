"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Se siente como tener un equipo completo trabajando contigo.",
    author: "L. Martínez",
  },
  {
    quote: "El único asistente que realmente entiende mi estilo.",
    author: "R. Ortega",
  },
  {
    quote: "Rápido, elegante y simplemente útil.",
    author: "M. Vega",
  },
];

export function SocialProofSection() {
  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2rem_2rem]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Lo que dicen quienes ya lo usan
          </h2>
          <p className="text-lg text-neutral-400">
            Miles de profesionales confían en nosotros cada día
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-white/5 bg-black/40 backdrop-blur-sm hover:border-[#00552b]/30 hover:bg-black/60 transition-all duration-300"
            >
              <CardContent className="p-8 space-y-6">
                {/* Quote icon */}
                <div className="w-10 h-10 rounded-xl bg-[#00552b]/10 flex items-center justify-center border border-[#00552b]/20">
                  <Quote className="w-5 h-5 text-[#00552b]" />
                </div>

                {/* Quote */}
                <blockquote className="text-white text-lg leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00552b]/20 flex items-center justify-center border border-[#00552b]/30">
                    <span className="text-sm font-semibold text-[#00552b]">
                      {testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-400">
                    — {testimonial.author}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
