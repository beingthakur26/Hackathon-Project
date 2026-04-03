import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isInView || startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, end, duration, decimals]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};
