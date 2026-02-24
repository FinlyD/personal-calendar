/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Save, 
  Trash2,
  Calendar as CalendarIcon,
  Layout
} from 'lucide-react';
import { Solar, HolidayUtil } from 'lunar-javascript';

// --- Types ---

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string;
  completed?: boolean;
}

interface WeeklySummary {
  id: string;
  year: number;
  weekIndex: number; // 0-indexed week of the year
  content: string;
}

interface YearlyPlan {
  year: number;
  goals: string;
  work: string;
  life: string;
  other: string;
}

// --- Constants ---

const DAYS_CHINESE = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const MONTHS_CHINESE = [
  '1月', '2月', '3月', '4月', '5月', '6月', 
  '7月', '8月', '9月', '10月', '11月', '12月'
];

// --- Helper Functions ---

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const getLunarDay = (year: number, month: number, day: number) => {
  const solar = Solar.fromYmd(year, month + 1, day);
  const lunar = solar.getLunar();
  const lunarDay = lunar.getDayInChinese();
  const lunarMonth = lunar.getMonthInChinese();
  
  // If it's the first day of the lunar month, show the month name
  return lunarDay === '初一' ? `${lunarMonth}月` : lunarDay;
};

const getDayStatus = (year: number, month: number, day: number) => {
  const h = HolidayUtil.getHoliday(year, month + 1, day);
  if (!h) return null;
  return {
    isWork: h.isWork(),
    name: h.getName()
  };
};

