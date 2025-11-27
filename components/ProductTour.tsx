import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';
import { Check, X } from 'lucide-react';

interface TourStep {
  targetId: string;
  titleKey: string;
  descKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface Props {
  onComplete: () => void;
}

const ProductTour: React.FC<Props> = ({ onComplete }) => {
  const { t, dir } = useLocalization();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    { targetId: 'tour-dashboard', titleKey: 'tour.dashboard_title', descKey: 'tour.dashboard_desc', position: 'bottom' },
    { targetId: 'tour-create', titleKey: 'tour.create_title', descKey: 'tour.create_desc', position: 'bottom' },
    { targetId: 'tour-profile', titleKey: 'tour.profile_title', descKey: 'tour.profile_desc', position: 'bottom' },
    { targetId: 'tour-live', titleKey: 'tour.live_title', descKey: 'tour.live_desc', position: 'bottom' },
    { targetId: 'tour-settings', titleKey: 'tour.settings_title', descKey: 'tour.settings_desc', position: 'bottom' }
  ];

  const updateTarget = () => {
    const step = steps[currentStep];
    const element = document.getElementById(step.targetId);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // If element not found (e.g., hidden on mobile), skip step
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    }
  };

  useEffect(() => {
    // Wait a bit for layout to settle
    const timer = setTimeout(updateTarget, 500);
    window.addEventListener('resize', updateTarget);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTarget);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!targetRect) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent Overlay */}
      <div className="absolute inset-0 bg-slate-950/70 transition-colors duration-500">
          {/* Spotlight hole effect using clip-path is tricky with dynamic rects. 
              Instead, we use a composite approach or just a high-z-index ring.
              Here we use a simpler 'spotlight' div that sits on top.
          */}
      </div>

      {/* Spotlight Ring */}
      <motion.div
        layout
        className="absolute rounded-2xl border-2 border-white/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] pointer-events-none"
        initial={false}
        animate={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      />

      {/* Pulsing effect */}
       <motion.div
        className="absolute rounded-2xl border-2 border-blue-500 pointer-events-none"
        animate={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Coach Mark Card */}
      <motion.div
        className="absolute pointer-events-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
            opacity: 1, 
            y: 0,
            top: targetRect.bottom + 24, // simplified positioning
            left: targetRect.left + (targetRect.width/2) - 150 < 20 ? 20 : targetRect.left + (targetRect.width/2) - 150 // center horizontally, keep in bounds
        }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-2xl w-[300px] relative">
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2 font-sans">{t(steps[currentStep].titleKey)}</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{t(steps[currentStep].descKey)}</p>
            
            <div className="flex justify-between items-center">
               <div className="flex gap-1">
                 {steps.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
                 ))}
               </div>
               <div className="flex gap-2">
                 <button onClick={onComplete} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2">
                    {t('onboarding.skip')}
                 </button>
                 <button 
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors"
                 >
                    {currentStep === steps.length - 1 ? <Check size={16}/> : null}
                    {currentStep === steps.length - 1 ? t('onboarding.start') : t('onboarding.next')}
                 </button>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductTour;