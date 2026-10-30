import React from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc?: string;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, imageSrc, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-sv-bg overflow-hidden relative selection:bg-sv-primary/20">
      
      {/* Left Pane - Branding & Graphic (Hidden on Mobile) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-[40%] xl:w-[45%] relative items-center justify-center p-8 overflow-hidden bg-sv-surface-elevated"
      >
        {/* Dynamic Background Image or Fallback Gradient */}
        {imageSrc ? (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sv-bg via-sv-surface to-sv-surface-elevated opacity-90" />
        )}
        
        {/* Decorative Orbs - Smaller */}
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-sv-primary/20 rounded-full blur-[80px]" />
        
        {/* Content Overlay */}
        <div className="relative z-10 w-full max-w-sm">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sv-surface/60 border border-sv-border backdrop-blur-md mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-sv-success animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-sv-text-secondary uppercase">Internal Secure</span>
            </div>
            
            <h1 className="text-3xl xl:text-4xl font-display font-medium text-sv-text-primary leading-tight tracking-tight mb-3">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-base text-sv-text-secondary leading-relaxed font-light">
                {subtitle}
              </p>
            )}
          </motion.div>

          {/* Testimonial / Trust Badge Area - Compact */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="pt-6 border-t border-sv-border"
          >
            <div className="flex -space-x-2 mb-3">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border border-sv-border bg-sv-surface-muted overflow-hidden">
                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" className="w-full h-full opacity-60 grayscale" />
                 </div>
               ))}
               <div className="w-8 h-8 rounded-full border border-sv-border bg-sv-primary/20 flex items-center justify-center text-[10px] font-bold text-sv-primary shadow-sm">
                 ADM
               </div>
            </div>
            <p className="text-[11px] font-medium text-sv-text-muted tracking-wide uppercase">Unified Platform Control</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Pane - Form Area - SUBSTANTIALLY COMPACTED */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16 bg-sv-bg relative">
        <div className="w-full max-w-[380px] relative z-10">
          {children}
        </div>
      </div>
      
    </div>
  );
}
