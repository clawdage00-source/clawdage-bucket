"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const HERO_LOGO_SRC = "/Group%201000001054.png";

const easeOut = [0.16, 1, 0.3, 1] as const;

const HERO_GRID_CELL_PX = 80;

const HERO_DOT_GRID_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${HERO_GRID_CELL_PX}" height="${HERO_GRID_CELL_PX}" viewBox="0 0 ${HERO_GRID_CELL_PX} ${HERO_GRID_CELL_PX}">
    <path d="M ${HERO_GRID_CELL_PX} 0 L 0 0 0 ${HERO_GRID_CELL_PX}" fill="none" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4 10" stroke-linecap="round"/>
  </svg>`,
);

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-white"
        style={{
          backgroundImage: `url("data:image/svg+xml,${HERO_DOT_GRID_SVG}")`,
          backgroundSize: `${HERO_GRID_CELL_PX}px ${HERO_GRID_CELL_PX}px`,
        }}
      />
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
          className="h-auto w-[min(118vw,36rem)] max-h-[min(72vh,28rem)] object-contain sm:w-[44rem] sm:max-h-[min(78vh,32rem)] md:w-[52rem] md:max-h-[min(82vh,36rem)] lg:w-[min(94vw,60rem)] lg:max-h-[min(85vh,40rem)]"
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
            className="pointer-events-none relative z-10 block h-auto max-h-[58vh] w-[min(92vw,22rem)] object-contain object-bottom sm:max-h-[62vh] sm:w-[26rem] md:max-h-[68vh] md:w-[32rem] lg:max-h-[72vh] lg:w-[36rem]"
          />
        </motion.div>
      </div>
    </section>
  );
}
