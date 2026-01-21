import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, ArrowRight, Maximize, Minimize, Lock, CheckCircle, FileText } from 'lucide-react';
import { Course } from '../types';
import { useLanguage } from './LanguageContext';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

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

  const episodes = course.episodes && course.episodes.length > 0
    ? course.episodes
    : [{ id: 'default', title: course.title, videoUrl: course.videoUrl || '', orderIndex: 0 }];

  const currentEpisode = episodes[currentEpisodeIndex];
  const videoSrc = currentEpisode.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

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
    // Simple logic: must finish previous episode (and pass quiz if applicable)
    // For now, let's just do sequential lock based on current index
    return index > currentEpisodeIndex;
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

      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center">

        {/* Curriculum Sidebar */}
        <div className="w-full md:w-80 flex flex-col h-full max-h-[70vh] glass-panel border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              منهج الدورة
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {episodes.map((ep, idx) => {
              const locked = isEpisodeLocked(idx);
              const active = idx === currentEpisodeIndex;

              return (
                <button
                  key={ep.id}
                  disabled={locked}
                  onClick={() => setCurrentEpisodeIndex(idx)}
                  className={`w-full text-right p-3 rounded-xl transition-all flex items-start gap-3 group relative ${active ? 'bg-violet-600/20 border border-violet-500/30' :
                    locked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? 'bg-violet-500 text-white' : 'bg-black/40 text-gray-400'
                    }`}>
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${active ? 'text-white' : 'text-gray-400'}`}>
                      {ep.title}
                    </p>
                    {ep.duration && <p className="text-[10px] text-gray-500 mt-0.5">{ep.duration}</p>}
                  </div>
                  {locked ? (
                    <Lock className="w-3.5 h-3.5 text-gray-600 mt-1" />
                  ) : active ? (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Progression Quiz Placeholder */}
          {currentEpisodeIndex > 0 && (currentEpisodeIndex + 1) % 3 === 0 && (
            <div className="p-4 bg-violet-600/10 border-t border-violet-500/20">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-bold mb-2">
                <CheckCircle className="w-4 h-4" />
                حان وقت الاختبار!
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">اكمل هذه المحاضرة لفتح الاختبار للمرحلة القادمة.</p>
            </div>
          )}
        </div>

        {/* Video Area */}
        <div className="flex-1 flex flex-col gap-6">
          <div ref={containerRef} className={`w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group bg-black transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
            <video
              key={videoSrc}
              ref={videoRef}
              src={videoSrc}
              className="w-full max-h-[60vh] object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                // could auto mark complete here
              }}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            />

            {/* Overlay Controls (simplified for brevity) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={() => setIsPlaying(true)}>
                <Play className="w-16 h-16 text-white opacity-80" />
              </div>
            )}
          </div>

          {/* Title & Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{currentEpisode.title}</h2>
                <p className="text-violet-400 text-sm">{course.instructor}</p>
              </div>
              <button
                onClick={handleMarkComplete}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20"
              >
                {currentEpisodeIndex === episodes.length - 1 ? "إكمال الدورة" : "المحاضرة التالية"}
              </button>
            </div>

            <div className="space-y-2">
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
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
