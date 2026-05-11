/**
 * Shared layout and style constants for the right commands panel and its tabs.
 */

export const PANEL =
  "fixed top-[60px] right-0 z-40 flex h-[calc(100vh-60px)] w-[288px] flex-col border-l border-white/[0.08] bg-slate-900/90 backdrop-blur-xl shadow-[inset_-2px_0_32px_rgba(0,0,0,0.2),-8px_0_32px_rgba(0,0,0,0.15)]";

export const TAB_BAR =
  "grid grid-cols-6 gap-1 shrink-0 px-2 pt-2 pb-2 bg-gradient-to-b from-slate-800/60 to-transparent border-b border-white/[0.06]";

export const TAB_BTN = (active: boolean) =>
  `min-w-0 px-1.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide transition-all duration-200 truncate text-center ${
    active
      ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
  }`;

export const CONTENT =
  "flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5 scrollbar-modern";

export const SECTION =
  "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export const SECTION_TITLE =
  "text-[10px] font-semibold uppercase tracking-widest text-white/40";

export const BTN =
  "h-10 px-4 rounded-xl text-[11px] font-medium flex items-center justify-center gap-2 border border-white/[0.08] transition-all duration-200 hover:border-white/15 active:scale-[0.98]";

export const BTN_PRIMARY =
  "bg-gradient-to-b from-emerald-600/90 to-emerald-700/90 text-white shadow-[0_2px_12px_rgba(52,211,153,0.25)] hover:from-emerald-500/90 hover:to-emerald-600/90";

export const BTN_SECONDARY = "bg-white/[0.06] text-white/90 hover:bg-white/[0.1]";

export const BTN_DANGER =
  "bg-gradient-to-b from-rose-600/90 to-rose-700/90 text-white shadow-[0_2px_12px_rgba(244,63,94,0.2)] hover:from-rose-500/90 hover:to-rose-600/90";

export const INPUT =
  "h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[11px] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/30 transition-all";

export const LABEL =
  "text-[10px] font-medium text-white/40 tracking-wider mb-1.5 block";

export const LED = (on: boolean, orange?: boolean) =>
  `h-2 w-2 shrink-0 rounded-full ${on ? (orange ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]") : "bg-slate-500/50"}`;
