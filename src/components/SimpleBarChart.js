import React from 'react';
import { motion } from 'framer-motion';
import './SimpleBarChart.css';

function SimpleBarChart({ data, maxHeight = 250 }) {
  const maxValue = Math.max(...data.map(item => item.value));

  const colors = [
    'linear-gradient(180deg, #6366f1, #8b5cf6)',
    'linear-gradient(180deg, #8b5cf6, #ec4899)',
    'linear-gradient(180deg, #ec4899, #f43f5e)',
    'linear-gradient(180deg, #10b981, #059669)',
    'linear-gradient(180deg, #f59e0b, #d97706)',
    'linear-gradient(180deg, #3b82f6, #2563eb)',
  ];

  return (
    <div className="simple-bar-chart">
      <div className="simple-bar" style={{ height: maxHeight }}>
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <motion.div
              key={index}
              className="bar-item"
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.1,
                type: 'spring',
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              style={{
                background: colors[index % colors.length]
              }}
            >
              <motion.div 
                className="bar-value"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                {item.value}
              </motion.div>
              <motion.div 
                className="bar-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                {item.label}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default SimpleBarChart;