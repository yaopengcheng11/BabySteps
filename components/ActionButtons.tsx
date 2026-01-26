
import React, { useState, useEffect, useMemo } from 'react';
import { LogType, FeedingMethod, DiaperStatus, BabyLog, GrowthCategory, BabyTodo } from '../types';

interface ActionButtonsProps {
  onAddLog: (log: BabyLog) => void;
  birthDate: string;
  onAddTodo: (text: string, category: BabyTodo['category'], targetDate: number) => void;
  currentAnchorDate: Date;
}

const ReferenceTip = React.memo(({ icon, label, children }: React.PropsWithChildren<{ icon: string, label: string }>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-[11px] font-bold text-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
      >
        <i className={`fas ${icon}`}></i>
        <span>{label}参考标准</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-[9px]`}></i>
      </button>
      {isOpen && (
        <div className="mt-2 bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-100 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
});

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddLog, birthDate, onAddTodo, currentAnchorDate }) => {
  const [activeForm, setActiveForm] = useState<LogType | 'QUICK_TODO' | null>(null);

  // Form states
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [timeOffset, setTimeOffset] = useState<number>(0); 
  const [showCustomTime, setShowCustomTime] = useState(false);
  
  const [feedingAmount, setFeedingAmount] = useState(120);
  const [feedingDuration, setFeedingDuration] = useState(20);
  const [feedingMethod, setFeedingMethod] = useState(FeedingMethod.BOTTLE);
  const [sleepDuration, setSleepDuration] = useState(30);
  const [diaperStatus, setDiaperStatus] = useState(DiaperStatus.WET);
  const [vaccineName, setVaccineName] = useState('');
  const [nextDoseDate, setNextDoseDate] = useState('');
  const [note, setNote] = useState('');

  // Todo specific states
  const [todoText, setTodoText] = useState('');
  const [todoCategory, setTodoCategory] = useState<BabyTodo['category']>('daily');

  // Growth specific states
  const [growthEventName, setGrowthEventName] = useState('');
  const [growthCategory, setGrowthCategory] = useState<GrowthCategory>(GrowthCategory.MILESTONE);
  const [growthWeight, setGrowthWeight] = useState<string>('');
  const [growthHeight, setGrowthHeight] = useState<string>('');

  const ageInMonths = useMemo(() => {
    const today = new Date();
    const birth = new Date(birthDate);
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    return Math.max(0, months);
  }, [birthDate]);

  const ageLabel = useMemo(() => {
    if (ageInMonths < 1) return "0-1月";
    if (ageInMonths < 3) return "1-3月";
    if (ageInMonths < 6) return "3-6月";
    if (ageInMonths < 12) return "6-12月";
    return "1岁+";
  }, [ageInMonths]);

  // 当打开表单时，如果当前时光轴不在“今天”，则默认选中时光轴对应的日期
  useEffect(() => {
    if (activeForm && activeForm !== 'QUICK_TODO') {
      const isToday = currentAnchorDate.toDateString() === new Date().toDateString();
      if (!isToday && !showCustomTime) {
         setSelectedTime(new Date(currentAnchorDate));
      } else if (isToday && !showCustomTime) {
         setSelectedTime(new Date(Date.now() - timeOffset * 60000));
      }
    }
  }, [timeOffset, activeForm, showCustomTime, currentAnchorDate]);

  const resetForms = () => {
    setActiveForm(null);
    setTimeOffset(0);
    setShowCustomTime(false);
    setNote('');
    setVaccineName('');
    setNextDoseDate('');
    setGrowthEventName('');
    setGrowthWeight('');
    setGrowthHeight('');
    setGrowthCategory(GrowthCategory.MILESTONE);
    setTodoText('');
    setTodoCategory('daily');
  };

  const handleSave = () => {
    if (activeForm === 'QUICK_TODO') {
      if (!todoText.trim()) return;
      // 待办事项使用当前选中的时间作为目标日期
      onAddTodo(todoText.trim(), todoCategory, selectedTime.getTime());
      resetForms();
      return;
    }

    const baseData = {
      id: Date.now().toString(),
      timestamp: selectedTime.getTime(),
      note: note.trim() || undefined,
    };

    switch (activeForm) {
      case LogType.FEEDING:
        onAddLog({ ...baseData, type: LogType.FEEDING, method: feedingMethod, amount: feedingMethod === FeedingMethod.BREAST ? undefined : feedingAmount, duration: feedingMethod === FeedingMethod.BREAST ? feedingDuration : undefined } as any);
        break;
      case LogType.SLEEP:
        onAddLog({ ...baseData, type: LogType.SLEEP, duration: sleepDuration, endTime: selectedTime.getTime() + sleepDuration * 60000 } as any);
        break;
      case LogType.DIAPER:
        onAddLog({ ...baseData, type: LogType.DIAPER, status: diaperStatus } as any);
        break;
      case LogType.VACCINE:
        if (!vaccineName.trim()) { alert('请输入疫苗名称'); return; }
        onAddLog({ ...baseData, type: LogType.VACCINE, vaccineName: vaccineName.trim(), nextDoseDate: nextDoseDate || undefined } as any);
        break;
      case LogType.GROWTH:
        if (!growthEventName.trim() && !growthWeight && !growthHeight) { alert('请输入事件名称或身体指标'); return; }
        onAddLog({ 
          ...baseData, 
          type: LogType.GROWTH, 
          eventName: growthEventName.trim() || (growthWeight || growthHeight ? "定期体检" : "成长瞬间"), 
          category: growthCategory,
          weight: growthWeight ? parseFloat(growthWeight) : undefined,
          height: growthHeight ? parseFloat(growthHeight) : undefined
        } as any);
        break;
      default:
        break;
    }
    resetForms();
  };

  const CompactTimePicker = () => (
    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-bold text-slate-500">日期/时间</span>
        <div className="flex items-center space-x-2">
          <span className="text-indigo-600 font-bold text-sm">
            {selectedTime.toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})} {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => setShowCustomTime(!showCustomTime)} className="text-[10px] text-slate-400 underline">{showCustomTime ? '返回滑动' : '自定义'}</button>
        </div>
      </div>
      {!showCustomTime ? (
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {[0, 15, 30, 60, 120, 180].map(offset => (
              <button key={offset} onClick={() => setTimeOffset(offset)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${timeOffset === offset ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>{offset === 0 ? '现在' : `${offset >= 60 ? offset/60 + 'h' : offset + 'm'}前`}</button>
            ))}
          </div>
          <input type="range" min="0" max="720" step="1" value={timeOffset} onChange={(e) => setTimeOffset(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
        </div>
      ) : (
        <input type="datetime-local" value={new Date(selectedTime.getTime() - selectedTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={(e) => { const d = new Date(e.target.value); setSelectedTime(d); setTimeOffset(Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000))); }} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none" />
      )}
    </div>
  );

  const feedingTips = useMemo(() => (
    <ul className="list-disc list-inside space-y-1">
      {ageInMonths < 1 && <><li>奶量：60-90ml / 次</li><li>频率：每 2-3 小时一次</li></>}
      {ageInMonths >= 1 && ageInMonths < 3 && <><li>奶量：120-150ml / 次</li><li>频率：每 3-4 小时一次</li></>}
      {ageInMonths >= 3 && ageInMonths < 6 && <><li>奶量：180-210ml / 次</li><li>每日约 5-6 次</li></>}
      {ageInMonths >= 6 && <><li>辅食配合：每日 2-3 次辅食</li><li>奶量维持：约 600-800ml</li></>}
    </ul>
  ), [ageInMonths]);

  const ActionBtn = ({ type, icon, label, color }: { type: LogType | 'QUICK_TODO', icon: string, label: string, color: string }) => (
    <button onClick={() => setActiveForm(type)} className="flex flex-col items-center group">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white mb-1.5 shadow-lg transform active:scale-90 transition-all`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
    </button>
  );

  const getThemeColor = () => {
    switch (activeForm) {
      case LogType.FEEDING: return 'bg-orange-400';
      case LogType.SLEEP: return 'bg-indigo-400';
      case LogType.DIAPER: return 'bg-teal-400';
      case LogType.VACCINE: return 'bg-emerald-500';
      case LogType.GROWTH: return 'bg-rose-400';
      case 'QUICK_TODO': return 'bg-indigo-600';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between px-1 overflow-x-auto no-scrollbar space-x-2">
        <ActionBtn type={LogType.FEEDING} icon="fa-bottle-water" label="喂养" color="bg-orange-400" />
        <ActionBtn type={LogType.SLEEP} icon="fa-moon" label="睡眠" color="bg-indigo-400" />
        <ActionBtn type={LogType.DIAPER} icon="fa-poop" label="尿布" color="bg-teal-400" />
        <ActionBtn type={LogType.VACCINE} icon="fa-syringe" label="疫苗" color="bg-emerald-500" />
        <ActionBtn type={LogType.GROWTH} icon="fa-star" label="成长" color="bg-rose-400" />
        <ActionBtn type="QUICK_TODO" icon="fa-check-double" label="加待办" color="bg-indigo-600" />
      </div>

      {activeForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2rem] w-full max-w-md p-6 shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <span className={`w-2 h-6 rounded-full mr-2 ${getThemeColor()}`}></span>
                {activeForm === 'QUICK_TODO' ? '快捷待办' : `记录${activeForm === LogType.FEEDING ? '喂养' : activeForm === LogType.SLEEP ? '睡眠' : activeForm === LogType.DIAPER ? '尿布' : activeForm === LogType.VACCINE ? '疫苗' : '成长瞬间'}`}
              </h3>
              <button onClick={resetForms} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400"><i className="fas fa-times"></i></button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 pb-2">
              <CompactTimePicker />
              {activeForm === LogType.FEEDING && (
                <>
                  <ReferenceTip icon="fa-lightbulb" label={`${ageLabel}喂养`}>{feedingTips}</ReferenceTip>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(FeedingMethod).map(m => (
                      <button key={m} onClick={() => setFeedingMethod(m)} className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${feedingMethod === m ? 'bg-orange-400 border-orange-400 text-white' : 'bg-white border-slate-100 text-slate-500'}`}>{m}</button>
                    ))}
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between mb-2"><span className="text-[11px] font-bold text-slate-500">{feedingMethod === FeedingMethod.BREAST ? '时长' : '奶量'}</span><span className="text-orange-500 font-bold text-sm">{feedingMethod === FeedingMethod.BREAST ? `${feedingDuration} min` : `${feedingAmount} ml`}</span></div>
                    <input type="range" min={feedingMethod === FeedingMethod.BREAST ? "1" : "10"} max={feedingMethod === FeedingMethod.BREAST ? "60" : "300"} step={feedingMethod === FeedingMethod.BREAST ? "1" : "10"} value={feedingMethod === FeedingMethod.BREAST ? feedingDuration : feedingAmount} onChange={(e) => feedingMethod === FeedingMethod.BREAST ? setFeedingDuration(parseInt(e.target.value)) : setFeedingAmount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-400" />
                  </div>
                </>
              )}
              {activeForm === LogType.SLEEP && (
                <>
                  <ReferenceTip icon="fa-bed" label={`${ageLabel}睡眠`}>每日推荐睡眠 {ageInMonths < 6 ? '14-16' : '12-14'} 小时，注意仰卧安全。</ReferenceTip>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between mb-2"><span className="text-[11px] font-bold text-slate-500">时长</span><span className="text-indigo-500 font-bold text-sm">{Math.floor(sleepDuration/60)}h {sleepDuration%60}m</span></div>
                    <input type="range" min="5" max="600" step="5" value={sleepDuration} onChange={(e) => setSleepDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                  </div>
                </>
              )}
              {activeForm === LogType.DIAPER && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(DiaperStatus).map(s => (
                    <button key={s} onClick={() => setDiaperStatus(s)} className={`py-4 rounded-xl border text-xs font-bold transition-all ${diaperStatus === s ? 'bg-teal-400 border-teal-400 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              )}
              {activeForm === LogType.GROWTH && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {cat: GrowthCategory.MILESTONE, icon: 'fa-trophy', label: '里程碑'},
                      {cat: GrowthCategory.SKILL, icon: 'fa-wand-magic-sparkles', label: '新技能'},
                      {cat: GrowthCategory.HEALTH, icon: 'fa-heart-pulse', label: '健康'},
                    ].map(c => (
                      <button key={c.cat} onClick={() => setGrowthCategory(c.cat)} className={`flex flex-col items-center py-3 rounded-xl border transition-all ${growthCategory === c.cat ? 'bg-rose-400 border-rose-400 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <i className={`fas ${c.icon} mb-1 text-xs`}></i>
                        <span className="text-[10px] font-bold">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  <input type="text" value={growthEventName} onChange={(e) => setGrowthEventName(e.target.value)} placeholder="如：第一次翻身、长第一颗牙..." className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" step="0.1" value={growthWeight} onChange={(e) => setGrowthWeight(e.target.value)} placeholder="体重 (kg)" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none" />
                    <input type="number" step="0.1" value={growthHeight} onChange={(e) => setGrowthHeight(e.target.value)} placeholder="身高 (cm)" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none" />
                  </div>
                </div>
              )}
              {activeForm === LogType.VACCINE && (
                <div className="space-y-4">
                  <input type="text" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder="疫苗名称（如：五联疫苗）" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none" />
                  <input type="date" value={nextDoseDate} onChange={(e) => setNextDoseDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none" />
                </div>
              )}
              {activeForm === 'QUICK_TODO' ? (
                <div className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">任务内容</label>
                    <input 
                      type="text" 
                      autoFocus
                      value={todoText} 
                      onChange={(e) => setTodoText(e.target.value)} 
                      placeholder="想记下什么？" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">分类</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {key: 'daily', label: '日常琐事', icon: 'fa-sun'},
                        {key: 'medical', label: '医疗健康', icon: 'fa-stethoscope'},
                        {key: 'shopping', label: '购物清单', icon: 'fa-cart-shopping'},
                        {key: 'other', label: '其他', icon: 'fa-ellipsis'},
                      ].map(cat => (
                        <button 
                          key={cat.key} 
                          onClick={() => setTodoCategory(cat.key as any)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border transition-all ${
                            todoCategory === cat.key ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'
                          }`}
                        >
                          <i className={`fas ${cat.icon} text-xs`}></i>
                          <span className="text-xs font-bold">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="添加备注..." rows={1} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-300 resize-none min-h-[46px]" />
              )}
            </div>

            <button 
              onClick={handleSave} 
              className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 mt-4 ${getThemeColor()}`}
            >
              {activeForm === 'QUICK_TODO' ? '添加到该日期' : '保存记录'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
