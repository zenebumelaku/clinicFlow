import React, { useEffect, useRef, useState } from 'react';

export type RevealAnimation = 'fade-up' | 'fade-in' | 'scale-up' | 'slide-right' | 'slide-left' | 'image-reveal';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: RevealAnimation;
  delay?: number; // ms
  duration?: number; // ms
  className?: string;
  threshold?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
  threshold = 0.12,
  once = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once && elementRef.current) {
              observer.unobserve(elementRef.current);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
      observer.disconnect();
    };
  }, [threshold, once]);

  const getAnimationStyles = (): React.CSSProperties => {
    const baseTransition: React.CSSProperties = {
      transitionProperty: 'opacity, transform, filter',
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      transitionDelay: `${delay}ms`
    };

    if (isVisible) {
      return {
        ...baseTransition,
        opacity: 1,
        transform: 'none',
        filter: 'none'
      };
    }

    switch (animation) {
      case 'fade-up':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'translateY(24px)'
        };
      case 'scale-up':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'scale(0.96)'
        };
      case 'slide-right':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'translateX(-24px)'
        };
      case 'slide-left':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'translateX(24px)'
        };
      case 'image-reveal':
        return {
          ...baseTransition,
          opacity: 0,
          transform: 'scale(0.97) translateY(12px)',
          filter: 'blur(4px)'
        };
      case 'fade-in':
      default:
        return {
          ...baseTransition,
          opacity: 0
        };
    }
  };

  return (
    <div ref={elementRef} className={className} style={getAnimationStyles()}>
      {children}
    </div>
  );
};
