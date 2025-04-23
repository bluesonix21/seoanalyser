import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useTheme } from '../components/theme/ThemeProvider';

const NotFoundPage: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="mb-6 flex justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            <AlertTriangle size={80} style={{ color: colors.warning }} />
          </motion.div>
        </div>
        
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ color: colors.text.primary }}
        >
          404
        </h1>
        
        <h2 
          className="text-2xl font-bold mb-4"
          style={{ color: colors.text.primary }}
        >
          Sayfa Bulunamadı
        </h2>
        
        <p 
          className="mb-8 text-lg"
          style={{ color: colors.text.secondary }}
        >
          Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.primary,
              color: '#fff'
            }}
          >
            <Home size={20} />
            <span>Ana Sayfa</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors"
            style={{ 
              backgroundColor: `${colors.secondary}20`,
              color: colors.secondary
            }}
          >
            <ArrowLeft size={20} />
            <span>Geri Dön</span>
          </button>
        </div>
      </motion.div>
      
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{ 
              backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary,
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotFoundPage;
