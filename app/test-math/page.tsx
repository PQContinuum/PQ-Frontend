'use client';

import React from 'react';
import { MathProvider, MathRenderer } from '@/components/math-renderer';

/**
 * Example page: renders multiple formulas using MathRenderer.
 *
 * Visit: /test-math
 */
export default function TestMathPage() {
  const formulas = [
    { label: 'Energia-masa', latex: 'E = mc^2' },
    {
      label: 'Formula cuadratica',
      latex: '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    },
    {
      label: 'Integral de Gauss',
      latex: '\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}',
    },
    {
      label: 'Serie famosa',
      latex: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
    },
    {
      label: 'Matriz',
      latex: '\\begin{bmatrix}1 & 2 \\\\ 3 & 4\\end{bmatrix}',
    },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">MathJax Demo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Ejemplo de uso de <code className="font-mono">MathRenderer</code> usando{' '}
        <code className="font-mono">better-react-mathjax</code>.
      </p>

      {/* IMPORTANT: Wrap math content in MathProvider (MathJaxContext). */}
      <MathProvider>
        <div className="mt-6 grid gap-4">
          {formulas.map((f) => (
            <section
              key={f.label}
              className="rounded-xl border border-black/10 bg-white p-4"
            >
              <div className="text-sm font-medium text-gray-700">{f.label}</div>
              <div className="mt-3">
                <MathRenderer latex={f.latex} />
              </div>
            </section>
          ))}

          <section className="rounded-xl border border-black/10 bg-white p-4">
            <div className="text-sm font-medium text-gray-700">Inline</div>
            <p className="mt-3 text-gray-700">
              La derivada de{' '}
              <MathRenderer latex="x^2" inline className="mx-1" />
              es <MathRenderer latex="2x" inline className="mx-1" />.
            </p>
          </section>
        </div>
      </MathProvider>
    </main>
  );
}
