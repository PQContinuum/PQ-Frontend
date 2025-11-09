'use client';

import { useChatStore, TYPING_STATES } from '@/app/chat/store';

export function TypingIndicator() {
  const typingStateIndex = useChatStore((state) => state.typingStateIndex);

  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-2 py-2 text-sm text-[#4c4c4c]">
      <span className="text-md text-[#111111] transition-opacity duration-300">
        {TYPING_STATES[typingStateIndex]}
      </span>
      <div className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1 w-1 rounded-full bg-black/50"
            style={{
              animation: 'typing 1.2s infinite',
              animationDelay: `${dot * 0.15}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes typing {
          0% {
            opacity: 0.2;
            transform: translateY(0px);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px);
          }
          100% {
            opacity: 0.2;
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}
