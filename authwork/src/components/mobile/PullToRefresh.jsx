import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PullToRefresh({ onRefresh, children }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 150;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
      scrollTopRef.current = container.scrollTop;
    };

    const handleTouchMove = (e) => {
      if (scrollTopRef.current > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;

      if (distance > 10) {
        e.preventDefault();
        setPullDistance(Math.min(distance, MAX_PULL));
        setIsPulling(distance > PULL_THRESHOLD);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      setIsPulling(false);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, onRefresh]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-y-auto"
    >
      {/* Pull-to-Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 bg-gradient-to-b from-blue-50 to-transparent z-20 pointer-events-none"
        style={{
          y: -60 + (pullDistance * 0.5)
        }}
      >
        <motion.div
          animate={{
            rotate: isPulling || isRefreshing ? 360 : 0
          }}
          transition={{
            duration: isRefreshing ? 0.6 : 0.3,
            repeat: isRefreshing ? Infinity : 0
          }}
        >
          <RefreshCw className={`w-5 h-5 ${isPulling || isRefreshing ? 'text-blue-600' : 'text-slate-400'}`} />
        </motion.div>
      </motion.div>

      {/* Content with padding for pull effect */}
      <motion.div
        animate={{
          y: Math.max(0, pullDistance * 0.3)
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}