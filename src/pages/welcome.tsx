import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Activity, 
  ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeSettings {
  id: string;
  image_url: string;
  video_url: string;
  youtube_url: string;
  google_drive_url: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: WelcomeSettings = {
  id: "1",
  image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80",
  video_url: "",
  youtube_url: "",
  google_drive_url: "",
  updated_at: new Date().toISOString()
};

export default function WelcomePage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [settings, setSettings] = useState<WelcomeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [mounted, setMounted] = useState(false);

  const backgroundImageSrc = 
    (!settings.image_url || settings.image_url === "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80") 
      ? "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80"
      : settings.image_url;

  // Sync real-time clock tickers
  useEffect(() => {
    const r = requestAnimationFrame(() => {
      setMounted(true);
    });
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      cancelAnimationFrame(r);
      clearInterval(timer);
    };
  }, []);

  // Fetch Welcome Page Assets Configuration
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from("welcome_settings").select("*").eq("id", "1");
        if (data && data.length > 0) {
          setSettings(data[0]);
        }
      } catch (e) {
        console.warn("Could not query dynamic welcome media", e);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    
    // Set up Realtime Subscription for instantaneous admin changes
    const channel = supabase
      .channel("welcome-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "welcome_settings", filter: "id=eq.1" },
        (payload: any) => {
          if (payload.new) {
            setSettings(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatWIB = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }) + " WIB";
  };

  const getDayText = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Safe YouTube ID extractor
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = getYoutubeVideoId(settings.youtube_url);
  const forcedVideoUrl = "https://labs.google/fx/api/og-video/shared/aa8e5e45-5eb3-4f60-a0e1-b029cfa72289";
  const isYoutube = false;
  const isDrive = false;
  const isRawVideo = true;

  return (
    <div id="welcome-fullscreen-canvas" className="relative min-h-screen text-white flex flex-col justify-between overflow-hidden">
      
      {/* CINEMATIC MEDIA BACKDROP SCREEN */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden bg-slate-950">
        
        {isYoutube ? (
          <div className="absolute inset-0 pointer-events-none scale-110">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1`}
              className="w-full h-full object-cover opacity-35"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              title="OPTIMUS Background Stream"
            />
          </div>
        ) : isDrive ? (
          // Google Drive stream representation
          <div className="absolute inset-0">
            {/* Fallback layout styled cleanly with static image but subtle blur */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={backgroundImageSrc}
              alt="Background Fallback" 
              className="w-full h-full object-cover opacity-35 filter blur-[2px]"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : isRawVideo ? (
          <video
            ref={(el) => {
              if (el) {
                el.defaultMuted = true;
                el.muted = muted;
                el.play().catch(e => console.warn("Autoplay error:", e));
              }
            }}
            src={forcedVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-[0.6]"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={backgroundImageSrc}
              alt="Welcome Background Image Fallback" 
              className="w-full h-full object-cover opacity-30 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
          </>
        )}

        {/* Cinematic dark mask overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/85 z-0" />
      </div>

      {/* TOPHEADER TICKER BAR */}
      <header className="relative z-10 w-full px-6 py-5 md:px-12 flex justify-between items-center bg-slate-950/10 backdrop-blur-xs border-b border-white/5 font-sans">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            +
          </div>
          <div className="flex flex-col">
            <span style={{ fontSize: "17px" }} className="font-extrabold uppercase tracking-widest text-emerald-400">OPTIMUS</span>
            <span style={{ fontSize: "16px" }} className="text-slate-400 font-bold uppercase tracking-wider block">UOBK RSUD AL-MULK</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {mounted && (
            <div className="hidden md:flex flex-col text-right animate-in fade-in duration-350">
              <span className="text-xs font-black text-white">{getDayText(currentTime)}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{formatWIB(currentTime)}</span>
            </div>
          )}

          {/* Sound Toggle controls for raw MP4 backing audio */}
          {isRawVideo && (
            <button 
              onClick={() => setMuted(!muted)}
              className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-350 hover:text-white transition-colors cursor-pointer"
              title={muted ? "Nyalakan Audio" : "Bisukan Audio"}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}
        </div>
      </header>

      {/* MID SECTION GREETING CARDS */}
      <main className="relative z-10 w-full px-6 flex-1 flex flex-col items-center justify-center text-center">
        <style dangerouslySetInnerHTML={{ __html: `
          .glass-emboss-heading {
            color: #ffffff;
            -webkit-text-stroke: 1.2px rgba(0, 0, 0, 0.85);
            text-shadow: 
              -1px -1px 0px rgba(255, 255, 255, 0.25), 
              1px 1px 3px rgba(0, 0, 0, 0.9), 
              0 8px 32px rgba(0, 0, 0, 0.65);
          }
          .glass-emboss-desc {
            color: rgba(255, 255, 255, 0.9);
            -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.8);
            text-shadow: 
              -0.5px -0.5px 0px rgba(255, 255, 255, 0.25), 
              1px 1px 1.5px rgba(0, 0, 0, 0.9), 
              0 4px 16px rgba(0, 0, 0, 0.55);
          }
        `}} />
        <div className="max-w-2xl bg-slate-950/50 border border-white/10 p-8 md:p-12 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
          
          <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
            <Activity size={20} />
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-emerald-400 tracking-widest uppercase bg-emerald-950/50 px-3.5 py-1.5 rounded-full border border-emerald-800/25">
              Healthcare Administration Panel
            </span>
            <h1 
              className="text-3xl md:text-4xl font-black tracking-normal leading-none max-w-lg mx-auto text-white glass-emboss-heading"
            >
              Optimalisasi Sistem Pelaporan Mutu RS
            </h1>
            <p 
              className="text-xs md:text-sm text-slate-200 max-w-md mx-auto leading-relaxed glass-emboss-desc"
            >
              Selamat datang di Enterprise portal akreditasi mutu terintegrasi. Klik tombol di bawah untuk masuk ke dashboard utama.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                localStorage.setItem("welcome_seen", "true");
                router.push("/");
              }}
              className="px-8 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 text-white font-black text-xs tracking-wider uppercase hover:bg-white/20 hover:border-emerald-450 active:scale-95 transition-all duration-300 flex items-center gap-3.5 mx-auto cursor-pointer shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
            >
              <span>BUKA DASHBOARD</span>
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                <ArrowRight size={14} className="stroke-[3]" />
              </motion.div>
            </button>
          </div>

        </div>
      </main>

      {/* FOOTER METRICS INFO BAR */}
      <footer className="relative z-10 w-full px-6 py-6 border-t border-white/5 bg-slate-950/20 text-center flex flex-col md:flex-row md:justify-between items-center gap-4 text-[11px] text-slate-450 md:px-12 font-semibold">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Accreditation Standards HIPAA Compliant</span>
        </div>
        <div>
          <span>© 2026 UOBK RSUD AL-MULK KOTA SUKABUMI. All Rights Reserved.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-slate-500" />
          <span>Sukabumi, Jawa Barat</span>
        </div>
      </footer>

    </div>
  );
}
