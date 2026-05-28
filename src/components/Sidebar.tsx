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
        className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 bg-emerald-600 text-white flex-col justify-between border-r border-emerald-700 transition-transform"
      >
        {/* Header & Logo */}
        <div className="p-5 flex flex-col items-center border-b border-emerald-500/30">
          <div className="flex items-center justify-between w-full mb-3">
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
                <span className="text-[11px] text-emerald-100 font-medium leading-none mt-1">
                  Kota Sukabumi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setCurrentPath(item.path)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-lg font-bold"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                <motion.div
                  animate={isActive ? { y: [0, -4, 0] } : { y: 0 }}
                  transition={
                    isActive
                      ? {
                          repeat: Infinity,
                          duration: 2.2,
                          ease: "easeInOut",
                        }
                      : undefined
                  }
                  whileHover={{ scale: 1.15 }}
                  className="flex items-center justify-center"
                >
                  <Icon
                    className="h-5 w-5 text-white"
                    strokeWidth={2.2}
                  />
                </motion.div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Information Profile Footer */}
        <div className="p-4 border-t border-emerald-500/30 bg-emerald-700/60 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-800/40 flex items-center justify-center border border-white/15">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate font-sans">Pengguna</span>
              <span className="text-[10px] text-emerald-100 font-medium">Tim Mutu RS</span>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="w-full"
          >
            <Link
              href="/"
              onClick={(e) => {
                localStorage.removeItem("welcome_seen");
              }}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:brightness-110 active:brightness-95 text-white text-xs font-bold rounded-full shadow-md transition-all cursor-pointer select-none"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </Link>
          </motion.div>
        </div>
      </aside>

      {/* Mobile Bottom Horizontal Slider Navigation */}
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-emerald-600 border-t border-emerald-700 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] pb-safe">
    <div className="flex items-center overflow-x-auto px-2 py-2 gap-1.5 scrollbar-hide snap-x">
      {menuItems.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setCurrentPath(item.path)}
            className={`snap-center shrink-0 flex flex-col items-center justify-center min-w-[76px] px-2 py-2 rounded-xl transition-all ${
              isActive
                ? "text-white drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)] bg-emerald-700/50"
                : "text-white/80 hover:bg-white/10 hover:text-white"
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
              className={`flex items-center justify-center mb-1 transition-transform ${isActive ? "scale-110" : "scale-100"}`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            </motion.div>
            <span className={`text-[10px] text-center leading-tight ${isActive ? "font-bold" : "font-semibold"}`}>
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
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-650 text-white text-[11px] font-bold rounded-full shadow-sm cursor-pointer whitespace-nowrap select-none"
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
