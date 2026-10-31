'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement).closest('a')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
        setLoading(true)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    setLoading(false)
  }, [pathname])

  return (
    <>
      <style>{`
        .pt-bar {
          position: fixed; top: 0; left: 0; width: 100%; height: 2px; z-index: 100;
          background: linear-gradient(90deg, #2f7f7a, #5FAE8C, #d9a441);
          box-shadow: 0 0 12px rgba(95, 174, 140, 0.85);
          transform: scaleX(0); transform-origin: left; opacity: 0;
          transition: transform 0.25s ease, opacity 0.3s ease;
          pointer-events: none;
        }
        .pt-bar.on {
          opacity: 1; transform: scaleX(0.85);
          transition: transform 2.5s cubic-bezier(0.1, 0.6, 0.3, 1), opacity 0.15s ease;
        }
        .pt-page {
          animation: pt-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes pt-in {
          from { opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(6px); }
          to   { opacity: 1; transform: none; filter: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pt-bar, .pt-page { animation: none; transition: none; }
        }
        @media print {
          .pt-bar { display: none !important; }
          .pt-page { animation: none !important; filter: none !important; transform: none !important; }
        }
      `}</style>

      <div className={`pt-bar ${loading ? 'on' : ''}`} aria-hidden="true" />
      <div key={pathname} className="pt-page">
        {children}
      </div>
    </>
  )
}
