"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImagesBadgeProps {
  /** Omit to show folder only (no label below) */
  text?: string;
  images: string[];
  className?: string;
  textClassName?: string;
  /** Optional link URL */
  href?: string;
  /** Link target attribute (e.g., "_blank" for new tab) */
  target?: string;
  /** Show icons only (no card background on pop-out images) */
  bareImages?: boolean;
  /** Folder dimensions { width, height } in pixels */
  folderSize?: { width: number; height: number };
  /** Image dimensions when teased (peeking) { width, height } in pixels */
  teaserImageSize?: { width: number; height: number };
  /** Image dimensions when hovered { width, height } in pixels */
  hoverImageSize?: { width: number; height: number };
  /** How far images translate up on hover in pixels */
  hoverTranslateY?: number;
  /** How far images spread horizontally on hover in pixels */
  hoverSpread?: number;
  /** Rotation angle for fanned images on hover in degrees */
  hoverRotation?: number;
  /** Max images shown in the folder (omit to show all) */
  maxImages?: number;
}

function fanOffset(index: number, total: number): number {
  if (total <= 1) return 0;
  return index - (total - 1) / 2;
}

function getFanScale(total: number): number {
  if (total <= 3) return 1;
  if (total <= 5) return 0.85;
  if (total <= 7) return 0.72;
  if (total <= 9) return 0.55;
  if (total <= 11) return 0.45;
  return 0.36;
}

export function ImagesBadge({
  text,
  images,
  className,
  textClassName,
  href,
  target,
  bareImages = false,
  folderSize = { width: 32, height: 24 },
  teaserImageSize = { width: 20, height: 14 },
  hoverImageSize = { width: 48, height: 32 },
  hoverTranslateY = -35,
  hoverSpread = 20,
  hoverRotation = 15,
  maxImages,
}: ImagesBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayImages =
    maxImages != null ? images.slice(0, maxImages) : images;

  const tabWidth = folderSize.width * 0.375;
  const tabHeight = folderSize.height * 0.25;

  const rootClassName = cn(
    "inline-flex cursor-pointer flex-col items-center perspective-[1000px] transform-3d",
    className,
  );

  const iconFanPadding =
    Math.abs(hoverTranslateY) + Math.max(hoverImageSize.height, teaserImageSize.height) * 0.45;

  const content = (
    <>
      <div
        className="flex items-end justify-center"
        style={{
          paddingTop: iconFanPadding,
          minHeight: folderSize.height + iconFanPadding,
        }}
      >
        <motion.div
          className="relative"
          style={{
            width: folderSize.width,
            height: folderSize.height,
            transformStyle: "preserve-3d",
          }}
        >
        <motion.div
          className="absolute inset-0 rounded-md bg-gradient-to-b from-amber-400 to-amber-500 shadow-md dark:from-amber-500 dark:to-amber-600"
          style={{ borderRadius: Math.max(6, folderSize.width * 0.08) }}
        >
          <div
            className="absolute left-1 rounded-t-sm bg-gradient-to-b from-amber-300 to-amber-400 dark:from-amber-400 dark:to-amber-500"
            style={{
              top: -tabHeight * 0.65,
              width: tabWidth,
              height: tabHeight,
            }}
          />
        </motion.div>

        {displayImages.map((image, index) => {
          const totalImages = displayImages.length;
          const offset = fanOffset(index, totalImages);
          const fanScale = getFanScale(totalImages);

          const baseRotation = offset * hoverRotation * fanScale;
          const hoverY =
            hoverTranslateY - (totalImages - 1 - index) * (totalImages > 5 ? 3 : 4);
          const hoverX = offset * hoverSpread * fanScale;
          const teaseY = -6 - (totalImages - 1 - index) * (totalImages > 5 ? 1.5 : 2);
          const teaseRotation = offset * 3 * fanScale;

          return (
            <motion.div
              key={image}
              className={cn(
                "absolute top-1 left-1/2 origin-bottom",
                bareImages
                  ? "overflow-visible bg-transparent shadow-none ring-0"
                  : "overflow-hidden rounded-[3px] bg-white shadow-sm ring-1 shadow-black/10 ring-black/10 dark:bg-neutral-800 dark:shadow-white/10 dark:ring-white/10",
              )}
              animate={{
                x: `calc(-50% + ${isHovered ? hoverX : 0}px)`,
                y: isHovered ? hoverY : teaseY,
                rotate: isHovered ? baseRotation : teaseRotation,
                width: isHovered ? hoverImageSize.width : teaserImageSize.width,
                height: isHovered
                  ? hoverImageSize.height
                  : teaserImageSize.height,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.03,
              }}
              style={{
                zIndex: 10 + index,
              }}
            >
              <img
                src={image}
                alt={`Preview ${index + 1}`}
                className={cn(
                  "h-full w-full object-contain",
                  bareImages ? "bg-transparent" : "p-0.5",
                )}
              />
            </motion.div>
          );
        })}

        <motion.div
          className="absolute inset-x-0 bottom-0 h-[85%] origin-bottom rounded-md bg-gradient-to-b from-amber-300 to-amber-400 shadow-md dark:from-amber-400 dark:to-amber-500"
          style={{
            borderRadius: Math.max(6, folderSize.width * 0.08),
            transformStyle: "preserve-3d",
            zIndex: 20,
          }}
          animate={{
            rotateX: isHovered ? -45 : -25,
            scaleY: isHovered ? 0.8 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <div className="absolute top-1.5 right-1.5 left-1.5 h-px bg-amber-200/50 dark:bg-amber-300/50" />
        </motion.div>
        </motion.div>
      </div>

      {text ? (
        <span
          className={cn(
            "mt-8 max-w-2xl text-center text-xl font-semibold leading-snug tracking-tight text-neutral-900 sm:text-2xl md:text-[1.75rem] lg:text-3xl",
            textClassName,
          )}
        >
          {text}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={rootClassName}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={rootClassName}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </div>
  );
}
