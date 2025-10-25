"use client";

import { motion } from "framer-motion";
import { couple } from "@/lib/profile";

export function HeroSection() {
  return (
    <section className="hero">
      <motion.p
        className="hero-prelude"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        {couple.names}
      </motion.p>
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.35 }}
      >
        {couple.headline}
      </motion.h1>
      <motion.p
        className="hero-text"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        {couple.subheading}
      </motion.p>
    </section>
  );
}
