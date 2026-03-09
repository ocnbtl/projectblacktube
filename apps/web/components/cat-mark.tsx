export function CatMark() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="cat-mark">
      <defs>
        <linearGradient id="fur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dde4df" />
          <stop offset="100%" stopColor="#9ba8a0" />
        </linearGradient>
      </defs>
      <path d="M24 36 38 14l16 18c3-1 7-2 11-2s8 1 11 2l16-18 14 22v40c0 16-13 28-29 28H53C37 104 24 92 24 76Z" fill="url(#fur)" />
      <path d="M44 54c4-6 11-9 16-9 6 0 12 3 16 9" fill="none" stroke="#41514a" strokeWidth="4" strokeLinecap="round" />
      <path d="M42 70c6 8 15 12 18 12 4 0 13-4 18-12" fill="none" stroke="#41514a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="48" cy="56" r="4" fill="#24312c" />
      <circle cx="72" cy="56" r="4" fill="#24312c" />
      <path d="M60 61l-4 7h8Z" fill="#24312c" />
      <path d="M24 59h16" stroke="#6f8078" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 69h18" stroke="#6f8078" strokeWidth="4" strokeLinecap="round" />
      <path d="M96 59h-16" stroke="#6f8078" strokeWidth="4" strokeLinecap="round" />
      <path d="M100 69H82" stroke="#6f8078" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

