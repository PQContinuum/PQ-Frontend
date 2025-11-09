'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { useChatStore } from '@/app/chat/store';

import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatWindow() {
  const { messages, isStreaming } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);

  useEffect(() => {
    const currentCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    if (currentCount < previousCount) {
      const scrollContainer = containerRef.current?.parentElement?.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    } else {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    previousMessageCountRef.current = currentCount;
  }, [messages, isStreaming]);

  return (
    <motion.div
      ref={containerRef}
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={isStreaming ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={isStreaming ? { duration: 0 } : {
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: index * 0.05,
            }}
            layout
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
    </motion.div>
  );
}
