
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';
import { Check, X } from 'lucide-react';

interface TourStep {
  targetId: string;
  titleKey: string;
  descKey: string;
}

interface Props {
  onComplete: () => void;
}

const ProductTour: React.FC<Props> = ({ onComplete }) => {
  const { t, dir } = useLocalization();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const steps: TourStep[] = [
    { targetId: 'tour-dashboard', titleKey: 'tour.dashboard_title', descKey: 'tour.dashboard_desc' },
    { targetId: 'tour-create', titleKey: 'tour.create_title', descKey: 'tour.create_desc' },
    { targetId: 'tour-profile', titleKey: 'tour.profile_title', descKey: 'tour.profile_desc' },
    { targetId: 'tour-live', titleKey: 'tour.live_title', descKey: 'tour.live_desc' },
    { targetId: 'tour-settings', titleKey: 'tour.settings_title', descKey: 'tour.settings_desc' }
  ];

  // Effect: Scroll to target when step changes
  useEffect(() => {
    const step = steps[currentStep];
    const element = document.getElementById(step.targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  // Effect: Continuous position tracking (for scroll/resize)
  useEffect(() => {
    let rafId: number;

    const updatePosition = () => {
      const step = steps[currentStep];
      const element = document.getElementById(step.targetId);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect((prev) => {
          // Optimization: Only update state if position changed significantly
          if (
            prev &&
            Math.abs(prev.x - rect.x) < 2 &&
            Math.abs(prev.y - rect.y) < 2 &&
            Math.abs(prev.width - rect.width) < 2 &&
            Math.abs(prev.height - rect.height) < 2
          ) {
            return prev;
          }
          return rect;
        });
      } else {
        // Element not found (possibly navigated away or loading), keep previous or null
      }
      rafId = requestAnimationFrame(updatePosition);
    };

    rafId = requestAnimationFrame(updatePosition);

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
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

  // --- Responsive Positioning Calculation ---
  const SCREEN_PADDING = 20;
  const GAP = 12;
  const CARD_MAX_WIDTH = 300;
  
  // 1. Calculate Card Width
  const availableWidth = windowSize.width - (SCREEN_PADDING * 2);
  const cardWidth = Math.min(CARD_MAX_WIDTH, availableWidth);
  
  // 2. Horizontal Position (Centered on target, then clamped)
  let leftPos = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
  
  // Clamp to screen edges
  if (leftPos < SCREEN_PADDING) {
      leftPos = SCREEN_PADDING;
  } else if (leftPos + cardWidth > windowSize.width - SCREEN_PADDING) {
      leftPos = windowSize.width - cardWidth - SCREEN_PADDING;
  }

  // 3. Arrow Position (Relative to card)
  const targetCenter = targetRect.left + (targetRect.width / 2);
  let arrowRelLeft = targetCenter - leftPos;
  // Clamp arrow within card radius
  arrowRelLeft = Math.max(20, Math.min(cardWidth - 20, arrowRelLeft));

  // 4. Vertical Position (Flip Logic + Large Target Logic)
  const cardApproxHeight = 200; // Estimated max height
  const spaceBelow = windowSize.height - targetRect.bottom;
  const spaceAbove = targetRect.top;
  const isLargeTarget = targetRect.height > windowSize.height * 0.6; // If target covers > 60% of screen

  let topPos = 0;
  let showArrow = true;
  let isAbove = false;

  if (isLargeTarget) {
     // For large targets (like full dashboard), place card centered at bottom of screen
     topPos = windowSize.height - cardApproxHeight - 40; 
     leftPos = (windowSize.width / 2) - (cardWidth / 2); // Center horizontally
     showArrow = false;
  } else {
    // Normal targets: Decide Above or Below
    if (spaceBelow < cardApproxHeight && spaceAbove > spaceBelow) {
       // Place Above
       topPos = targetRect.top - GAP; 
       isAbove = true;
    } else {
       // Place Below (Default)
       topPos = targetRect.bottom + GAP;
       isAbove = false;
    }
  }

  // Final Vertical Clamp to ensure card doesn't go off screen bottom/top
  // (Mainly for the 'Above' case needing to shift up by height, handled by translateY in motion)
  // But we still need to clamp strictly for the 'Below' case if it overflows slightly.
  if (!isAbove && topPos + cardApproxHeight > windowSize.height) {
     topPos = windowSize.height - cardApproxHeight - SCREEN_PADDING;
  }
  if (isAbove && topPos < cardApproxHeight) {
     // If placing above but no space, force to top with padding
     topPos = SCREEN_PADDING + cardApproxHeight; 
  }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none font-sans" style={{ direction: dir }}>
      {/* Semi-transparent Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 transition-opacity duration-500" />

      {/* Spotlight / Highlight Ring */}
      <motion.div
        layout
        className="absolute rounded-2xl border-2 border-white/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.85)] pointer-events-none"
        initial={false}
        animate={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
        transition={{ type: "spring", stiffness: 250, damping: 30 }}
      />

      {/* Pulsing Focus Ring */}
       <motion.div
        className="absolute rounded-2xl border-2 border-blue-500 pointer-events-none"
        animate={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.02, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Info Card */}
      <motion.div
        className="absolute pointer-events-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
            opacity: 1, 
            scale: 1,
            top: topPos,
            left: leftPos,
            y: isAbove ? "-100%" : "0%"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ width: cardWidth }}
      >
        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-2xl relative">
          {/* Dynamic Arrow */}
          {showArrow && (
            <div 
                className={`absolute w-4 h-4 bg-white rotate-45 transform -translate-x-1/2 ${isAbove ? '-bottom-2' : '-top-2'}`}
                style={{ left: arrowRelLeft }}
            />
          )}
          
          <div className="relative z-10 flex flex-col gap-3">
             <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold font-sans" style={{fontFamily: 'Lalezar, sans-serif'}}>
                    {t(steps[currentStep].titleKey)}
                </h3>
                <button onClick={onComplete} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                </button>
             </div>
            
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {t(steps[currentStep].descKey)}
            </p>
            
            <div className="flex justify-between items-center pt-2">
               <div className="flex gap-1.5">
                 {steps.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} 
                    />
                 ))}
               </div>
               
               <button 
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                 >
                    {currentStep === steps.length - 1 ? t('onboarding.start') : t('onboarding.next')}
                    {currentStep === steps.length - 1 && <Check size={14}/>}
                 </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductTour;
