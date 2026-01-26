/**
 * @fileoverview Dashboard component displaying user's learning progress and course overview
 * @module components/Dashboard
 */

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Play, TrendingUp, Trophy, Target, Star, Zap, Bell } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BADGES } from '../constants';
import { Course } from '../types';
import api from '../services/api';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';

/**
 * Dashboard component props
 */
interface DashboardProps {
   /** Callback when user clicks to play a course */
   onPlayCourse: (course: Course) => void;
   /** Optional callback to change the active tab */
   setActiveTab?: (tab: string) => void;
   /** Optional unread message count */
   unreadCount?: number;
}

/**
 * Badge item component for displaying achievement badges
 */
const BadgeItem = memo<{ badge: typeof BADGES[0] }>(({ badge }) => (
   <div
      className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer ${badge.isUnlocked ? 'bg-gradient-to-b from-white/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50' : 'bg-white/5 opacity-40 grayscale'}`}
      role="listitem"
      aria-label={`${badge.title} - ${badge.isUnlocked ? 'Unlocked' : 'Locked'}`}
   >
      <div className="w-8 h-8 relative flex items-center justify-center mb-2">
         <badge.icon className={`w-5 h-5 ${badge.isUnlocked ? 'text-emerald-400' : 'text-gray-400'}`} aria-hidden="true" />
         {badge.isUnlocked && <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full"></div>}
      </div>
      <h4 className="font-bold text-[9px] text-center text-gray-300 truncate w-full">{badge.title}</h4>
   </div>
));
BadgeItem.displayName = 'BadgeItem';

/**
 * Course card component for displaying individual courses
 */
const CourseCard = memo<{ course: Course; language: string; onPlay: (course: Course) => void }>(({ course, language, onPlay }) => {
   const handleClick = useCallback(() => onPlay(course), [course, onPlay]);
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         onPlay(course);
      }
   }, [course, onPlay]);

   return (
      <div
         className="glass-panel p-3 rounded-xl flex gap-3 items-center group cursor-pointer glass-card-hover relative overflow-hidden bg-[#0a1f1c] hover:bg-[#0f2e29] border border-white/5"
         onClick={handleClick}
         onKeyDown={handleKeyDown}
         role="button"
         tabIndex={0}
         aria-label={`${language === 'ar' ? course.title : course.titleEn} - ${course.progress}% complete`}
      >
         {/* Progress Bar Background */}
         <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/20 w-full" aria-hidden="true">
            <div className="h-full bg-emerald-500" style={{ width: `${course.progress}%` }}></div>
         </div>

         <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-md">
            <img
               src={course.thumbnail}
               alt=""
               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
               loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Play className="w-6 h-6 text-white fill-current opacity-80" aria-hidden="true" />
            </div>
         </div>

         <div className="flex-1 min-w-0 py-0.5">
            <span className="text-[9px] font-bold text-emerald-400 mb-0.5 block">
               {language === 'ar' ? course.category : course.categoryEn}
            </span>
            <h4 className="font-bold text-white text-sm truncate leading-tight mb-1 group-hover:text-emerald-300 transition-colors">
               {language === 'ar' ? course.title : course.titleEn}
            </h4>
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
               {language === 'ar' ? course.instructor : course.instructorEn}
            </p>
         </div>

         <div className="flex flex-col items-end justify-center pl-2 border-l border-white/5 h-full">
            <span className="text-[10px] font-bold text-white">{course.progress}%</span>
         </div>
      </div>
   );
});
CourseCard.displayName = 'CourseCard';

/**
 * Dashboard component - Main student dashboard showing progress and courses
 * 
 * @param props - Dashboard props
 * @returns Dashboard component
 */
const Dashboard: React.FC<DashboardProps> = memo(({ onPlayCourse, setActiveTab, unreadCount }) => {
   const { t, language } = useLanguage();
   const { user } = useAuth();
   const [courses, setCourses] = useState<Course[]>([]);

   useEffect(() => {
      const loadCourses = async () => {
         try {
            const data = await api.getCourses();
            setCourses(Array.isArray(data) ? data : []);
         } catch {
            setCourses([]);
         }
      };
      loadCourses();
   }, []);

   /** Navigate to a specific tab */
   const handleNavigate = useCallback((tab: string) => {
      setActiveTab?.(tab);
   }, [setActiveTab]);

   /** Handle keyboard navigation for clickable cards */
   const handleCardKeyDown = useCallback((tab: string) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         handleNavigate(tab);
      }
   }, [handleNavigate]);

   /** Calculate actual progress from courses */
   const courseProgress = useMemo(() => {
      if (!Array.isArray(courses) || courses.length === 0) return 0;
      const totalProgress = courses.reduce((sum, c) => {
         const prog = (c && typeof c.progress === 'number') ? c.progress : 0;
         return sum + prog;
      }, 0);
      return Math.round(totalProgress / courses.length);
   }, [courses]);

   /** Chart data for progress pie chart */
   const chartData = useMemo(() => [
      { name: 'Completed', value: courseProgress },
      { name: 'Remaining', value: 100 - courseProgress },
   ], [courseProgress]);

   const COLORS = useMemo(() => ['#10b981', 'rgba(255,255,255,0.1)'], []);

   /** Get displayed courses (first 4) */
   const displayedCourses = useMemo(() => courses.slice(0, 4), [courses]);

   /** User statistics from context with safe fallbacks */
   const userPoints = (user && typeof user.points === 'number') ? user.points : 0;
   const userStreak = (user && typeof user.streak === 'number') ? user.streak : 0;
   const userLevel = (user && typeof user.level === 'number') ? user.level : 1;

   return (
      <div className="space-y-6 animate-fade-in pb-10 relative" role="main" aria-label={t('dashboard.title') || 'Dashboard'}>

         {/* Enhanced New Message Banner */}
         {unreadCount !== undefined && unreadCount > 0 ? (
            <div
               onClick={() => setActiveTab?.('messages')}
               className="bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-transparent border border-violet-500/40 p-5 rounded-[2rem] flex items-center justify-between cursor-pointer group hover:border-violet-400/60 transition-all backdrop-blur-xl relative z-30 mb-8 shadow-2xl shadow-violet-900/20 overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-900/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative">
                     <Bell className="w-7 h-7 text-white" />
                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a1f1c] animate-pulse" />
                     <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse-slow" />
                  </div>
                  <div>
                     <h4 className="text-white font-extrabold text-lg leading-tight group-hover:text-violet-200 transition-colors">لديك رسائل جديدة لم تقرأ بعد!</h4>
                     <p className="text-violet-200/80 text-sm mt-1 font-medium">هناك <span className="text-white font-bold px-1.5 py-0.5 bg-white/10 rounded-md">{unreadCount}</span> رسائل في انتظارك بمحادثة الدعم.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 text-white text-xs font-black bg-violet-500/30 px-5 py-2.5 rounded-full group-hover:bg-violet-500/50 transition-all border border-violet-400/30 shadow-inner">
                  <span>انتقال للمحادثات</span>
                  <Play className="w-3 h-3 rotate-180 fill-current" />
               </div>
            </div>
         ) : null}

         {/* 1. Compact Top Tiles Section */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label={t('dashboard.stats') || 'Statistics'}>

            {/* Card 1: Points */}
            <div
               onClick={() => handleNavigate('profile')}
               onKeyDown={handleCardKeyDown('profile')}
               className="glass-panel-gold rounded-2xl p-4 relative overflow-hidden group bg-gradient-to-l from-[#451d03] to-[#78350f] cursor-pointer"
               role="button"
               tabIndex={0}
               aria-label={`${t('dashboard.knowledgePoints')} - ${userPoints.toLocaleString()}`}
            >
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" aria-hidden="true"></div>
               <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-gold-500 rounded-full blur-[40px] opacity-40" aria-hidden="true"></div>

               <div className="relative z-10 flex items-center justify-between h-full">
                  <div className="flex flex-col justify-center">
                     <p className="text-gold-200 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-gold-500 text-gold-500" aria-hidden="true" />
                        {t('dashboard.knowledgePoints')}
                     </p>
                     <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-white gold-glow font-serif">{userPoints.toLocaleString()}</h3>
                        <span className="text-[10px] text-gold-400 font-bold bg-black/30 px-1.5 py-0.5 rounded border border-gold-500/30">{language === 'ar' ? `المستوى ${userLevel}` : `Level ${userLevel}`}</span>
                     </div>
                  </div>

                  <div className="w-12 h-12 relative flex items-center justify-center bg-gradient-to-br from-gold-400 to-yellow-600 rounded-xl shadow-lg shadow-gold-900/50 transform group-hover:rotate-6 transition-transform" aria-hidden="true">
                     <Trophy className="w-6 h-6 text-[#451d03]" />
                  </div>
               </div>
            </div>

            {/* Card 2: Rank */}
            <div
               onClick={() => handleNavigate('profile')}
               onKeyDown={handleCardKeyDown('profile')}
               className="glass-panel rounded-2xl p-4 relative overflow-hidden group bg-gradient-to-l from-[#064e3b] to-[#065f46] border-emerald-500/30 cursor-pointer"
               role="button"
               tabIndex={0}
               aria-label={`${t('dashboard.globalRank')} - ${t('dashboard.top5Percent')}`}
            >
               <div className="mashrabiya-pattern absolute inset-0 opacity-10" aria-hidden="true"></div>
               <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-400 rounded-full blur-[40px] opacity-30" aria-hidden="true"></div>

               <div className="relative z-10 flex items-center justify-between h-full">
                  <div className="flex flex-col justify-center">
                     <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                        {t('dashboard.globalRank')}
                     </p>
                     <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-white font-serif">{t('dashboard.top5Percent')}</h3>
                     </div>
                     <span className="text-[10px] text-emerald-300/80 mt-0.5">{t('dashboard.regionalRank')}</span>
                  </div>

                  <div className="w-12 h-12 relative flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-lg shadow-emerald-900/50 transform group-hover:-rotate-6 transition-transform" aria-hidden="true">
                     <Target className="w-6 h-6 text-[#022c22]" />
                  </div>
               </div>
            </div>

            {/* Card 3: Streak */}
            <div
               onClick={() => handleNavigate('daily-tracking')}
               onKeyDown={handleCardKeyDown('daily-tracking')}
               className="glass-panel rounded-2xl p-4 relative overflow-hidden group bg-gradient-to-l from-[#1e1b4b] to-[#312e81] border-indigo-500/30 cursor-pointer"
               role="button"
               tabIndex={0}
               aria-label={`${t('dashboard.learningStreak')} - ${userStreak} ${t('dashboard.daysStreak')}`}
            >
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] opacity-10" aria-hidden="true"></div>

               <div className="relative z-10 flex items-center justify-between h-full">
                  <div className="flex flex-col justify-center">
                     <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-400 fill-current" aria-hidden="true" />
                        {t('dashboard.learningStreak')}
                     </p>
                     <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-white font-serif">{userStreak}</h3>
                        <span className="text-xs font-medium text-indigo-300">{t('dashboard.daysStreak')}</span>
                     </div>
                  </div>

                  <div className="w-12 h-12 relative flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl shadow-lg shadow-indigo-900/50 transform group-hover:scale-110 transition-transform" aria-hidden="true">
                     {userStreak > 0 && <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-2 right-2 animate-ping"></div>}
                     <Zap className="w-6 h-6 text-[#1e1b4b] fill-current" />
                  </div>
               </div>
            </div>
         </div>

         {/* Badges Section */}
         <div className="glass-panel p-5 rounded-2xl relative overflow-hidden bg-white/5 border border-white/10" role="region" aria-label={t('dashboard.latestAchievements')}>
            <div className="corner-ornament-complex corner-tl w-10 h-10 opacity-30" aria-hidden="true"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
               <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-5 bg-gold-500 rounded-full" aria-hidden="true"></span>
                  {t('dashboard.latestAchievements')}
               </h3>
               <button
                  onClick={() => handleNavigate('profile')}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                  aria-label={t('dashboard.viewAll')}
               >
                  {t('dashboard.viewAll')}
               </button>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-7 gap-3 relative z-10" role="list" aria-label="Achievements">
               {BADGES.map((badge) => (
                  <BadgeItem key={badge.id} badge={badge} />
               ))}
            </div>
         </div>

         {/* Main Content Split */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Courses */}
            <div className="lg:col-span-2 space-y-4" role="region" aria-label={t('dashboard.continueLearning')}>
               <div className="flex items-center justify-between px-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                     <div className="p-1 rounded bg-emerald-500/20 border border-emerald-500/30" aria-hidden="true">
                        <Play className="w-3 h-3 text-emerald-400 fill-current" />
                     </div>
                     {t('dashboard.continueLearning')}
                  </h3>
                  <button
                     onClick={() => handleNavigate('library')}
                     className="text-[10px] font-bold text-gray-400 hover:text-white"
                     aria-label={t('dashboard.fullLibrary')}
                  >
                     {t('dashboard.fullLibrary')}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedCourses.map((course) => (
                     <CourseCard key={course.id} course={course} language={language} onPlay={onPlayCourse} />
                  ))}
               </div>
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-4" role="complementary">
               {/* Chart Widget */}
               <div
                  onClick={() => handleNavigate('progress')}
                  onKeyDown={handleCardKeyDown('progress')}
                  className="glass-panel rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-[#064e3b] to-[#022c22] cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('dashboard.courseProgress')} - ${courseProgress}% ${t('dashboard.completed')}`}
               >
                  <div>
                     <h3 className="text-xs font-bold text-gray-300 mb-1 group-hover:text-emerald-300 transition-colors">{t('dashboard.courseProgress')}</h3>
                     <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">{courseProgress}%</span>
                        <span className="text-[10px] text-emerald-400">{t('dashboard.completed')}</span>
                     </div>
                  </div>
                  <div className="w-16 h-16 relative" aria-hidden="true">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={chartData}
                              innerRadius={20}
                              outerRadius={30}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              stroke="none"
                           >
                              {chartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Live Event Banner */}
               <div
                  onClick={() => handleNavigate('courses')}
                  onKeyDown={handleCardKeyDown('courses')}
                  className="glass-panel p-0 rounded-2xl relative overflow-hidden group cursor-pointer border-t border-white/10"
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('dashboard.liveEvent')} - ${t('dashboard.fiqhCouncil')}`}
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-teal-900 to-cyan-950 opacity-60 group-hover:opacity-70 transition-opacity" aria-hidden="true"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" aria-hidden="true"></div>

                  <div className="relative z-10 p-4">
                     <div className="flex justify-between items-start mb-6">
                        <span className="flex items-center gap-1.5 text-[9px] font-bold bg-red-600/90 text-white px-2 py-0.5 rounded backdrop-blur-sm animate-pulse" aria-live="polite">
                           <span className="w-1.5 h-1.5 bg-white rounded-full" aria-hidden="true"></span> {t('dashboard.liveEvent')}
                        </span>
                     </div>

                     <div>
                        <h4 className="font-bold text-white text-sm mb-1 text-shadow-sm">{t('dashboard.fiqhCouncil')}</h4>
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] text-gray-300">{t('dashboard.sheikhName')}</p>
                           <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors" aria-hidden="true">
                              <Play className="w-3 h-3 fill-current" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>
   );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
