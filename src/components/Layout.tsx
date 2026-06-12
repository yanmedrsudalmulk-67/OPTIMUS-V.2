import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useStore } from "@/store/useStore";
import { Hospital, Calendar, Clock } from "lucide-react";
import { motion } from "motion/react";
import type { NextRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
  router?: NextRouter;
}

export default function Layout({ children, router }: LayoutProps) {
  const hospitalLogo = useStore((state) => state.hospitalLogo);

  // High-precision clock & Indonesian calendar state
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");
  const [tickToggle, setTickToggle] = useState<boolean>(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Formatting time to HH:mm:ss
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTimeString(`${hh}:${mm}:${ss}`);

      // Formatting date in Indonesian locale (e.g. Kamis, 28 Mei 2026)
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      };
      setDateString(now.toLocaleDateString("id-ID", options));
      setTickToggle((prev) => !prev);
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Safely check router to avoid SSG not-mounted errors
  const isWelcomePage = router?.pathname === "/";

  if (isWelcomePage) {
    return (
      <div id="welcome-fullscreen-layout" className="min-h-screen bg-slate-950 text-white overflow-hidden animate-in fade-in duration-500">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 pb-24 md:pb-0">
      {/* Nav Sidebar component handles both desktop and mobile bottom bar */}
      <Sidebar />

      {/* Content flex alignment container */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-64 w-full min-w-0">
        {/* PREMIUM UNIFIED GLASSMORPHISM TOP HEADER */}
        <header className="fixed top-0 left-0 right-0 md:left-64 z-30 flex items-center justify-between min-h-20 md:h-[88px] py-4 md:py-2 px-4 md:px-8 bg-white/75 backdrop-blur-lg border-b border-gray-100/80 shadow-xs w-full md:w-auto">
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 shadow-[0_2px_15px_rgba(16,163,127,0.8)] z-40" />
          {/* Left Side: Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col pt-6 md:pt-0">
              <span 
                className="font-black tracking-[0.1em] drop-shadow-sm select-none antialiased leading-none"
                style={{ 
                  fontVariantLigatures: "common-ligatures", 
                  WebkitFontSmoothing: "antialiased",
                  color: "#10a37f",
                  fontStyle: "italic",
                  fontSize: "40px",
                  display: "inline-block",
                  textDecorationLine: "none",
                  marginBottom: "-6px",
                  marginTop: "-12px",
                  height: "40px",
                  paddingBottom: "0px",
                  paddingLeft: "0px",
                  paddingRight: "0px",
                  paddingTop: "0px",
                  marginRight: "0px",
                  marginLeft: "0px",
                  width: "250.891px"
                }}
              >
                OPTIMUS
              </span>
              <span 
                className="text-[9px] sm:text-[10px] font-semibold tracking-[0.15em] text-slate-500 uppercase block whitespace-nowrap"
                style={{ marginBottom: "0px", marginTop: "6px", fontWeight: "bold" }}
              >
                Optimalisasi Sistem Pelaporan Mutu Rumah Sakit
              </span>
            </div>
          </div>

          {/* Right Side: High-Precision Calendar & Clock Widget */}
          <div className="flex items-center">
            {timeString && (
              <motion.div
                key={timeString}
                animate={{
                  y: tickToggle ? [-0.2, 0.2, 0] : [0.2, -0.2, 0],
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex items-center bg-white/40 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-2 text-xs font-bold text-gray-700 shadow-[0_8px_32px_0_rgba(16,163,127,0.05)] select-none hover:shadow-[0_8px_24px_rgba(16,163,127,0.08)] transition-all duration-300 gap-2"
              >
                {dateString && (
                  <span className="hidden sm:inline text-gray-600 text-[11px] md:text-xs font-semibold">
                    {dateString}
                  </span>
                )}
                {dateString && <span className="hidden sm:inline text-emerald-400/80 font-semibold font-mono">•</span>}
                <span className="font-mono tracking-tight text-emerald-600 text-xs md:text-sm font-black">
                  {timeString}
                </span>
              </motion.div>
            )}
          </div>
        </header>

        {/* Primary Page views main insertion wrapper */}
        <main className="flex-1 w-full p-4 md:p-8 pt-28 md:pt-[112px]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
