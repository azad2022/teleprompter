import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t, dir } = useLocalization();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      titleKey: "onboarding.step1_title",
      descKey: "onboarding.step1_desc",
      // Couple blogger image
      image: "https://images.unsplash.com/photo-1621619856624-42fd193a0661?q=80&w=1000&auto=format&fit=crop", 
      bg: "from-blue-900 to-slate-900"
    },
    {
      titleKey: "onboarding.step2_title",
      descKey: "onboarding.step2_desc",
      image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=1000&auto=format&fit=crop",
      bg: "from-purple-900 to-slate-900"
    },
    {
      titleKey: "onboarding.step3_title",
      descKey: "onboarding.step3_desc",
      image: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop",
      bg: "from-emerald-900 to-slate-900"
    },
    {
      titleKey: "onboarding.step4_title",
      descKey: "onboarding.step4_desc",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
      bg: "from-indigo-900 to-slate-900"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col bg-slate-900 font-sans`}>
      
      {/* Background Image with Overlay */}
      <AnimatePresence mode="wait">
         <motion.div 
            key={currentStep}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 z-0"
         >
             <img src={steps[currentStep].image} alt="Background" className="w-full h-full object-cover" />
             <div className={`absolute inset-0 bg-gradient-to-t ${steps[currentStep].bg} opacity-90 mix-blend-multiply`} />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
         </motion.div>
      </AnimatePresence>

      {/* Skip Button */}
      <button 
        onClick={onComplete}
        className="absolute top-8 left-8 text-white/70 hover:text-white text-sm font-bold z-20 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full"
      >
        {t('onboarding.skip')}
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end items-center pb-20 px-8 z-10 relative max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
            >
                <h1 className="text-4xl font-black text-white mb-4 leading-tight drop-shadow-lg" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>
                   {t(steps[currentStep].titleKey)}
                </h1>
                <p className="text-lg text-slate-200 leading-relaxed font-medium">
                   {t(steps[currentStep].descKey)}
                </p>
            </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="flex gap-2 my-8">
            {steps.map((_, idx) => (
            <div 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-white/30'}`}
            />
            ))}
        </div>

        {/* Button */}
        <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
            {currentStep === steps.length - 1 ? t('onboarding.start') : t('onboarding.next')}
            {dir === 'rtl' ? (
                 currentStep === steps.length - 1 ? <Check size={20} /> : <ChevronLeft size={20} />
            ) : (
                 currentStep === steps.length - 1 ? <Check size={20} /> : <ChevronRight size={20} />
            )}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;