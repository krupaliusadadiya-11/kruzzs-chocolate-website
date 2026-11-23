type P = { size?: number; className?: string };
const S = ({ size = 22, className, children }: P & { children: React.ReactNode }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const Search = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </S>
);
export const User = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.3-3.6 4.2-5.4 7.5-5.4s6.2 1.8 7.5 5.4" />
  </S>
);
export const Bag = (p: P) => (
  <S {...p}>
    <path d="M5 8.5h14l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H7.6a1.5 1.5 0 0 1-1.5-1.3L5 8.5Z" />
    <path d="M8.7 8.5V7a3.3 3.3 0 0 1 6.6 0v1.5" />
  </S>
);
export const Heart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg className={p.className} width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20.3s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.2-7.5 10.2Z" />
  </svg>
);
export const Close = (p: P) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
);
export const Plus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const Minus = (p: P) => (
  <S {...p}>
    <path d="M5 12h14" />
  </S>
);
export const Arrow = (p: P) => (
  <S {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </S>
);
export const Eye = (p: P) => (
  <S {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </S>
);
export const Menu = (p: P) => (
  <S {...p}>
    <path d="M4 8h16M4 16h16" />
  </S>
);
export const Instagram = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </S>
);
export const Pinterest = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M10.6 20.4 12.2 13m0 0c.4 1.1 1.3 1.6 2.3 1.6 2.1 0 3.4-2 3.4-4.4 0-2.6-2.2-4.4-5-4.4-3.1 0-5 2.1-5 4.6 0 1 .4 2 1.1 2.4" />
  </S>
);
export const Facebook = (p: P) => (
  <S {...p}>
    <path d="M14.5 21v-7.5h2.6l.4-3h-3V8.8c0-.9.3-1.5 1.6-1.5h1.5V4.6a20 20 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 3.9v2.1H9v3h2.5V21" />
  </S>
);
