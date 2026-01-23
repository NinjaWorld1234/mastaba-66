import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, ArrowRight, Maximize, Minimize, Lock, CheckCircle, FileText } from 'lucide-react';
import { Course } from '../types';
import { useLanguage } from './LanguageContext';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import Quiz from './Quiz';
import { Quiz as QuizType, QuizResult } from '../types';

interface PlayerProps {
  course: Course;
  onBack: () => void;
}

const Player: React.FC<PlayerProps> = ({ course, onBack }) => {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(course.progress || 0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompleted, setIsCompleted] = useState(course.progress === 100);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizType | null>(null);
  const [passedQuizIds, setPassedQuizIds] = useState<string[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);

  const episodes = course.episodes && course.episodes.length > 0
    ? course.episodes
    : [{ id: 'default', title: course.title, videoUrl: course.videoUrl || '', orderIndex: 0 }];

  const currentEpisode = episodes[currentEpisodeIndex];
  const videoSrc = currentEpisode.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseQuizzes = await api.getQuizzes();
        setQuizzes(courseQuizzes.filter(q => q.courseId === course.id));

        const results = await api.quizResults.get();
        const passedIds = results
          .filter(r => r.percentage >= (courseQuizzes.find(q => q.id === r.quizId)?.passingScore || 70))
          .map(r => r.quizId);
        setPassedQuizIds(passedIds);
      } catch (e) {
        console.error('Error loading player data:', e);
      } finally {
        setIsLoadingQuizzes(false);
      }
    };
    fetchData();
  }, [course.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total || 0);

      const newProgress = Math.floor((current / total) * 100);
      setProgress(newProgress);
    }
  };

  const handleMarkComplete = async () => {
    if (currentEpisode.id !== 'default') {
      await api.updateEpisodeProgress(course.id, currentEpisode.id, true);
    }

    // Check if there's a quiz that should appear after THIS episode
    const quizAtThisStage = quizzes.find(q => q.afterEpisodeIndex === currentEpisodeIndex + 1);

    if (quizAtThisStage && !passedQuizIds.includes(quizAtThisStage.id)) {
      setActiveQuiz(quizAtThisStage);
      return;
    }

    // If it's the last episode, mark course as complete
    if (currentEpisodeIndex === episodes.length - 1) {
      api.updateCourseProgress(course.id, 100);
      setIsCompleted(true);
    } else {
      // Auto-advance
      setCurrentEpisodeIndex(prev => prev + 1);
    }
  };

  const isEpisodeLocked = (index: number) => {
    if (index === 0) return false;
    if (index > currentEpisodeIndex) return true;
    return false;
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 w-fit transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span>{t('player.backToCourses')}</span>
      </button>

      {activeQuiz ? (
        <div className="flex-1">
          <Quiz
            quiz={activeQuiz}
            onSuccess={() => {
              setPassedQuizIds(prev => [...prev, activeQuiz.id]);
            }}
            onClose={() => {
              if (passedQuizIds.includes(activeQuiz.id)) {
                if (currentEpisodeIndex < episodes.length - 1) {
                  setCurrentEpisodeIndex(prev => prev + 1);
                } else {
                  setIsCompleted(true);
                }
              }
              setActiveQuiz(null);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col-reverse md:flex-row gap-8 items-center justify-center">

          {/* Right Column (Controls + Curriculum) - RTL First */}
          <div className="w-full md:w-96 flex flex-col gap-4 h-full max-h-[85vh]">

            {/* Custom Control Bar & Info Moved Here */}
            <div className="w-full bg-black/20 backdrop-blur-lg p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col gap-4">
              {/* Info & Mark Complete */}
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white mb-1 truncate leading-tight">{currentEpisode.title}</h2>
                  <p className="text-violet-400 text-xs font-medium truncate">{course.instructor}</p>
                </div>
                <button
                  onClick={handleMarkComplete}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg flex-shrink-0 flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {currentEpisodeIndex === episodes.length - 1 ? "إكمال" : "التالي"}
                </button>
              </div>

              {/* Progress Bar (Forced LTR) */}
              <div className="space-y-1 group" dir="ltr">
                <input
                  type="range"
                  value={progress}
                  onChange={(e) => {
                    const newProgress = Number(e.target.value);
                    setProgress(newProgress);
                    if (videoRef.current && duration) {
                      videoRef.current.currentTime = (newProgress / 100) * duration;
                    }
                  }}
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
                  }}
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons (RTL Layout) */}
              <div className="flex items-center justify-between" dir="rtl">
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={() => {
                      if (isPlaying) videoRef.current?.pause();
                      else videoRef.current?.play();
                      setIsPlaying(!isPlaying);
                    }}
                    className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2 group">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !videoRef.current.muted;
                        }
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {/* Volume slider hidden on small width or made smaller? Let's keep it small */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="1"
                      dir="ltr"
                      onChange={(e) => {
                        if (videoRef.current) videoRef.current.volume = Number(e.target.value);
                      }}
                      className="w-16 h-1 bg-white/10 rounded-lg accent-gray-400 hover:accent-white hidden sm:block"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="+10s"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="-10s"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button onClick={toggleFullscreen} className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Curriculum Sidebar (Existing) */}
            <div className="flex-1 flex flex-col min-h-0 glass-panel border border-white/5 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-violet-400" />
                  منهج الدورة
                </h3>
              </div>
              {/* List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {episodes.map((ep, idx) => {
                  const locked = isEpisodeLocked(idx);
                  const active = idx === currentEpisodeIndex;

                  return (
                    <button
                      key={ep.id}
                      disabled={locked}
                      onClick={() => setCurrentEpisodeIndex(idx)}
                      className={`w-full text-right p-2.5 rounded-xl transition-all flex items-start gap-3 group relative ${active ? 'bg-violet-600/20 border border-violet-500/30' :
                        locked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? 'bg-violet-500 text-white' : 'bg-black/40 text-gray-400'
                        }`}>
                        <span className="text-[9px] font-bold">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${active ? 'text-white' : 'text-gray-400'}`}>
                          {ep.title}
                        </p>
                        {ep.duration && <p className="text-[9px] text-gray-500 mt-0.5">{ep.duration}</p>}
                      </div>
                      {locked ? (
                        <Lock className="w-3 h-3 text-gray-600 mt-1" />
                      ) : active ? (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {/* Quizzes at bottom of curriculum */}
              <div className="border-t border-white/5 max-h-32 overflow-y-auto">
                {quizzes.map(q => (
                  <div key={q.id} className={`p-3 border-b border-white/5 last:border-0 ${passedQuizIds.includes(q.id) ? 'bg-emerald-600/10' : 'bg-amber-600/10'}`}>
                    <div className={`flex items-center gap-2 text-[10px] font-bold mb-0.5 ${passedQuizIds.includes(q.id) ? 'text-emerald-300' : 'text-amber-300'}`}>
                      <CheckCircle className="w-3 h-3" />
                      {q.title}
                    </div>
                    <p className="text-[8px] text-gray-500">
                      بعد محاضرة {q.afterEpisodeIndex}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <div ref={containerRef} className={`relative group transition-all rounded-2xl overflow-hidden shadow-2xl ${isFullscreen ? 'fixed inset-0 z-50 rounded-none w-full h-full bg-black flex items-center justify-center' : 'w-fit h-fit max-h-[75vh] mx-auto'}`}>
              <video
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className={`block ${isFullscreen ? 'max-w-full max-h-full' : 'max-h-[75vh] w-auto'} object-contain`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  setIsPlaying(false);
                }}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              />

              {/* Center Play Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer" onClick={() => setIsPlaying(true)}>
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-white fill-current" />
                  </div>
                </div>
              )}

              {/* Fullscreen Overlay Controls (Exit Button) */}
              {isFullscreen && (
                <div className="absolute top-6 left-6 z-50 animate-fade-in">
                  <button
                    onClick={toggleFullscreen}
                    className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/10 shadow-lg group-hover:opacity-100 opacity-0 transition-opacity duration-3000 delay-1000"
                    // Make it fade out after inactivity? For now just show on hover of container
                    style={{ opacity: 1 }} // Force visible for now or use CSS group-hover
                  >
                    <Minimize className="w-5 h-5" />
                    <span className="text-sm font-bold">تصغير الشاشة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
