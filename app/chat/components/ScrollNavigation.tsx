'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollNavigationProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

export function ScrollNavigation({
  scrollContainerRef,
}: ScrollNavigationProps) {
  const [showTopButton, setShowTopButton] = useState(false);
  const [showBottomButton, setShowBottomButton] = useState(false);
  const [highlightBottom, setHighlightBottom] = useState(false);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const prevScrollHeight = useRef(0);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      console.log('[ScrollNav] No container');
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Más permisivo: solo necesita 50px de contenido scrolleable
    const hasScroll = scrollHeight > clientHeight + 50;
    const isAtTop = scrollTop <= 10;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

    console.log('[ScrollNav] Check:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      hasScroll,
      isAtTop,
      isAtBottom,
      shouldShowTop: hasScroll && !isAtTop,
      shouldShowBottom: hasScroll && !isAtBottom
    });

    // Solo mostrar UN botón a la vez:
    // - Prioridad: Scroll to Bottom (si no está en el fondo)
    // - Scroll to Top: solo si ya está en el fondo pero hay contenido arriba
    if (hasScroll && !isAtBottom) {
      setShowTopButton(false);
      setShowBottomButton(true);
    } else if (hasScroll && !isAtTop) {
      setShowTopButton(true);
      setShowBottomButton(false);
    } else {
      setShowTopButton(false);
      setShowBottomButton(false);
    }

    // Actualizar posición del contenedor para posicionar los botones
    setContainerRect(container.getBoundingClientRect());

    // Detect new content and highlight bottom button if not at bottom
    if (scrollHeight > prevScrollHeight.current && !isAtBottom && hasScroll) {
      setHighlightBottom(true);
    }

    if (isAtBottom) {
      setHighlightBottom(false);
    }

    prevScrollHeight.current = scrollHeight;
  }, [scrollContainerRef]);

  // Efecto inicial y para detectar cuando el ref se asigna
  useEffect(() => {
    // Verificar periódicamente hasta que el container esté disponible
    const checkInterval = setInterval(() => {
      if (scrollContainerRef.current) {
        console.log('[ScrollNav] Container found, setting up listeners');
        clearInterval(checkInterval);

        const container = scrollContainerRef.current;

        // Check inicial
        checkScrollPosition();

        // Event listeners
        container.addEventListener('scroll', checkScrollPosition, { passive: true });

        // Observer para cambios en el contenido
        const mutationObserver = new MutationObserver(() => {
          requestAnimationFrame(checkScrollPosition);
        });
        mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });

        // Observer para cambios de tamaño
        const resizeObserver = new ResizeObserver(() => {
          requestAnimationFrame(checkScrollPosition);
        });
        resizeObserver.observe(container);

        // Cleanup en un return diferido
        return () => {
          container.removeEventListener('scroll', checkScrollPosition);
          mutationObserver.disconnect();
          resizeObserver.disconnect();
        };
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
    };
  }, [scrollContainerRef, checkScrollPosition]);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [scrollContainerRef]);

  const scrollToBottom = useCallback(() => {
    setHighlightBottom(false);
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [scrollContainerRef]);

  const showButtons = showTopButton || showBottomButton;

  // Calcular posición de los botones basado en el contenedor
  const buttonPosition = containerRect ? {
    right: window.innerWidth - containerRect.right + 16,
    bottom: window.innerHeight - containerRect.bottom + 16,
  } : { right: 24, bottom: 100 };

  return (
    <AnimatePresence>
      {showButtons && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{
            duration: 0.25,
            ease: [0.34, 1.56, 0.64, 1]
          }}
          style={{
            position: 'fixed',
            right: buttonPosition.right,
            bottom: buttonPosition.bottom,
            zIndex: 100,
          }}
        >
          <AnimatePresence mode="wait">
            {showTopButton && (
              <motion.button
                key="scroll-top"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  duration: 0.2,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                onClick={scrollToTop}
                className="
                  grid place-items-center
                  w-12 h-12
                  rounded-2xl
                  bg-gradient-to-br from-white to-gray-50
                  border border-white/80
                  shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)]
                  text-[#934f2c]
                  transition-all duration-300
                  outline-none
                  dark:from-zinc-800 dark:to-zinc-900 dark:border-white/10
                  dark:text-[#d9753e] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]
                "
                aria-label="Ir al inicio del chat"
                title="Ir al inicio"
              >
                <ChevronUp className="w-5 h-5" strokeWidth={2} />
              </motion.button>
            )}

            {showBottomButton && (
              <motion.button
                key="scroll-bottom"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  duration: 0.2,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                onClick={scrollToBottom}
                className={`
                  relative grid place-items-center
                  w-12 h-12
                  rounded-2xl
                  transition-all duration-300
                  outline-none
                  ${highlightBottom
                    ? 'bg-gradient-to-br from-[#934f2c] to-[#6b3a20] text-white border border-[#934f2c]/50 shadow-[0_4px_20px_-4px_rgba(147,79,44,0.5)] dark:from-[#d9753e] dark:to-[#b5622f] dark:border-[#d9753e]/50 dark:shadow-[0_4px_20px_-4px_rgba(217,117,62,0.4)]'
                    : 'bg-gradient-to-br from-white to-gray-50 border border-white/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] text-[#934f2c] dark:from-zinc-800 dark:to-zinc-900 dark:border-white/10 dark:text-[#d9753e] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]'
                  }
                `}
                aria-label="Ir al final del chat"
                title={highlightBottom ? 'Nuevos mensajes - Ir al final' : 'Ir al final'}
              >
                <ChevronDown className="w-5 h-5" strokeWidth={2} />
                {highlightBottom && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
