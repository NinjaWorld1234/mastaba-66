/**
 * @fileoverview Settings component for user preferences and configuration
 * @module components/Settings
 */

import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { User, Bell, Lock, Globe, Moon, Save } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useToast } from './Toast';
import { sanitizeHTML, sanitizeEmail } from '../utils/sanitize';

/**
 * Settings nav item interface
 */
interface SettingsNavItem {
   id: string;
   label: string;
   icon: React.ComponentType<{ className?: string }>;
}

/**
 * Settings navigation item component
 */
const SettingsNavItem = memo<{
   item: SettingsNavItem;
   isActive: boolean;
   onClick: () => void;
}>(({ item, isActive, onClick }) => {
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         onClick();
      }
   }, [onClick]);

   return (
      <button
         onClick={onClick}
         onKeyDown={handleKeyDown}
         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
            ? 'bg-emerald-500/10 text-emerald-400 font-medium border-r-2 border-emerald-500'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
         role="tab"
         aria-selected={isActive}
         tabIndex={0}
      >
         <item.icon className="w-5 h-5" aria-hidden="true" />
         {item.label}
      </button>
   );
});
SettingsNavItem.displayName = 'SettingsNavItem';

/**
 * Preference row component
 */
const PreferenceRow = memo<{
   icon: React.ComponentType<{ className?: string }>;
   iconBgColor: string;
   iconColor: string;
   title: string;
   subtitle: string;
   onClick: () => void;
   rightElement?: React.ReactNode;
}>(({ icon: Icon, iconBgColor, iconColor, title, subtitle, onClick, rightElement }) => {
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         onClick();
      }
   }, [onClick]);

   return (
      <div
         className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
         onClick={onClick}
         onKeyDown={handleKeyDown}
         role="button"
         tabIndex={0}
         aria-label={`${title}: ${subtitle}`}
      >
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor}`}>
               <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
               <h5 className="font-bold text-white text-sm">{title}</h5>
               <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
         </div>
         {rightElement}
      </div>
   );
});
PreferenceRow.displayName = 'PreferenceRow';

/**
 * Toggle switch component
 */
const ToggleSwitch = memo<{
   isOn: boolean;
   isRtl: boolean;
}>(({ isOn, isRtl }) => (
   <div
      className={`w-10 h-5 rounded-full relative transition-colors ${isOn ? 'bg-emerald-600' : 'bg-gray-600'}`}
      role="switch"
      aria-checked={isOn}
   >
      <div
         className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isOn
            ? (isRtl ? 'left-1' : 'right-1')
            : (isRtl ? 'right-1' : 'left-1')
            }`}
         aria-hidden="true"
      ></div>
   </div>
));
ToggleSwitch.displayName = 'ToggleSwitch';

/**
 * Settings component - User preferences and account configuration
 * 
 * Features:
 * - Profile information editing
 * - Language preference toggle
 * - Theme preference toggle
 * - ARIA accessibility
 * - Input sanitization
 * 
 * @returns Settings component
 */
