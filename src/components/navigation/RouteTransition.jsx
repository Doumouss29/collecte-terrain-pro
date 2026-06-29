import React from 'react';
import { motion } from 'framer-motion';

export default function RouteTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}