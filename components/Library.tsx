import React from 'react';
import { Book, FileText, Download, Search, Filter } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Library: React.FC = () => {
   const { t, language } = useLanguage();
   const [searchQuery, setSearchQuery] = React.useState('');

   const resources = [
      { type: 'pdf', title: t('library.resources.puritySummary'), author: t('library.authors.sheikhAhmed'), size: '2.5 MB', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=200&fit=crop' },
      { type: 'book', title: t('library.resources.raheeq'), author: t('library.authors.mubarakpuri'), size: '15 MB', image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=300&h=200&fit=crop' },
      { type: 'pdf', title: t('library.resources.prophetsTree'), author: t('library.authors.designTeam'), size: '5 MB', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop' },
      { type: 'doc', title: t('library.resources.tracker'), author: t('library.authors.mastaba'), size: '0.5 MB', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop' },
      { type: 'pdf', title: t('library.resources.adhkar'), author: t('library.authors.fortress'), size: '1.2 MB', image: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=300&h=200&fit=crop' },
   ];

   const filteredResources = resources.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const handleDownload = (title: string) => {
      alert(`جاري تحميل: ${title}...`);
   };

   return (
      <div className="animate-fade-in">
         <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <div>
               <h2 className="text-3xl font-bold text-white mb-2">{t('library.title')}</h2>
               <p className="text-gray-400">{t('library.subtitle')}</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <input
                     type="text"
                     placeholder={t('library.searchPlaceholder')}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                  <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 text-gray-400 w-5 h-5`} />
               </div>
               <button className="p-2.5 rounded-xl glass-panel hover:bg-white/10">
                  <Filter className="w-5 h-5 text-gray-300" />
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredResources.map((item, idx) => (
               <div key={idx} className="glass-panel p-5 rounded-2xl group hover:border-emerald-500/30 transition-all duration-300">
                  <div className="h-40 rounded-xl mb-4 relative overflow-hidden">
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                     <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
                        {item.type === 'book' ? <Book className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-emerald-400" />}
                     </div>
                  </div>

                  <h3 className="font-bold text-white mb-1 truncate">{item.title}</h3>
                  <p className="text-xs text-gray-400 mb-4">{item.author}</p>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                     <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">{item.size}</span>
                     <button
                        onClick={() => handleDownload(item.title)}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                     >
                        <Download className="w-4 h-4" />
                        {t('library.download')}
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

export default Library;