const Settings: React.FC = memo(() => {
   const { t, language, setLanguage } = useLanguage();
   const { user, updateUser } = useAuth();
   const { theme, toggleTheme } = useTheme();
   const toast = useToast();

   const isDark = useMemo(() => theme === 'night', [theme]);
   const isRtl = useMemo(() => language === 'ar', [language]);

   // Local state for form fields
   const [firstName, setFirstName] = useState('');
   const [lastName, setLastName] = useState('');
   const [email, setEmail] = useState('');
   const [activeSection, setActiveSection] = useState('profile');

   // Sync state with user data when it becomes available
   useEffect(() => {
      if (user) {
         setFirstName(user.name?.split(' ')[0] || '');
         setLastName(user.name?.split(' ')[1] || '');
         setEmail(user.email || '');
      }
   }, [user]);

   /** Navigation items */
   const navItems: SettingsNavItem[] = useMemo(() => [
      { id: 'profile', label: t('settings.profile'), icon: User },
      { id: 'notifications', label: t('settings.notifications'), icon: Bell },
      { id: 'privacy', label: t('settings.privacy'), icon: Lock },
   ], [t]);

   /** Handle save settings */
   const handleSave = useCallback(() => {
      // Sanitize inputs before saving
      const sanitizedFirstName = sanitizeHTML(firstName);
      const sanitizedLastName = sanitizeHTML(lastName);
      const sanitizedEmail = sanitizeEmail(email);

      const fullName = `${sanitizedFirstName} ${sanitizedLastName}`.trim();
      updateUser({
         name: fullName,
         email: sanitizedEmail
      });

      toast.success('تم حفظ الإعدادات بنجاح! ✅');
   }, [firstName, lastName, email, updateUser, toast]);

   /** Handle language toggle */
   const handleLanguageToggle = useCallback(() => {
      setLanguage(language === 'ar' ? 'en' : 'ar');
   }, [language, setLanguage]);

   /** Handle theme toggle */
   const handleThemeToggle = useCallback(() => {
      toggleTheme();
   }, [toggleTheme]);

   /** Handle cancel */
   const handleCancel = useCallback(() => {
      // Reset to original values
      if (user) {
         setFirstName(user.name?.split(' ')[0] || '');
         setLastName(user.name?.split(' ')[1] || '');
         setEmail(user.email || '');
      }
   }, [user]);

   /** Handle nav item click */
   const handleNavClick = useCallback((sectionId: string) => {
      setActiveSection(sectionId);
   }, []);

   return (
      <div
         className="animate-fade-in max-w-4xl mx-auto pb-10"
         role="main"
         aria-label={t('settings.title')}
      >
         <h2 className="text-3xl font-bold text-white mb-8">{t('settings.title')}</h2>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar Navigation */}
            <nav
               className="glass-panel p-4 rounded-2xl h-fit"
               role="tablist"
               aria-label="Settings sections"
            >
               <div className="space-y-1">
                  {navItems.map((item) => (
                     <SettingsNavItem
                        key={item.id}
                        item={item}
                        isActive={activeSection === item.id}
                        onClick={() => handleNavClick(item.id)}
                     />
                  ))}
               </div>
            </nav>

            {/* Main Settings Form */}
            <div className="md:col-span-2 space-y-6" role="tabpanel">
               {/* Profile Section */}
               <section className="glass-panel p-8 rounded-3xl" aria-label={t('settings.personalInfo')}>
                  <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                     {t('settings.personalInfo')}
                  </h3>

                  <div className="flex items-center gap-6 mb-8">
                     <div className="w-20 h-20 rounded-full bg-gray-700 relative overflow-hidden">
                        <img
                           src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=064e3b&color=fff&size=100"}
                           alt="Profile"
                           className="w-full h-full object-cover"
                           loading="lazy"
                        />
                        <div
                           className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                           role="button"
                           tabIndex={0}
                           aria-label={t('settings.changePhoto')}
                        >
                           <span className="text-[10px] text-white">{t('settings.changePhoto')}</span>
                        </div>
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-white">{firstName} {lastName}</h4>
                        <p className="text-sm text-gray-400">{t('settings.studentAdvanced')}</p>
                     </div>
                  </div>

                  <form className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" onSubmit={(e) => e.preventDefault()}>
                     <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm text-gray-400">
                           {t('settings.firstName')}
                        </label>
                        <input
                           id="firstName"
                           type="text"
                           value={firstName}
                           onChange={(e) => setFirstName(e.target.value)}
                           className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                           aria-label={t('settings.firstName')}
                        />
                     </div>
                     <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm text-gray-400">
                           {t('settings.lastName')}
                        </label>
                        <input
                           id="lastName"
                           type="text"
                           value={lastName}
                           onChange={(e) => setLastName(e.target.value)}
                           className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                           aria-label={t('settings.lastName')}
                        />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label htmlFor="email" className="text-sm text-gray-400">
                           {t('settings.email')}
                        </label>
                        <input
                           id="email"
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                           aria-label={t('settings.email')}
                        />
                     </div>
                  </form>
               </section>

               {/* Preferences */}
               <section className="glass-panel p-8 rounded-3xl" aria-label={t('settings.appPreferences')}>
                  <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                     {t('settings.appPreferences')}
                  </h3>

                  <div className="space-y-4">
                     <PreferenceRow
                        icon={Globe}
                        iconBgColor="bg-blue-500/10"
                        iconColor="text-blue-400"
                        title={t('settings.language')}
                        subtitle={language === 'ar' ? 'العربية' : 'English'}
                        onClick={handleLanguageToggle}
                        rightElement={
                           <span className="text-sm text-emerald-400">{t('settings.changePhoto')}</span>
                        }
                     />

                     <PreferenceRow
                        icon={Moon}
                        iconBgColor="bg-purple-500/10"
                        iconColor="text-purple-400"
                        title={t('settings.theme')}
                        subtitle={isDark ? 'الوضع الليلي' : 'الوضع النهاري'}
                        onClick={handleThemeToggle}
                        rightElement={<ToggleSwitch isOn={isDark} isRtl={isRtl} />}
                     />
                  </div>
               </section>

               {/* Action Buttons */}
               <div className="flex justify-end gap-4">
                  <button
                     onClick={handleCancel}
                     className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                     aria-label={t('settings.cancel')}
                  >
                     {t('settings.cancel')}
                  </button>
                  <button
                     onClick={handleSave}
                     className="px-8 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-black font-bold shadow-lg shadow-gold-500/20 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                     aria-label={t('settings.saveChanges')}
                  >
                     <Save className="w-4 h-4" aria-hidden="true" />
                     {t('settings.saveChanges')}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
});

Settings.displayName = 'Settings';

export default Settings;
