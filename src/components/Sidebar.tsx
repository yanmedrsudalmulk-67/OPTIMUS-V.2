import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  ClipboardList,
  FileEdit,
  BarChart2,
  FileText,
  AlertTriangle,
  Shield,
  Activity,
  Settings,
  Hospital,
  User,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const hospitalLogo = useStore((state) => state.hospitalLogo);
  const setHospitalLogo = useStore((state) => state.setHospitalLogo);

  const [currentPath, setCurrentPath] = useState("");

  // Safely capture path on the client side to avoid NextRouter prerendering warnings
  useEffect(() => {
    setTimeout(() => {
      setCurrentPath(window.location.pathname);
    }, 0);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Profil Indikator", path: "/profil-indikator", icon: ClipboardList },
    { name: "Input Data", path: "/input", icon: FileEdit },
    { name: "Grafik Capaian", path: "/grafik", icon: BarChart2 },
    { name: "Laporan Mutu", path: "/laporan", icon: FileText },
    { name: "Insiden Pasien (IKP)", path: "/ikp", icon: AlertTriangle },
    { name: "Manajemen Risiko", path: "/risiko", icon: Shield },
    { name: "Survei Budaya", path: "/survei", icon: Activity },
    { name: "Pengaturan", path: "/pengaturan", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="main-sidebar"
        className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-[#007A4D] to-[#005F3A] text-white flex-col justify-between border-r border-[#005F3A]/50 shadow-[4px_0_24px_rgba(0,122,77,0.15)] transition-transform font-sans"
      >
        {/* Header & Logo */}
        <div className="p-4 pt-3 mt-2 flex flex-col items-center border-b border-[#005F3A]/30 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-white border border-emerald-500/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg p-0.5">
                {hospitalLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hospitalLogo}
                    alt="Logo RS"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Hospital className="text-emerald-600 h-6 w-6" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight truncate">
                  UOBK RSUD AL-MULK
                </span>
                <span 
                  className="leading-none mt-1"
                  style={{ color: "#ded92d", fontWeight: "bold", fontSize: "12px" }}
                >
                  Kota Sukabumi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setCurrentPath(item.path)}
                className={`group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-200 ease-in-out border overflow-hidden ${
                  isActive
                    ? "bg-white/10 text-[#ded92d] shadow-[0_0_15px_rgba(222,217,45,0.15)] font-bold border-white/5 backdrop-blur-md"
                    : "text-emerald-50/80 hover:text-white hover:bg-white/5 border-transparent"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-md bg-gradient-to-b from-[#ded92d] to-[#f59e0b] shadow-[0_0_14px_rgba(222,217,45,1)]"></div>
                )}
                <motion.div
                  animate={isActive ? { y: [0, -3, 0] } : { y: 0 }}
                  transition={
                    isActive
                      ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                      : undefined
                  }
                  className="flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:opacity-100 opacity-90"
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-[#ded92d] drop-shadow-[0_0_4px_rgba(222,217,45,0.4)]" : "text-white"}`}
                    strokeWidth={2.2}
                  />
                </motion.div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Information Profile Footer */}
        <div className="p-4 border-t border-[#005F3A]/40 bg-black/10 backdrop-blur-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/10 shadow-sm">
              <User className="h-5 w-5 text-emerald-50" />
            </div>
            <div className="flex flex-col min-w-0">
              <span 
                className="text-xs font-bold text-white truncate font-sans tracking-wide"
                style={{ color: "#ded92d" }}
              >
                Pengguna
              </span>
              <span className="text-[10px] text-emerald-100/80 font-medium">Tim Mutu RS</span>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Link
              href="/"
              onClick={(e) => {
                localStorage.removeItem("welcome_seen");
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 active:bg-white/5 border border-white/10 hover:border-white/20 text-white text-xs font-bold rounded-[14px] shadow-sm transition-all duration-200 cursor-pointer select-none"
            >
              <LogOut className="h-3.5 w-3.5" style={{ color: "#ded92d" }} />
              <span style={{ color: "#ded92d" }}>Keluar</span>
            </Link>
          </motion.div>
        </div>
      </aside>

      {/* Mobile Bottom Horizontal Slider Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#007A4D] border-t border-[#005F3A]/50 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] pb-safe">
        <div className="flex items-center overflow-x-auto px-2 py-2 gap-1.5 scrollbar-hide snap-x">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setCurrentPath(item.path)}
                className={`group snap-center shrink-0 flex flex-col items-center justify-center min-w-[76px] px-2 py-2 rounded-xl transition-all ${
                  isActive
                    ? "text-[#ded92d] bg-white/10 shadow-[0_0_12px_rgba(222,217,45,0.15)]"
                    : "text-emerald-50/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <motion.div
                  animate={isActive ? { y: [0, -3, 0] } : { y: 0 }}
                  transition={
                    isActive
                      ? {
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut",
                        }
                      : undefined
                  }
                  className={`flex items-center justify-center mb-1 transition-transform group-hover:-translate-y-0.5 ${isActive ? "scale-110 opacity-100" : "scale-100 opacity-90 group-hover:opacity-100"}`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-[#ded92d]" : "text-white"}`} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] text-center leading-tight ${isActive ? "font-bold text-[#ded92d]" : "font-semibold"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Mobile Logout Button with Premium Hospital Blue Gradient Capsule styling */}
          <div className="snap-center shrink-0 flex items-center justify-center px-1.5 min-w-[90px]">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-full"
            >
              <Link
                href="/"
                onClick={(e) => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("welcome_seen");
                  }
                }}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[11px] font-bold rounded-[14px] shadow-sm cursor-pointer whitespace-nowrap select-none transition-all"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Keluar</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>
    </>
  );
}