// --- Components ---

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isYearlyView, setIsYearlyView] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [yearlyPlan, setYearlyPlan] = useState<YearlyPlan>({
    year: new Date().getFullYear(),
    goals: '',
    work: '',
    life: '',
    other: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventCompleted, setNewEventCompleted] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar_events');
    const savedSummaries = localStorage.getItem('calendar_summaries');
    const savedYearlyPlan = localStorage.getItem(`yearly_plan_${currentYear}`);
    
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedSummaries) setSummaries(JSON.parse(savedSummaries));
    if (savedYearlyPlan) setYearlyPlan(JSON.parse(savedYearlyPlan));
  }, [currentYear]);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('calendar_summaries', JSON.stringify(summaries));
  }, [summaries]);

  useEffect(() => {
    localStorage.setItem(`yearly_plan_${currentYear}`, JSON.stringify(yearlyPlan));
  }, [yearlyPlan, currentYear]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentYear, currentMonth]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;

    if (editingEventId) {
      // Edit existing event
      setEvents(events.map(e => 
        e.id === editingEventId 
          ? { ...e, title: newEventTitle, time: newEventTime || undefined, completed: newEventCompleted }
          : e
      ));
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        date: selectedDate,
        title: newEventTitle,
        time: newEventTime || undefined,
        completed: false,
      };
      setEvents([...events, newEvent]);
    }

    setNewEventTitle('');
    setNewEventTime('');
    setNewEventCompleted(false);
    setEditingEventId(null);
    setIsModalOpen(false);
  };

  const openAddModal = (date: string) => {
    setSelectedDate(date);
    setEditingEventId(null);
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventCompleted(false);
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedDate(event.date);
    setEditingEventId(event.id);
    setNewEventTitle(event.title);
    setNewEventTime(event.time || '');
    setNewEventCompleted(!!event.completed);
    setIsModalOpen(true);
  };

  const handleToggleComplete = (id: string) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, completed: !e.completed } : e
    ));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleUpdateSummary = (weekIndex: number, content: string) => {
    const summaryId = `${currentYear}-${currentMonth}-${weekIndex}`;
    const existingIndex = summaries.findIndex(s => s.id === summaryId);

    if (existingIndex >= 0) {
      const updated = [...summaries];
      updated[existingIndex].content = content;
      setSummaries(updated);
    } else {
      setSummaries([...summaries, { id: summaryId, year: currentYear, weekIndex, content }]);
    }
  };

  const getSummaryForWeek = (weekIndex: number) => {
    const summaryId = `${currentYear}-${currentMonth}-${weekIndex}`;
    return summaries.find(s => s.id === summaryId)?.content || '';
  };

  const handleUpdateYearlyPlan = (field: keyof YearlyPlan, value: string) => {
    setYearlyPlan(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <CalendarIcon size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            {currentYear}年 {isYearlyView ? '年度规划' : MONTHS_CHINESE[currentMonth]}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isYearlyView && (
            <>
              <button 
                onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                今天
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50/30">
        {isYearlyView ? (
          <div className="max-w-5xl mx-auto p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                  <h2 className="font-bold text-lg">核心目标</h2>
                </div>
                <textarea 
                  className="flex-1 w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 leading-relaxed"
                  placeholder="写下你今年的 3 个核心目标..."
                  value={yearlyPlan.goals}
                  onChange={(e) => handleUpdateYearlyPlan('goals', e.target.value)}
                />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <div className="w-2 h-6 bg-emerald-600 rounded-full" />
                  <h2 className="font-bold text-lg">工作学习</h2>
                </div>
                <textarea 
                  className="flex-1 w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-700 leading-relaxed"
                  placeholder="职业发展、技能提升、阅读计划..."
                  value={yearlyPlan.work}
                  onChange={(e) => handleUpdateYearlyPlan('work', e.target.value)}
                />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <div className="w-2 h-6 bg-rose-600 rounded-full" />
                  <h2 className="font-bold text-lg">生活健康</h2>
                </div>
                <textarea 
                  className="flex-1 w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 text-slate-700 leading-relaxed"
                  placeholder="运动、饮食、旅行、家庭..."
                  value={yearlyPlan.life}
                  onChange={(e) => handleUpdateYearlyPlan('life', e.target.value)}
                />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <div className="w-2 h-6 bg-amber-600 rounded-full" />
                  <h2 className="font-bold text-lg">其他事项</h2>
                </div>
                <textarea 
                  className="flex-1 w-full min-h-[200px] p-4 bg-slate-50 border border-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-slate-700 leading-relaxed"
                  placeholder="财务管理、兴趣爱好、待办清单..."
                  value={yearlyPlan.other}
                  onChange={(e) => handleUpdateYearlyPlan('other', e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="calendar-grid sticky top-0 z-10 bg-white">
              {DAYS_CHINESE.map((day, idx) => (
                <div 
                  key={day} 
                  className="calendar-header text-slate-600 bg-slate-50"
                >
                  {day}
                </div>
              ))}
              <div className="calendar-header bg-[#f3e5f5] text-purple-700">周总结</div>
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="calendar-grid">
                {week.map((day, dayIdx) => {
                  const dateStr = day ? formatDate(currentYear, currentMonth, day) : null;
                  const dayEvents = events.filter(e => e.date === dateStr);
                  const isToday = dateStr === todayStr;
                  const holidayStatus = day ? getDayStatus(currentYear, currentMonth, day) : null;
                  
                  // Determine background color
                  let bgColor = 'bg-white';
                  if (!day) {
                    bgColor = 'bg-slate-50/50';
                  } else if (isToday) {
                    bgColor = 'bg-indigo-50/30 ring-2 ring-inset ring-indigo-500/20';
                  } else if (holidayStatus) {
                    bgColor = holidayStatus.isWork ? 'bg-[#fff9f9]' : 'bg-[#f1f8f1]';
                  } else if (dayIdx === 0 || dayIdx === 6) {
                    // Normal weekend (not a holiday or workday)
                    bgColor = 'bg-[#f1f8f1]';
                  }

                  return (
                    <div 
                      key={dayIdx} 
                      className={`calendar-cell group relative ${bgColor}`}
                      onClick={() => {
                        if (day) {
                          openAddModal(dateStr!);
                        }
                      }}
                    >
                      {day && (
                        <>
                          {/* Holiday/Workday Badge */}
                          {holidayStatus && (
                            <div className={`absolute top-0 right-0 px-1 py-0.5 font-bold leading-none rounded-bl-sm ${
                              holidayStatus.isWork ? 'bg-slate-50 text-purple-400' : 'bg-purple-100 text-purple-500'
                            }`}>
                              <span className={holidayStatus.isWork ? 'text-[10px]' : 'text-[9px]'}>
                                {holidayStatus.isWork ? '班' : '休'}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <span className={`text-sm font-bold flex-shrink-0 ${
                                isToday ? 'text-white bg-indigo-600 w-6 h-6 flex items-center justify-center rounded-full -ml-1' : 
                                (dayEvents.length > 0 ? 'text-indigo-600' : 'text-slate-500')
                              }`}>
                                {day}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-[10px] font-normal truncate ${isToday ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                  {getLunarDay(currentYear, currentMonth, day)}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddModal(dateStr!);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-50 rounded text-indigo-600 transition-opacity flex-shrink-0 z-10"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            {dayEvents.map(event => (
                              <div 
                                key={event.id}
                                className={`text-[11px] leading-tight p-1 border rounded shadow-sm flex flex-col gap-0.5 transition-all cursor-pointer ${
                                  event.completed 
                                    ? 'bg-slate-50 border-slate-200 opacity-60' 
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(event);
                                }}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <div className="flex items-start gap-1 min-w-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleComplete(event.id);
                                      }}
                                      className={`mt-0.5 flex-shrink-0 w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${
                                        event.completed 
                                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                                          : 'border-slate-300 hover:border-indigo-400'
                                      }`}
                                    >
                                      {event.completed && <Save size={8} className="stroke-[4]" />}
                                    </button>
                                    <span className={`font-medium truncate ${event.completed ? 'text-slate-400' : 'text-slate-700'}`}>
                                      {event.title}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(event.id);
                                    }}
                                    className="text-slate-300 hover:text-red-500 flex-shrink-0"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                                {event.time && (
                                  <span className={`text-[9px] ml-4 ${event.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                                    {event.time}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                
                {/* Weekly Summary Column */}
                <div className="calendar-cell bg-white p-0">
                  <textarea
                    className="w-full h-full p-3 text-sm text-slate-600 resize-none focus:outline-none focus:bg-slate-50/50 placeholder:text-slate-300"
                    placeholder="本周总结..."
                    value={getSummaryForWeek(weekIdx)}
                    onChange={(e) => handleUpdateSummary(weekIdx, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Tabs (Month Navigation) */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setIsYearlyView(true)}
          className={`px-4 py-1.5 text-xs font-medium rounded-t-lg transition-all border-x border-t ${
            isYearlyView 
              ? 'bg-white border-slate-300 text-indigo-600 -mb-[9px] pb-3 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]' 
              : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200'
          }`}
        >
          今年规划
        </button>
        {MONTHS_CHINESE.map((month, idx) => (
          <button
            key={month}
            onClick={() => {
              setIsYearlyView(false);
              setCurrentDate(new Date(currentYear, idx, 1));
            }}
            className={`px-4 py-1.5 text-xs font-medium rounded-t-lg transition-all border-x border-t ${
              !isYearlyView && currentMonth === idx 
                ? 'bg-white border-slate-300 text-indigo-600 -mb-[9px] pb-3 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]' 
                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200'
            }`}
          >
            {month}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 text-[10px] text-slate-400 font-mono uppercase tracking-wider px-4">
          <span>{currentYear} Planner</span>
          <Layout size={12} />
        </div>
      </footer>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">
                  {editingEventId ? '修改日程' : '添加日程'} - {selectedDate}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">事项内容</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="例如：产品周会"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">时间 (可选)</label>
                  <input 
                    type="text" 
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="例如：11:00-12:30"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {editingEventId && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setNewEventCompleted(!newEventCompleted)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        newEventCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300'
                      }`}
                    >
                      {newEventCompleted && <Save size={12} className="stroke-[3]" />}
                    </button>
                    <span className="text-sm text-slate-600">标记为已完成</span>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleAddEvent}
                  disabled={!newEventTitle.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
