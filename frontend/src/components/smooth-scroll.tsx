"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll halaman memakai Lenis, disinkronkan dengan ScrollTrigger GSAP
 * (satu sumber RAF lewat gsap.ticker supaya posisi scroll tidak bentrok).
 * Tidak aktif kalau user memilih reduced motion, dan dibersihkan saat unmount.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 0.8 });
    lenis.on("scroll", ScrollTrigger.update);

    /*
      Lenis mengukur batas scroll sekali saat init dan hanya menghitung ulang
      kalau window di-resize atau kotak <html> berubah. Karena <html> dipaku
      setinggi viewport (`h-full`), konten yang tumbuh belakangan — kartu hasil
      seleksi, gambar landing, daftar divisi — tidak pernah memicu hitung ulang.
      Akibatnya roda mouse berhenti di batas lama, sementara tombol panah tetap
      bisa karena scroll bawaan browser tidak lewat Lenis. Yang tingginya ikut
      bertambah adalah <body>, jadi pertumbuhannya dipantau dari sini.
    */
    const observer = new ResizeObserver(() => lenis.resize());
    observer.observe(document.body);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
