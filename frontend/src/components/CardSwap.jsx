import React, { useEffect, useRef } from 'react';
import gsapModule from 'gsap';
import './CardSwap.css';

const gsap = gsapModule?.gsap || gsapModule;

export const Card = ({ customClass = '', className = '', style = {}, children, ...rest }) => (
  <div
    {...rest}
    style={style}
    className={`card ${customClass} ${className}`.trim()}
  >
    {children}
  </div>
);

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

export default function CardSwap({
  width = 380,
  height = 250,
  cardDistance = 45,
  verticalDistance = 35,
  delay = 4500,
  pauseOnHover = true,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children
}) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const orderRef = useRef([]);
  const tlRef = useRef(null);

  const childArray = React.Children.toArray(children);

  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  useEffect(() => {
    let intervalId;
    try {
      const els = cardRefs.current.filter((el) => el && el instanceof HTMLElement);
      if (els.length < 2) return;

      orderRef.current = Array.from({ length: els.length }, (_, i) => i);

      els.forEach((el, i) => {
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, els.length);
        if (gsap && typeof gsap.set === 'function') {
          gsap.set(el, {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            xPercent: -50,
            yPercent: -50,
            skewY: skewAmount,
            transformOrigin: 'center center',
            zIndex: slot.zIndex,
            force3D: true
          });
        } else {
          el.style.transform = `translate(-50%, -50%) translate3d(${slot.x}px, ${slot.y}px, ${slot.z}px) skewY(${skewAmount}deg)`;
          el.style.zIndex = slot.zIndex;
        }
      });

      const swap = () => {
        try {
          if (!orderRef.current || orderRef.current.length < 2) return;

          const currentEls = cardRefs.current.filter((el) => el && el instanceof HTMLElement);
          if (currentEls.length < 2) return;

          const [front, ...rest] = orderRef.current;
          const elFront = cardRefs.current[front];
          if (!elFront || !(elFront instanceof HTMLElement)) return;

          if (!gsap || typeof gsap.timeline !== 'function') return;

          const tl = gsap.timeline();
          tlRef.current = tl;

          tl.to(elFront, {
            y: '+=500',
            duration: config.durDrop,
            ease: config.ease
          });

          tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
          rest.forEach((idx, i) => {
            const el = cardRefs.current[idx];
            if (!el || !(el instanceof HTMLElement)) return;
            const slot = makeSlot(i, cardDistance, verticalDistance, currentEls.length);
            tl.set(el, { zIndex: slot.zIndex }, 'promote');
            tl.to(
              el,
              {
                x: slot.x,
                y: slot.y,
                z: slot.z,
                duration: config.durMove,
                ease: config.ease
              },
              `promote+=${i * 0.15}`
            );
          });

          const backSlot = makeSlot(currentEls.length - 1, cardDistance, verticalDistance, currentEls.length);
          tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
          tl.call(
            () => {
              if (elFront && elFront instanceof HTMLElement && gsap.set) {
                gsap.set(elFront, { zIndex: backSlot.zIndex });
              }
            },
            undefined,
            'return'
          );
          tl.to(
            elFront,
            {
              x: backSlot.x,
              y: backSlot.y,
              z: backSlot.z,
              duration: config.durReturn,
              ease: config.ease
            },
            'return'
          );

          tl.call(() => {
            orderRef.current = [...rest, front];
          });
        } catch (err) {
          console.error("CardSwap swap animation error:", err);
        }
      };

      intervalId = setInterval(swap, delay);

      const node = containerRef.current;
      if (pauseOnHover && node) {
        const pause = () => tlRef.current?.pause();
        const resume = () => tlRef.current?.play();
        node.addEventListener('mouseenter', pause);
        node.addEventListener('mouseleave', resume);
        return () => {
          node.removeEventListener('mouseenter', pause);
          node.removeEventListener('mouseleave', resume);
          if (intervalId) clearInterval(intervalId);
        };
      }
    } catch (err) {
      console.error("CardSwap effect error:", err);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, childArray.length]);

  return (
    <div ref={containerRef} className="card-swap-container" style={{ width, height }}>
      {childArray.map((child, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) cardRefs.current[i] = el;
          }}
          className="card-swap-wrapper"
          style={{ width, height }}
          onClick={(e) => {
            child.props?.onClick?.(e);
            onCardClick?.(i);
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
