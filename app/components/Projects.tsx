"use client";

import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { memo, useCallback, useState } from "react";
import { projects } from "../data/projects";
import { useAnimationsEnabled } from "../hooks/useAnimationsEnabled";
import { useTranslation } from "../i18n";
import { PlatformIcon } from "./icons";
import { M } from "./Motion";

export const Projects = () => {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const currentLang = (i18n.language === "cs" ? "cs" : "en") as "en" | "cs";
  const shouldAnimate = useAnimationsEnabled();

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section id="projects" className="py-16 md:py-32 bg-[var(--color-surface)] relative">
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full pattern-dots" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <M.div
            className="text-center mb-10 md:mb-16"
            initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
            animate={!shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, margin: "-100px" }}
            transition={
              shouldAnimate ? { duration: 0.7, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }
            }
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {t("projects.title")}
            </h2>
            <p className="text-[var(--color-text-muted)] text-base md:text-lg max-w-2xl mx-auto">
              {t("projects.subtitle")}
            </p>
          </M.div>

          <M.div
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
            layout={shouldAnimate ? true : undefined}
          >
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                isExpanded={expandedId === project.id}
                onToggle={toggleExpand}
                t={t}
                currentLang={currentLang}
                shouldAnimate={shouldAnimate}
              />
            ))}
          </M.div>
        </div>
      </div>
    </section>
  );
};

interface ProjectCardProps {
  project: (typeof projects)[0];
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  t: (key: string) => string;
  currentLang: "en" | "cs";
  shouldAnimate: boolean;
}

const ProjectCard = memo(function ProjectCard({
  project,
  index,
  isExpanded,
  onToggle,
  t,
  currentLang,
  shouldAnimate,
}: ProjectCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(project.id);
    }
  };

  return (
    <M.div
      layout={shouldAnimate ? true : undefined}
      className="project-card bg-[var(--color-surface)] rounded-xl sm:rounded-2xl overflow-hidden group border border-[var(--color-border)] cursor-pointer"
      initial={shouldAnimate ? { opacity: 0, y: 40, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
      animate={!shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      viewport={{ once: true, margin: "-30px" }}
      transition={
        shouldAnimate
          ? { duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }
          : { duration: 0 }
      }
      onClick={() => onToggle(project.id)}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={handleKeyDown}
    >
      <div className="aspect-video bg-[var(--color-surface-light)] relative overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 will-change-transform">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">🧀</span>
                <p className="text-xs text-[var(--color-text-subtle)] mt-2">
                  {t("projects.comingSoon")}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-light)]/80 to-transparent pointer-events-none" />

        {project.isInternal && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-accent text-[10px] sm:text-xs font-semibold rounded">
            {t("projects.internal")}
          </div>
        )}
      </div>

      <M.div className="p-3 sm:p-5" layout={shouldAnimate ? "position" : undefined}>
        <div className="flex items-start justify-between gap-1 sm:gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1 group-hover:text-accent transition-colors truncate">
              {project.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-subtle)] mb-2 sm:mb-3 truncate">
              {project.studio}
            </p>
          </div>
          <M.div
            className="mt-0.5 sm:mt-1 text-[var(--color-text-muted)] shrink-0"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={shouldAnimate ? { duration: 0.2 } : { duration: 0 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>External Link</title>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </M.div>
        </div>

        <fieldset
          className="flex flex-wrap gap-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label="Platforms"
        >
          {project.platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-badge"
              title={`${project.title} on ${platform.name}`}
            >
              <PlatformIcon name={platform.name} /> {platform.name}
            </a>
          ))}
          {project.isInternal && project.platforms.length === 0 && (
            <span className="platform-badge">🔜 {t("projects.tba")}</span>
          )}
        </fieldset>

        <AnimatePresence>
          {isExpanded && project.description && (
            <M.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={
                shouldAnimate
                  ? { type: "spring", stiffness: 200, damping: 24, mass: 0.8 }
                  : { duration: 0 }
              }
              className="overflow-hidden"
            >
              <p className="text-sm text-[var(--color-text-muted)] mt-4 pt-4 border-t border-[var(--color-border)]">
                {project.description[currentLang]}
              </p>
            </M.div>
          )}
        </AnimatePresence>
      </M.div>
    </M.div>
  );
});
