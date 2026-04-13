import React from 'react';
import { X, Brain, Zap, Target, Sparkles, ShieldCheck } from 'lucide-react';

interface HowItWorksProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      day: "Day 1",
      title: "Active Encoding",
      desc: "Reprise finds high-yield concepts in your PDF. Focus on the 'Why' behind the facts.",
      icon: <Brain className="text-blue-500" size={22} />,
      color: "bg-blue-50"
    },
    {
      day: "Day 3",
      title: "Neural Reinforcement",
      desc: "Use Hint 1 & 2 to 'bridge' your memory. Active recall strengthens synaptic connections.",
      icon: <Zap className="text-amber-500" size={22} />,
      color: "bg-amber-50"
    },
    {
      day: "Day 6",
      title: "Cognitive Mastery",
      desc: "SM-2 schedules your final check. Rating 'Easy' on Day 6 locks data into long-term storage.",
      icon: <Target className="text-emerald-500" size={22} />,
      color: "bg-emerald-50"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
      <div className="bg-white/95 border border-white/20 rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-y-auto max-h-[90vh] relative transition-all [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>

        {/* Header */}
        <div className="p-6 pb-2 text-center">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] mb-2">
            <Sparkles size={10} /> The Reprise Method
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mastery, Not Memory.</h2>
          <p className="text-slate-500 mt-1 text-sm">Optimized for long-term active recall and retention.</p>
        </div>

        {/* How to Use the Cards */}
       <div className="px-8 pb-4 border-b border-slate-100 mb-4">
  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">
    Using the Cards
  </span>
  <p className="text-slate-500 text-[13px] leading-relaxed font-medium mb-4">
    Every card starts with just the question. Tap <strong className="text-slate-700 font-extrabold">Hint 1</strong> for a nudge, <strong className="text-slate-700 font-extrabold">Hint 2</strong> for a bigger step, then <strong className="text-slate-700 font-extrabold">Show Answer</strong> for the full solution. Struggling before peeking is what makes the memory stick.
  </p>
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
      <span className="text-[12px] font-medium text-slate-500">
        <span className="text-slate-700 font-bold">Hard:</span> Resets the streak; you'll see it again tomorrow.
      </span>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
      <span className="text-[12px] font-medium text-slate-500">
        <span className="text-slate-700 font-bold">Moderate:</span> Small interval growth; you're getting there.
      </span>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
      <span className="text-[12px] font-medium text-slate-500">
        <span className="text-slate-700 font-bold">Easy:</span> Multiplies the interval; card fades into the future.
      </span>
    </div>
  </div>
</div>

        {/* Spaced Repetition Steps */}
        <div className="px-8 pb-2 space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white/50 hover:bg-white transition-all group">
              <div className={`flex-shrink-0 w-10 h-10 ${step.color} rounded-xl flex items-center justify-center`}>
                {step.icon}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{step.day}</span>
                  <div className="h-[1px] w-3 bg-slate-200" />
                  <h4 className="font-extrabold text-slate-800 text-sm">{step.title}</h4>
                </div>
                <p className="text-slate-500 text-[13px] leading-snug font-medium">{step.desc}</p>
              </div>
            </div>
          ))}

          {/* Repetition Pattern Legend */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Repetition Pattern
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hard: Daily</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mod: 3 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Easy: 6+ Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50/80 text-center border-t border-slate-100 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={12} /> 100% Offline & Private
          </div>
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-sm"
          >
            Begin Study Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;