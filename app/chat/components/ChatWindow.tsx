'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';

import { useChatStore } from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const { messages, isStreaming, conversationId } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(messages.length);
  const [activeConversationSwitch, setActiveConversationSwitch] = useState<string | null>(null);
  const [, startSwitchTransition] = useTransition();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    startSwitchTransition(() => setActiveConversationSwitch(conversationId));
    const frame = requestAnimationFrame(() =>
      startSwitchTransition(() => setActiveConversationSwitch(null))
    );
    return () => cancelAnimationFrame(frame);
  }, [conversationId]);

  const isConversationSwitch = activeConversationSwitch === conversationId;

  // useLayoutEffect para scroll (evita flicker visual)
  useLayoutEffect(() => {
    const scrollContainer = containerRef.current?.parentElement?.parentElement;
    if (!scrollContainer) return;

    const shouldScrollToTop =
      isConversationSwitch ||
      messages.length < previousMessageCount.current;

    if (shouldScrollToTop) {
      scrollContainer.scrollTop = 0;
    } else if (messages.length > previousMessageCount.current) {
      // Solo scroll down si hay mensajes nuevos
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, isConversationSwitch]);

  return (
    <div
      ref={containerRef}
      className="space-y-4"
    >
      <AnimatePresence mode="sync">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={isConversationSwitch ? false : isStreaming ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={isConversationSwitch ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            transition={isConversationSwitch || isStreaming ? { duration: 0 } : {
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: index * 0.05,
            }}
          >
            <MessageBubble message={message} />
          </motion.div>
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            className="px-2"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
