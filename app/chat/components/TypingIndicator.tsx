'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#4c4c4c]">
      <span className="text-xs uppercase tracking-[0.3em] text-[#111111]">
        ChatGPT
      </span>
      <div className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 rounded-full bg-black/50"
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
