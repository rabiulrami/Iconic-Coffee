import React from 'react';
import { SHOP_PHONE_DISPLAY, whatsappLink } from '../data';

interface WhatsAppButtonProps {
  /** Lifted clear of the floating cart bar when one is showing. */
  raised?: boolean;
}

/**
 * Always-on WhatsApp shortcut.
 *
 * wa.me hands off to the installed app on a phone and to WhatsApp Web on desktop, so
 * one link covers both. It sits inside a max-w-md column rather than pinned to the
 * viewport edge, otherwise on desktop it would float far away from the menu itself.
 */
export default function WhatsAppButton({ raised = false }: WhatsAppButtonProps) {
  return (
    <div
      // The offset is an inline style, not a Tailwind class: an arbitrary value that
      // only ever appears inside a ternary can be missed by the class scanner, and
      // then the button silently never lifts off the cart bar.
      style={{ bottom: raised ? 86 : 20 }}
      className="fixed inset-x-0 z-40 pointer-events-none max-w-md mx-auto px-4 flex justify-end transition-all duration-300"
    >
      <a
        href={whatsappLink('Hello Iconic Coffee, I would like to ask about my order.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Message us on WhatsApp at ${SHOP_PHONE_DISPLAY}`}
        title={`WhatsApp ${SHOP_PHONE_DISPLAY}`}
        className="pointer-events-auto group relative flex items-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5A] text-white pl-3.5 pr-4 py-3 shadow-lift active:scale-95 transition-all duration-200"
      >
        {/* Soft pulse to draw the eye without animating the button itself */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-whatsappPulse" aria-hidden />

        <svg viewBox="0 0 24 24" className="w-5 h-5 relative shrink-0" fill="currentColor" aria-hidden>
          <path d="M17.47 14.38c-.3-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.95-.93 1.15-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.06 2.86 1.2 3.05c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.62.71.22 1.35.19 1.86.12.57-.09 1.74-.71 1.99-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2.1 22l5.34-1.4a9.83 9.83 0 0 0 4.6 1.17h.01c5.43 0 9.85-4.42 9.85-9.86 0-2.63-1.02-5.11-2.88-6.97A9.79 9.79 0 0 0 12.04 2zm0 17.94h-.01c-1.45 0-2.87-.39-4.11-1.13l-.3-.17-3.05.8.81-2.97-.19-.31a8.14 8.14 0 0 1-1.25-4.35c0-4.51 3.68-8.19 8.2-8.19 2.19 0 4.24.86 5.79 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.52-3.68 8.19-8.19 8.19z" />
        </svg>

        <span className="relative text-[13px] font-semibold whitespace-nowrap">WhatsApp</span>
      </a>
    </div>
  );
}
