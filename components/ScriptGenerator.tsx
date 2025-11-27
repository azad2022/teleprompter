
import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';
import { Script } from '../types';
import { Wand2, Loader2, Save, ArrowLeft, ArrowRight, Sparkles, PenTool, Type } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { saveScript } from '../services/storageService';
import { motion } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';

interface Props {
  onBack: () => void;
  onScriptCreated: (script: Script) => void;
}

const ScriptGenerator: React.FC<Props> = ({ onBack, onScriptCreated }) => {
  const { t, dir } = useLocalization();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [duration, setDuration] = useState('2 minutes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setError(null);
    try {
      const text = await generateScript({ topic, tone, duration });
      setGeneratedText(text);
      setShowEditor(true);
    } catch (err: any) {
      setError(err.message || t('generator.error_gen'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManual = () => {
    setTopic('');
    setGeneratedText('');
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!generatedText) return;
    const titleToSave = topic.trim() || 'Untitled Script';
    const newScript: Script = {
      id: uuidv4(),
      title: titleToSave,
      content: generatedText,
      createdAt: Date.now(),
      tags: ['Script']
    };
    saveScript(newScript);
    onScriptCreated(newScript);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto p-4 md:p-8 relative">
       {/* Background Effects */}
       <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
       </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto w-full space-y-6 z-10"
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white">
            {dir === 'rtl' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
          </button>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-l from-purple-100 to-blue-50" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>
            <Sparkles className="text-purple-400" />
            {t('generator.title')}
          </h2>
        </div>

        {/* Form */}
        {!showEditor ? (
          <div className="space-y-6 glass-panel p-8 rounded-3xl shadow-2xl bg-black/60">
            <div>
              <label className="block text-lg font-medium text-purple-200 mb-2" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>{t('generator.topic_label')}</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('generator.topic_placeholder')}
                className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all backdrop-blur-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-purple-200 mb-2" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>{t('generator.tone_label')}</label>
                <div className="relative">
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none font-medium"
                  >
                    <option value="Professional">Professional / رسمی</option>
                    <option value="Friendly">Friendly / دوستانه</option>
                    <option value="Motivational">Motivational / انگیزشی</option>
                    <option value="Humorous">Humorous / طنز</option>
                    <option value="Educational">Educational / آموزشی</option>
                    <option value="Poetic">Poetic / شاعرانه</option>
                  </select>
                  <div className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none text-white/50`}>▼</div>
                </div>
              </div>
              
              <div>
                <label className="block text-lg font-medium text-purple-200 mb-2" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>{t('generator.duration_label')}</label>
                <div className="relative">
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none font-medium"
                  >
                    <option value="30 seconds">30 sec / ۳۰ ثانیه</option>
                    <option value="1 minute">1 min / ۱ دقیقه</option>
                    <option value="2 minutes">2 min / ۲ دقیقه</option>
                    <option value="5 minutes">5 min / ۵ دقیقه</option>
                    <option value="30 minutes">30 min / ۳۰ دقیقه</option>
                    <option value="45 minutes">45 min / ۴۵ دقیقه</option>
                  </select>
                  <div className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none text-white/50`}>▼</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!topic || isGenerating}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-lg transition-all relative overflow-hidden group ${!topic || isGenerating ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02]'}`}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('generator.thinking')}
                </>
              ) : (
                <>
                  <Wand2 className="group-hover:rotate-12 transition-transform" />
                  {t('generator.generate_btn')}
                </>
              )}
            </button>

             <div className="flex items-center gap-4 py-2">
                 <div className="h-px bg-white/10 flex-1"></div>
                 <span className="text-white/40 text-sm font-bold">OR</span>
                 <div className="h-px bg-white/10 flex-1"></div>
             </div>

             <button
              onClick={handleManual}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-lg transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
            >
                <PenTool size={20} />
                {t('generator.manual_btn')}
            </button>
          </div>
        ) : (
          /* Editor View */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="glass-panel p-1 rounded-3xl shadow-xl bg-black/60">
              <div className="bg-black/40 rounded-[22px] p-6 space-y-4">
                 
                 {/* Title Input */}
                 <div>
                    <label className="block text-sm font-bold text-purple-200 mb-2 flex items-center gap-2">
                        <Type size={14} />
                        {t('generator.topic_label')}
                    </label>
                    <input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={t('generator.title_input_placeholder')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 outline-none focus:border-purple-500/50 transition-colors font-bold text-lg"
                    />
                 </div>

                 {/* Content Input */}
                 <div className="flex-1">
                    <label className="block text-sm font-bold text-purple-200 mb-2 flex items-center gap-2">
                         <PenTool size={14} />
                         {t('generator.result_label')}
                    </label>
                    <textarea
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    className="w-full h-96 bg-transparent text-white text-lg leading-loose resize-none outline-none custom-scrollbar p-2 font-medium"
                    />
                 </div>
              </div>
            </div>
            
            <div className="flex gap-4">
               <button
                onClick={() => setShowEditor(false)}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-colors border border-white/10"
              >
                {t('generator.retry_btn')}
              </button>
              <button
                onClick={handleSave}
                disabled={!generatedText.trim()}
                className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${!generatedText.trim() ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:scale-[1.02]'}`}
              >
                <Save />
                {t('generator.save_btn')}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ScriptGenerator;
