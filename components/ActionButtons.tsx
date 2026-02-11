
import React, { useState, useEffect, useRef } from 'react';
import { LogType, FeedingMethod, DiaperStatus, BabyLog, GrowthCategory } from '../types';

interface ActionButtonsProps {
  onAddLog: (log: BabyLog) => void;
  onUpdateLog: (log: BabyLog) => void;
  editingLog: BabyLog | null;
  onCloseEdit: () => void;
  birthDate: string;
  currentAnchorDate: Date;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onAddLog, 
  onUpdateLog, 
  editingLog, 
  onCloseEdit, 
  birthDate, 
  currentAnchorDate 
}) => {
  const [activeForm, setActiveForm] = useState<LogType | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [activeQuickOffset, setActiveQuickOffset] = useState<number>(0);
  
  const [feedingAmount, setFeedingAmount] = useState(120);
  const [feedingMethod, setFeedingMethod] = useState(FeedingMethod.BOTTLE);
  
  // Timer States for Breastfeeding (Left & Right)
  const [leftTimerSeconds, setLeftTimerSeconds] = useState(0);
  const [isLeftTimerRunning, setIsLeftTimerRunning] = useState(false);
  const [leftManualDuration, setLeftManualDuration] = useState(0);

  const [rightTimerSeconds, setRightTimerSeconds] = useState(0);
  const [isRightTimerRunning, setIsRightTimerRunning] = useState(false);
  const [rightManualDuration, setRightManualDuration] = useState(0);

  const leftIntervalRef = useRef<number | null>(null);
  const rightIntervalRef = useRef<number | null>(null);

  const [diaperStatus, setDiaperStatus] = useState(DiaperStatus.WET);
  const [vaccineName, setVaccineName] = useState('');
  const [supplementName, setSupplementName] = useState('');
  const [supplementDosage, setSupplementDosage] = useState('');
  const [nextDoseDate, setNextDoseDate] = useState('');
  const [note, setNote] = useState('');

  const [growthEventName, setGrowthEventName] = useState('');
  const [growthCategory, setGrowthCategory] = useState<GrowthCategory>(GrowthCategory.MILESTONE);
  const [growthWeight, setGrowthWeight] = useState<string>('');
  const [growthHeight, setGrowthHeight] = useState<string>('');

  // 初始化时间
  useEffect(() => {
    if (activeForm && !showCustomTime && !editingLog) {
      updateTimeWithOffset(activeQuickOffset);
    }
  }, [activeForm, currentAnchorDate, editingLog]);

  // 处理编辑逻辑
  useEffect(() => {
    if (editingLog) {
      setActiveForm(editingLog.type);
      setSelectedTime(new Date(editingLog.timestamp));
      setNote(editingLog.note || '');
      setShowCustomTime(true); // 编辑时默认展示时间调整

      switch (editingLog.type) {
        case LogType.FEEDING:
          setFeedingMethod(editingLog.method);
          if (editingLog.method === FeedingMethod.BREAST) {
            setLeftManualDuration(editingLog.leftDuration || 0);
            setRightManualDuration(editingLog.rightDuration || 0);
            setLeftTimerSeconds((editingLog.leftDuration || 0) * 60);
            setRightTimerSeconds((editingLog.rightDuration || 0) * 60);
          } else {
            setFeedingAmount(editingLog.amount || 0);
          }
          break;
        case LogType.DIAPER:
          setDiaperStatus(editingLog.status);
          break;
        case LogType.VACCINE:
          setVaccineName(editingLog.vaccineName);
          setNextDoseDate(editingLog.nextDoseDate || '');
          break;
        case LogType.SUPPLEMENT:
          setSupplementName(editingLog.name);
          setSupplementDosage(editingLog.dosage || '');
          break;
        case LogType.GROWTH:
          setGrowthEventName(editingLog.eventName);
          setGrowthCategory(editingLog.category);
          setGrowthWeight(editingLog.weight?.toString() || '');
          setGrowthHeight(editingLog.height?.toString() || '');
          break;
      }
    }
  }, [editingLog]);

  // Left Timer Effect
  useEffect(() => {
    if (isLeftTimerRunning) {
      leftIntervalRef.current = window.setInterval(() => {
        setLeftTimerSeconds(prev => {
          const next = prev + 1;
          setLeftManualDuration(Math.ceil(next / 60));
          return next;
        });
      }, 1000);
    } else {
      if (leftIntervalRef.current) clearInterval(leftIntervalRef.current);
    }
    return () => { if (leftIntervalRef.current) clearInterval(leftIntervalRef.current); };
  }, [isLeftTimerRunning]);

  // Right Timer Effect
  useEffect(() => {
    if (isRightTimerRunning) {
      rightIntervalRef.current = window.setInterval(() => {
        setRightTimerSeconds(prev => {
          const next = prev + 1;
          setRightManualDuration(Math.ceil(next / 60));
          return next;
        });
      }, 1000);
    } else {
      if (rightIntervalRef.current) clearInterval(rightIntervalRef.current);
    }
    return () => { if (rightIntervalRef.current) clearInterval(rightIntervalRef.current); };
  }, [isRightTimerRunning]);

  const updateTimeWithOffset = (offsetMinutes: number) => {
    const isToday = currentAnchorDate.toDateString() === new Date().toDateString();
    const baseDate = isToday ? new Date() : new Date(currentAnchorDate);
    
    if (!isToday) {
      const now = new Date();
      baseDate.setHours(now.getHours(), now.getMinutes() - offsetMinutes, 0, 0);
    } else {
      baseDate.setMinutes(baseDate.getMinutes() - offsetMinutes);
    }
    
    setSelectedTime(baseDate);
    setActiveQuickOffset(offsetMinutes);
  };

  const adjustTime = (unit: 'day' | 'hour' | 'minute', amount: number) => {
    setSelectedTime(prev => {
      const next = new Date(prev.getTime());
      if (unit === 'day') next.setDate(next.getDate() + amount);
      if (unit === 'hour') next.setHours(next.getHours() + amount);
      if (unit === 'minute') next.setMinutes(next.getMinutes() + amount);
      return next;
    });
    setShowCustomTime(true);
    setActiveQuickOffset(-1);
  };

  // 微调时间而不切换模式
  const nudgeTime = (minutes: number) => {
    setSelectedTime(prev => new Date(prev.getTime() + minutes * 60000));
    setActiveQuickOffset(-1);
  };

  const resetForms = () => {
    setActiveForm(null);
    setActiveQuickOffset(0);
    setShowCustomTime(false);
    setNote('');
    setVaccineName('');
    setSupplementName('');
    setSupplementDosage('');
    setNextDoseDate('');
    setGrowthEventName('');
    setGrowthWeight('');
    setGrowthHeight('');
    setGrowthCategory(GrowthCategory.MILESTONE);
    
    // Reset Breastfeeding
    setIsLeftTimerRunning(false);
    setIsRightTimerRunning(false);
    setLeftTimerSeconds(0);
    setRightTimerSeconds(0);
    setLeftManualDuration(0);
    setRightManualDuration(0);

    if (editingLog) onCloseEdit();
  };

  const handleSave = () => {
    const baseData = {
      id: editingLog ? editingLog.id : Date.now().toString(),
      timestamp: selectedTime.getTime(),
      note: note.trim() || undefined,
    };

    let newLog: any;

    switch (activeForm) {
      case LogType.FEEDING:
        if (feedingMethod === FeedingMethod.BREAST) {
          const lDur = leftManualDuration;
          const rDur = rightManualDuration;
          if (lDur === 0 && rDur === 0) {
            alert('请输入喂养时长');
            return;
          }
          let side: '左' | '右' | '双侧' = '左';
          if (lDur > 0 && rDur > 0) side = '双侧';
          else if (rDur > 0) side = '右';

          newLog = { 
            ...baseData, 
            type: LogType.FEEDING, 
            method: feedingMethod, 
            leftDuration: lDur > 0 ? lDur : undefined,
            rightDuration: rDur > 0 ? rDur : undefined,
            duration: lDur + rDur,
            side
          };
        } else {
          newLog = { 
            ...baseData, 
            type: LogType.FEEDING, 
            method: feedingMethod, 
            amount: feedingAmount
          };
        }
        break;
      case LogType.DIAPER:
        newLog = { ...baseData, type: LogType.DIAPER, status: diaperStatus };
        break;
      case LogType.VACCINE:
        if (!vaccineName.trim()) { alert('请输入疫苗名称'); return; }
        newLog = { ...baseData, type: LogType.VACCINE, vaccineName: vaccineName.trim(), nextDoseDate: nextDoseDate || undefined };
        break;
      case LogType.SUPPLEMENT:
        if (!supplementName.trim()) { alert('请输入补充剂名称'); return; }
        newLog = { ...baseData, type: LogType.SUPPLEMENT, name: supplementName.trim(), dosage: supplementDosage.trim() || undefined };
        break;
      case LogType.GROWTH:
        if (!growthEventName.trim() && !growthWeight && !growthHeight) { alert('请输入事件或指标'); return; }
        newLog = { ...baseData, type: LogType.GROWTH, eventName: growthEventName.trim() || "成长记录", category: growthCategory, weight: growthWeight ? parseFloat(growthWeight) : undefined, height: growthHeight ? parseFloat(growthHeight) : undefined };
        break;
      case LogType.NOTE:
        if (!note.trim()) { alert('请输入便签内容'); return; }
        newLog = { ...baseData, type: LogType.NOTE, content: note.trim() };
        break;
      default: break;
    }

    if (newLog) {
      if (editingLog) {
        onUpdateLog(newLog);
      } else {
        onAddLog(newLog);
      }
      resetForms();
    }
  };

  const formatTimer = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const CompactTimePicker = () => {
    const formattedDate = selectedTime.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    const formattedWeekday = selectedTime.toLocaleDateString('zh-CN', { weekday: 'short' });
    const formattedTime = selectedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return (
      <div className="bg-slate-50/50 rounded-3xl p-4 border border-slate-100 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-[13px] font-black text-slate-800">记录时间</span>
            <div className="flex items-center space-x-1">
              {!showCustomTime && !editingLog && (
                <button 
                  onClick={() => nudgeTime(-1)} 
                  className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all shadow-sm"
                >
                  <i className="fas fa-minus text-[8px]"></i>
                </button>
              )}
              <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                <span className="text-indigo-600 font-black text-xs">{formattedDate} {formattedWeekday}</span>
                <span className="mx-1 text-slate-300">|</span>
                <span className="text-indigo-600 font-black text-xs">{formattedTime}</span>
              </div>
              {!showCustomTime && !editingLog && (
                <button 
                  onClick={() => nudgeTime(1)} 
                  className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all shadow-sm"
                >
                  <i className="fas fa-plus text-[8px]"></i>
                </button>
              )}
            </div>
          </div>
          {!editingLog && (
            <button onClick={() => setShowCustomTime(!showCustomTime)} className="text-[10px] bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm text-slate-400 font-bold active:bg-slate-50 transition-colors">
              {showCustomTime ? '快捷模式' : '更精准调整'}
            </button>
          )}
        </div>
        {showCustomTime ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                <p className="text-[9px] font-black text-slate-300 uppercase mb-2 tracking-widest">日期</p>
                <div className="flex flex-col items-center space-y-2 w-full">
                  <button onClick={() => adjustTime('day', 1)} className="w-full h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all"><i className="fas fa-plus text-[8px]"></i></button>
                  <div className="flex flex-col items-center"><span className="text-[11px] font-black text-slate-700 leading-tight">{formattedWeekday}</span><span className="text-[13px] font-black text-slate-800">{selectedTime.getDate()}</span></div>
                  <button onClick={() => adjustTime('day', -1)} className="w-full h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all"><i className="fas fa-minus text-[8px]"></i></button>
                </div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                <p className="text-[9px] font-black text-slate-300 uppercase mb-2 tracking-widest">小时</p>
                <div className="flex flex-col items-center space-y-2 w-full">
                  <button onClick={() => adjustTime('hour', 1)} className="w-full h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all"><i className="fas fa-plus text-[8px]"></i></button>
                  <span className="text-[16px] font-black text-slate-800 py-1.5">{selectedTime.getHours().toString().padStart(2, '0')}</span>
                  <button onClick={() => adjustTime('hour', -1)} className="w-full h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all"><i className="fas fa-minus text-[8px]"></i></button>
                </div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                <p className="text-[9px] font-black text-slate-300 uppercase mb-2 tracking-widest">分钟</p>
                <div className="flex flex-col items-center space-y-2 w-full">
                  <button onClick={() => adjustTime('minute', 1)} className="w-full h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all"><i className="fas fa-plus text-[8px]"></i></button>
                  <span className="text-[16px] font-black text-slate-800 py-1.5">{selectedTime.getMinutes().toString().padStart(2, '0')}</span>
                  <button onClick={() => adjustTime('minute', -1)} className="w-full h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all"><i className="fas fa-minus text-[8px]"></i></button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {[0, 15, 30, 60, 120, 240].map(offset => (
              <button key={offset} onClick={() => updateTimeWithOffset(offset)} className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all ${activeQuickOffset === offset ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'bg-white border-slate-100 text-slate-400'}`}>
                {offset === 0 ? '现在' : `${offset >= 60 ? offset/60 + 'h前' : offset + 'm前'}`}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const BreastfeedingTimer = ({ side, seconds, setSeconds, isRunning, setIsRunning, manualVal, setManualVal }: any) => (
    <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-orange-100 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{side}侧</span>
        <div className="text-xl font-black text-orange-500 tabular-nums">{formatTimer(seconds)}</div>
      </div>
      
      <div className="flex items-center justify-center space-x-3">
        <button onClick={() => { setSeconds(0); setManualVal(0); }} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-rotate-left text-xs"></i></button>
        <button onClick={() => setIsRunning(!isRunning)} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all ${isRunning ? 'bg-orange-100 text-orange-500' : 'bg-orange-500 text-white'}`}><i className={`fas ${isRunning ? 'fa-pause' : 'fa-play'} text-sm`}></i></button>
        <div className="w-9"></div>
      </div>

      <div className="pt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] font-black text-slate-300 uppercase">时长调整</span>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => { const v = Math.max(0, manualVal - 1); setManualVal(v); setSeconds(v * 60); }}
              className="w-6 h-6 rounded-md bg-orange-50 text-orange-400 flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fas fa-minus text-[8px]"></i>
            </button>
            <span className="text-[10px] font-black text-orange-400 min-w-[36px] text-center">{manualVal} min</span>
            <button 
              onClick={() => { const v = Math.min(60, manualVal + 1); setManualVal(v); setSeconds(v * 60); }}
              className="w-6 h-6 rounded-md bg-orange-50 text-orange-400 flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fas fa-plus text-[8px]"></i>
            </button>
          </div>
        </div>
        <input type="range" min="0" max="60" step="1" value={manualVal} onChange={(e) => { const v = parseInt(e.target.value); setManualVal(v); setSeconds(v * 60); }} className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-orange-400 cursor-pointer" />
      </div>
    </div>
  );

  const ActionBtn = ({ type, icon, label, color }: { type: LogType, icon: string, label: string, color: string }) => (
    <button onClick={() => setActiveForm(type)} className="flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-50 transition-colors">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white mb-1.5 shadow-md shadow-slate-100 transform active:scale-90 transition-all`}>
        <i className={`fas ${icon} text-sm`}></i>
      </div>
      <span className="text-[9px] font-black text-slate-500 whitespace-nowrap">{label}</span>
    </button>
  );

  const getThemeColor = () => {
    switch (activeForm) {
      case LogType.FEEDING: return 'bg-orange-400';
      case LogType.DIAPER: return 'bg-teal-400';
      case LogType.VACCINE: return 'bg-emerald-500';
      case LogType.SUPPLEMENT: return 'bg-indigo-400';
      case LogType.GROWTH: return 'bg-rose-400';
      case LogType.NOTE: return 'bg-amber-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-x-1">
        <ActionBtn type={LogType.FEEDING} icon="fa-bottle-water" label="喂养" color="bg-orange-400" />
        <ActionBtn type={LogType.DIAPER} icon="fa-poop" label="尿布" color="bg-teal-400" />
        <ActionBtn type={LogType.VACCINE} icon="fa-syringe" label="疫苗" color="bg-emerald-500" />
        <ActionBtn type={LogType.GROWTH} icon="fa-star" label="成长" color="bg-rose-400" />
        <ActionBtn type={LogType.SUPPLEMENT} icon="fa-capsules" label="补充剂" color="bg-indigo-400" />
        <ActionBtn type={LogType.NOTE} icon="fa-note-sticky" label="便签" color="bg-amber-400" />
      </div>

      {activeForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center overflow-hidden">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2rem] w-full max-w-md p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">{editingLog ? '修改' : '记录'} {
                activeForm === LogType.DIAPER ? '尿布' :
                activeForm === LogType.VACCINE ? '疫苗' :
                activeForm === LogType.SUPPLEMENT ? '营养补充' :
                activeForm === LogType.GROWTH ? '成长' : 
                activeForm === LogType.FEEDING ? '喂养' : '便签'
              }</h3>
              <button onClick={resetForms} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-300 active:scale-90 transition-all"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex-grow overflow-y-auto no-scrollbar space-y-5 pb-6 px-1">
              <CompactTimePicker />
              
              {activeForm === LogType.FEEDING && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(FeedingMethod).map(m => (
                      <button key={m} onClick={() => setFeedingMethod(m)} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${feedingMethod === m ? 'bg-orange-400 border-orange-400 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>{m}</button>
                    ))}
                  </div>

                  {feedingMethod === FeedingMethod.BREAST && (
                    <div className="grid grid-cols-1 gap-4">
                      <BreastfeedingTimer side="左" seconds={leftTimerSeconds} setSeconds={setLeftTimerSeconds} isRunning={isLeftTimerRunning} setIsRunning={setIsLeftTimerRunning} manualVal={leftManualDuration} setManualVal={setLeftManualDuration} />
                      <BreastfeedingTimer side="右" seconds={rightTimerSeconds} setSeconds={setRightTimerSeconds} isRunning={isRightTimerRunning} setIsRunning={setIsRightTimerRunning} manualVal={rightManualDuration} setManualVal={setRightManualDuration} />
                      <div className="text-center bg-orange-50 p-2 rounded-xl border border-orange-100">
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">总喂养时长: {leftManualDuration + rightManualDuration} 分钟</span>
                      </div>
                    </div>
                  )}

                  {feedingMethod !== FeedingMethod.BREAST && (
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">记录奶量</span>
                        <div className="flex items-center space-x-4 bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100">
                          <button onClick={() => setFeedingAmount(Math.max(5, feedingAmount - 5))} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 active:scale-90 transition-all"><i className="fas fa-minus text-[8px]"></i></button>
                          <div className="flex flex-col items-center min-w-[60px]"><span className="text-orange-500 font-black text-xl">{feedingAmount}</span><span className="text-[8px] font-black text-slate-300 uppercase -mt-1 tracking-tighter">ml</span></div>
                          <button onClick={() => setFeedingAmount(Math.min(300, feedingAmount + 5))} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 active:scale-90 transition-all"><i className="fas fa-plus text-[8px]"></i></button>
                        </div>
                      </div>
                      <input type="range" min="5" max="300" step="5" value={feedingAmount} onChange={(e) => setFeedingAmount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-orange-400 cursor-pointer" />
                    </div>
                  )}
                </div>
              )}

              {activeForm === LogType.DIAPER && (
                <div className="grid grid-cols-3 gap-2 animate-fade-in">
                  {Object.values(DiaperStatus).map(s => (
                    <button key={s} onClick={() => setDiaperStatus(s)} className={`py-4 rounded-2xl border text-[11px] font-black transition-all ${diaperStatus === s ? 'bg-teal-400 border-teal-400 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              )}

              {activeForm === LogType.SUPPLEMENT && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">补充剂名称</label>
                    <input type="text" value={supplementName} onChange={(e) => setSupplementName(e.target.value)} placeholder="例如：维生素 D3、AD、DHA..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">剂量</label>
                    <input type="text" value={supplementDosage} onChange={(e) => setSupplementDosage(e.target.value)} placeholder="例如：1 滴、5ml、1 粒..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </div>
              )}

              {activeForm === LogType.VACCINE && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">疫苗名称</label>
                    <input type="text" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder="例如：乙肝疫苗、卡介苗..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">下次接种预约 (可选)</label>
                    <input type="date" value={nextDoseDate} onChange={(e) => setNextDoseDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" />
                  </div>
                </div>
              )}

              {activeForm === LogType.GROWTH && (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">发生了什么？</label>
                    <input type="text" value={growthEventName} onChange={(e) => setGrowthEventName(e.target.value)} placeholder="例如：第一次翻身、长了第一颗牙..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">记录类型</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(GrowthCategory).map(cat => (
                        <button key={cat} onClick={() => setGrowthCategory(cat)} className={`py-3 rounded-xl border text-[9px] font-black transition-all ${growthCategory === cat ? 'bg-rose-400 border-rose-400 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">体重 (kg)</label><input type="number" step="0.01" value={growthWeight} onChange={(e) => setGrowthWeight(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" /></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">身高 (cm)</label><input type="number" step="0.1" value={growthHeight} onChange={(e) => setGrowthHeight(e.target.value)} placeholder="0.0" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" /></div>
                  </div>
                </div>
              )}

              {activeForm === LogType.NOTE ? (
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="记录宝宝的小趣事..." rows={6} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-5 py-5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none animate-fade-in" />
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-wider">备注</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="添加更多细节..." rows={2} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none resize-none" />
                </div>
              )}
            </div>
            
            <button onClick={handleSave} className={`w-full py-5 rounded-[2rem] text-white font-black shadow-xl active:scale-95 transition-all ${getThemeColor()}`}>
              确认{editingLog ? '修改' : '保存'}记录
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
