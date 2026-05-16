"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import { HeroGridBeams } from "@/components/ui/background-beams";

const HERO_LOGO_SRC = "/Group%201000001054.png";

const easeOut = [0.16, 1, 0.3, 1] as const;

const HERO_GRID_CELL_PX = 80;

export function Hero() {
  const reduceMotion = useReducedMotion();

  const logoTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.65, ease: easeOut };

  const mascotTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.9, delay: 0.55, ease: easeOut };

  return (
    <section className="relative -mt-14 min-h-[100vh] w-full overflow-x-hidden bg-white">
      <HeroGridBeams cellSize={HERO_GRID_CELL_PX} className="z-0" />
      <motion.div
        className="pointer-events-none absolute top-1/2 left-1/2 z-[2] -translate-x-1/2 -translate-y-1/2"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={logoTransition}
      >
        <Image
          src={HERO_LOGO_SRC}
          alt=""
          width={663}
          height={473}
          priority
          aria-hidden
          className="h-auto w-auto object-contain max-sm:w-[min(175vw,52rem)] max-sm:max-h-[min(95vh,48rem)] sm:w-[44rem] sm:max-h-[min(78vh,32rem)] md:w-[52rem] md:max-h-[min(82vh,36rem)] lg:w-[min(94vw,60rem)] lg:max-h-[min(85vh,40rem)]"
        />
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-10 overflow-hidden">
        <motion.div
          className="flex justify-center px-4"
          initial={reduceMotion ? false : { y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={mascotTransition}
        >
          <Image
            src="/image.png"
            alt="Clawdage mascot"
            width={613}
            height={971}
            priority
            className="pointer-events-none relative z-10 block h-auto max-sm:max-h-[44vh] max-sm:w-[min(78vw,15rem)] object-contain object-bottom sm:max-h-[62vh] sm:w-[26rem] md:max-h-[68vh] md:w-[32rem] lg:max-h-[72vh] lg:w-[36rem]"
          />
        </motion.div>
      </div>
    </section>
  );
}
