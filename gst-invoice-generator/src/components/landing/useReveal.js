import { useEffect, useRef, useState } from 'react'

/**
 * Reveal-on-scroll observer.
 *
 * One observer per element, unobserved as soon as it fires so the animation
 * never replays — replaying on every scroll pass is what makes this effect
 * feel cheap. Honours prefers-reduced-motion by showing content immediately.
 *
 * Lives in its own module so ui.jsx only exports components (react-refresh).
 */
export function useReveal(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px', ...options }
    )

    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [ref, visible]
}

export default useReveal
