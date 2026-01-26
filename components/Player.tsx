import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, ArrowRight, Maximize, Minimize, Lock, CheckCircle, FileText, Heart } from 'lucide-react';
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [maxTimeReached, setMaxTimeReached] = useState(0);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

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

        // Check favorite status
        if (user) {
          const favorites = await api.getFavorites(user.id);
          setIsFavorite(favorites.some((f: any) => String(f.targetId) === String(course.id) && f.type === 'course'));
        }
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

      // Track how far the student has watched
      if (current > maxTimeReached) {
        setMaxTimeReached(current);
      }

      const newProgress = Math.floor((current / total) * 100);
      setProgress(newProgress);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only students get the security alert
      if (document.hidden && isPlaying && user?.role !== 'admin') {
        setIsPlaying(false);
        setShowSecurityAlert(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen or common shortcuts for students only
      if (e.key === 'PrintScreen' && user?.role !== 'admin') {
        setShowSecurityAlert(true);
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleMarkComplete = async () => {
    if (currentEpisode.id !== 'default') {
      await api.updateEpisodeProgress(course.id, currentEpisode.id, true);
    }

    // Check for manual quiz at this stage
    let quizToShow = quizzes.find(q => q.afterEpisodeIndex === currentEpisodeIndex + 1);

    // If no manual quiz but frequency is hit, try to find ANY quiz for this course that hasn't been passed
    // or specifically look for a quiz designated for this frequency slot.
    // For now, we prioritize explicit afterEpisodeIndex mapping.
    const quizFrequency = course.quizFrequency || 0;
    const isFrequencySlot = quizFrequency > 0 && (currentEpisodeIndex + 1) % quizFrequency === 0;

    if (isFrequencySlot && !quizToShow && user?.role !== 'admin') {
      // Fallback: Find the NEXT available quiz for this course if frequency is hit but no specific mapping
      quizToShow = quizzes.find(q => !passedQuizIds.includes(q.id));
    }

    if (quizToShow && !passedQuizIds.includes(quizToShow.id) && user?.role !== 'admin') {
      setActiveQuiz(quizToShow);
      return;
    }

    // If it's the last episode, mark course as complete
    if (currentEpisodeIndex === episodes.length - 1) {
      api.updateCourseProgress(course.id, 100);
      setIsCompleted(true);
    } else {
      // Auto-advance
      setCurrentEpisodeIndex(prev => prev + 1);
      // Reset maxTimeReached for the new episode
      setMaxTimeReached(0);
      setProgress(0);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    try {
      const res = await api.toggleFavorite(user.id, course.id, 'course');
      if (res) {
        setIsFavorite(res.action === 'added');
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const isEpisodeLocked = (index: number) => {
    if (user?.role === 'admin') return false; // Admin can go anywhere
    if (index === 0) return false;

    // An episode is locked if the previous one is not completed
    const prevEpisode = episodes[index - 1];
    const isPrevCompleted = prevEpisode.completed || (index - 1 < currentEpisodeIndex);

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
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white mb-1 truncate leading-tight">{currentEpisode.title}</h2>
                    <button
                      onClick={handleToggleFavorite}
                      className={`p-1 rounded-lg transition-colors ${isFavorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'}`}
                      title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <p className="text-violet-400 text-xs font-medium truncate">{course.instructor}</p>
                </div>
                <button
                  onClick={handleMarkComplete}
                  disabled={user?.role !== 'admin' && progress < 100 && !isCompleted}
                  className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-lg flex-shrink-0 flex items-center gap-1 ${user?.role !== 'admin' && progress < 100 && !isCompleted
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                    }`}
                >
                  {user?.role !== 'admin' && progress < 100 && !isCompleted ? <Lock className="w-3 h-3" /> : <CheckCircle className="w-3.5 h-3.5" />}
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
                    const newTime = (newProgress / 100) * duration;

                    // Admins always allow seeking, students have restrictions
                    const isAdmin = user?.role === 'admin';
                    if (isAdmin || newTime <= maxTimeReached || isCompleted || newTime < currentTime) {
                      setProgress(newProgress);
                      if (videoRef.current && duration) {
                        videoRef.current.currentTime = newTime;
                      }
                    } else {
                      // Optionally show a toast or message
                      console.warn("Seeking forward is restricted until content is watched.");
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

                  {/* Playback Speed */}
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none focus:border-violet-500"
                    dir="ltr"
                  >
                    <option value="0.25">0.25x</option>
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2.0x</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        const newTime = videoRef.current.currentTime + 10;
                        const isAdmin = user?.role === 'admin';
                        if (isAdmin || newTime <= maxTimeReached || isCompleted) {
                          videoRef.current.currentTime = newTime;
                        } else {
                          console.warn("Cannot skip forward beyond watched content.");
                        }
                      }
                    }}
                    className={`p-1.5 rounded-full transition-colors ${(user?.role === 'admin' || currentTime + 10 <= maxTimeReached || isCompleted)
                      ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                      : 'text-gray-600 cursor-not-allowed'
                      }`}
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
          <div className="flex-1 w-full flex flex-col items-center justify-center p-2 min-h-[400px]">
            <div ref={containerRef} className={`relative group transition-all rounded-2xl overflow-hidden shadow-2xl bg-black ${isFullscreen ? 'fixed inset-0 z-50 rounded-none w-full h-full flex items-center justify-center' : 'w-fit max-w-full mx-auto'}`} style={{ height: isFullscreen ? '100vh' : 'auto' }}>
              {videoLoading && !videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
                  <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white text-sm font-medium">جاري تحميل المحتوى...</p>
                </div>
              )}

              {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 p-6 text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">عذراً، فشل تحميل الفيديو</h3>
                  <p className="text-gray-400 text-sm mb-6">يرجى التحقق من اتصال الإنترنت أو المحاولة مرة أخرى لاحقاً.</p>
                  <button
                    onClick={() => { setVideoError(false); setVideoLoading(true); }}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              <video
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                // crossOrigin="anonymous" // Removed to avoid CORS issues on public R2 links
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className={`max-h-[70vh] w-auto max-w-full mx-auto block transition-opacity duration-300 ${videoLoading ? 'opacity-0' : 'opacity-100'}`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onWaiting={() => setVideoLoading(true)}
                onPlaying={() => setVideoLoading(false)}
                onCanPlay={() => setVideoLoading(false)}
                onError={() => {
                  setVideoError(true);
                  setVideoLoading(false);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  handleMarkComplete();
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

      {/* Security Alert Overlay */}
      {showSecurityAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 animate-fade-in backdrop-blur-md">
          <div className="bg-red-600/20 border border-red-500/50 p-8 rounded-3xl max-w-md text-center space-y-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">تنبيه أمان!</h3>
            <p className="text-red-200">
              يُمنع تسجيل الشاشة أو مغادرة الصفحة أثناء تشغيل المحتوى. يرجى الالتزام بسياسات المنصة لحماية حقوق الملكية.
            </p>
            <button
              onClick={() => setShowSecurityAlert(false)}
              className="px-6 py-2 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
