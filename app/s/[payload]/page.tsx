'use client';

import { use } from 'react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { createMathPlugin } from '@streamdown/math';
import { decodeSharePayload } from '@/lib/share';
import { sanitizeMarkdown } from '@/lib/sanitize-markdown';

const math = createMathPlugin({ singleDollarTextMath: true });

interface SharePageProps {
  params: Promise<{ payload: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { payload } = use(params);
  const data = decodeSharePayload(payload);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-black/10 bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-[#111111]">Contenido no disponible</h1>
          <p className="mt-3 text-sm text-[#111111]/60">
            El enlace compartido no es válido o ya no está disponible.
          </p>
        </div>
      </div>
    );
  }

  const title = data.title?.trim() || 'Respuesta compartida';
  const content = sanitizeMarkdown(data.content?.trim() || '');

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[32px] border border-black/10 bg-white px-6 py-8 sm:px-10 sm:py-10 shadow-[0_28px_80px_rgba(0,0,0,0.1)]">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#111111] tracking-tight">
            {title}
          </h1>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#111111] continuum-prose">
            <Streamdown
              mode="static"
              plugins={{ code, math }}
              controls={{ code: { copy: true } }}
              lineNumbers={false}
            >
              {content}
            </Streamdown>
          </div>
          <div className="mt-8 flex justify-end text-sm font-semibold text-[#111111]/70">ContinuumAI</div>
        </div>
      </div>
    </div>
  );
}
