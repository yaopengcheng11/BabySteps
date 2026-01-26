
import React, { useState } from 'react';
import { BabyTodo } from '../types';

interface TodoSectionProps {
  todos: BabyTodo[];
  onAddTodo: (text: string, category: BabyTodo['category']) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  rangeLabel: string;
}

export const TodoSection: React.FC<TodoSectionProps> = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo, rangeLabel }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BabyTodo['category']>('daily');

  const categories: { key: BabyTodo['category'], label: string, icon: string, color: string }[] = [
    { key: 'daily', label: '日常', icon: 'fa-sun', color: 'text-blue-500 bg-blue-50' },
    { key: 'medical', label: '医疗', icon: 'fa-stethoscope', color: 'text-emerald-500 bg-emerald-50' },
    { key: 'shopping', label: '购物', icon: 'fa-cart-shopping', color: 'text-orange-500 bg-orange-50' },
    { key: 'other', label: '其他', icon: 'fa-ellipsis', color: 'text-slate-500 bg-slate-50' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onAddTodo(inputValue.trim(), selectedCategory);
    setInputValue('');
  };

  const completedCount = todos.filter(t => t.completed).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* 进度概览卡片 */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">任务进度</h3>
            <p className="text-[10px] text-slate-400 font-medium">{rangeLabel}：{completedCount} / {todos.length}</p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
              <circle 
                cx="24" cy="24" r="20" fill="transparent" stroke="#6366f1" strokeWidth="4" 
                strokeDasharray={125.6} 
                strokeDashoffset={125.6 - (125.6 * progress) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-indigo-600">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* 新增待办输入 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-4">
        <div className="flex space-x-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`记录在 ${rangeLabel}...`}
            className="flex-grow bg-slate-50 border-none rounded-2xl px-4 py-3 text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
          />
          <button 
            type="submit"
            className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-90 transition-all"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all ${
                selectedCategory === cat.key ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <i className={`fas ${cat.icon} text-[9px]`}></i>
              <span className="text-[10px] font-bold">{cat.label}</span>
            </button>
          ))}
        </div>
      </form>

      {/* 待办列表 */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 opacity-30">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <i className="fas fa-calendar-day text-2xl"></i>
            </div>
            <p className="text-xs text-slate-400 font-medium italic">此时间段暂无待办事项</p>
          </div>
        ) : (
          todos.sort((a, b) => (a.completed === b.completed ? b.createdAt - a.createdAt : a.completed ? 1 : -1)).map(todo => {
            const cat = categories.find(c => c.key === todo.category) || categories[3];
            return (
              <div 
                key={todo.id} 
                className={`group bg-white rounded-2xl p-4 border transition-all flex items-center justify-between ${
                  todo.completed ? 'opacity-60 border-slate-50' : 'shadow-sm border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <button 
                    onClick={() => onToggleTodo(todo.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'
                    }`}
                  >
                    <i className="fas fa-check text-[10px]"></i>
                  </button>
                  <div className="overflow-hidden">
                    <p className={`text-xs font-bold text-slate-700 truncate ${todo.completed ? 'line-through text-slate-400' : ''}`}>
                      {todo.text}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-400 transition-all"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
