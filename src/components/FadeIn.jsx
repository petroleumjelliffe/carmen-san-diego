import { useState, useEffect } from 'react';

/**
 * FadeIn - Simple transition wrapper for smooth enter/exit animations
 * Uses CSS transitions, no external libraries
 */
export function FadeIn({ show, children, className = '', duration = 200 }) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to trigger CSS transition after mount
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsVisible(false);
      // Wait for exit animation before unmounting
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease-out',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {children}
    </div>
  );
}

export default FadeIn;
