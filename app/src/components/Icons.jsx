export function ToothLogo({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <defs>
        <linearGradient id="tg" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" /><stop offset=".55" stopColor="#f8fbff" /><stop offset="1" stopColor="#dfeaff" />
        </linearGradient>
      </defs>
      <path d="M12 2.6c-1.25 0-2 .55-2.65.78-.78.28-1.55.2-2.3.68-1.05.68-1.8 1.98-1.8 3.65 0 1.85.72 3.45 1.4 5.12.63 1.55.88 3.15 1.1 5.18.18 1.72 1.05 3.4 2.35 3.4 1.03 0 1.28-1.45 1.45-3.2.12-1.22.28-2.35.45-3.25.17.9.33 2.03.45 3.25.17 1.75.42 3.2 1.45 3.2 1.3 0 2.17-1.68 2.35-3.4.22-2.03.47-3.63 1.1-5.18.68-1.67 1.4-3.27 1.4-5.12 0-1.67-.75-2.97-1.8-3.65-.75-.48-1.52-.4-2.3-.68-.65-.23-1.4-.78-2.65-.78Z" fill="url(#tg)" />
    </svg>
  );
}

const S = ({ d, size = 18, style, className }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}><path d={d} /></svg>);

export const Icons = {
  dashboard: (p) => <S {...p} d="M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-4H4v4zM14 4v5h6V4h-6z" />,
  appointments: (p) => <S {...p} d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 14l2 2 4-4" />,
  patients: (p) => <S {...p} d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM2 20c0-3.3 2.7-6 6-6 1.6 0 3 .6 4.1 1.6M14 20c0-3 2.2-5.5 5-5.9" />,
  records: (p) => <S {...p} d="M9 2h6l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM9 13h6M9 17h6M9 9h2" />,
  plans: (p) => <S {...p} d="M9 3h7l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4zM9 12l2 2 4-4" />,
  lab: (p) => <S {...p} d="M9 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 8V2M9 2h6M7.5 14h9" />,
  billing: (p) => <S {...p} d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7zM3 7l2-4h14l2 4M9 12h6" />,
  stock: (p) => <S {...p} d="M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4M21 7l-9 4M12 11v10" />,
  suppliers: (p) => <S {...p} d="M3 6h13l5 5v6a1 1 0 0 1-1 1h-1M5 6v12a1 1 0 0 0 1 1h7M16 6v6h5M7 16h4" />,
  staff: (p) => <S {...p} d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM2 20c0-3.3 2.7-6 6-6 1.6 0 3 .6 4.1 1.6M14 20c0-3 2.2-5.5 5-5.9" />,
  staffonboard: (p) => <S {...p} d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM2 20c0-3.3 2.7-6 6-6 1.6 0 3 .6 4.1 1.6M14 20c0-3 2.2-5.5 5-5.9M19 7v6M22 10h-6" />,
  reports: (p) => <S {...p} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  settings: (p) => <S {...p} d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM19 12c0 .5 0 1-.1 1.4l2 1.5-2 3.4-2.4-1a7 7 0 0 1-2.4 1.4L16 21h-4l-.3-2.4a7 7 0 0 1-2.4-1.4l-2.4 1-2-3.4 2-1.5c-.1-.4-.1-.9-.1-1.4s0-1 .1-1.4l-2-1.5 2-3.4 2.4 1a7 7 0 0 1 2.4-1.4L12 3h4l.3 2.4a7 7 0 0 1 2.4 1.4l2.4-1 2 3.4-2 1.5c.1.4.1.9.1 1.4z" />,
  lock: (p) => <S {...p} d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9zM12 15v2" />,
  back: (p) => <S {...p} d="M19 12H5M12 19l-7-7 7-7" />,
  plus: (p) => <S {...p} d="M12 5v14M5 12h14" />,
  search: (p) => <S {...p} d="M11 19a8 8 0 1 0-8-8 8 8 0 0 0 8 8zM21 21l-4.3-4.3" />,
  download: (p) => <S {...p} d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  upload: (p) => <S {...p} d="M12 15V3M7 8l5-5 5 5M5 21h14" />,
  check: (p) => <S {...p} d="M20 6L9 17l-5-5" />,
};
