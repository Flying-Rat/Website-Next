"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { memo, useCallback, useState } from "react";
import { projects } from "../data/projects";
import { useTranslation } from "../i18n";
import { PlatformIcon } from "./icons";

export const Projects = () => {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const currentLang = (i18n.language === "cs" ? "cs" : "en") as "en" | "cs";

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section id="projects" className="py-24 md:py-32 bg-[var(--color-surface)] relative">
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full pattern-dots" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("projects.title")}
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              {t("projects.subtitle")}
            </p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" layout>
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                isExpanded={expandedId === project.id}
                onToggle={toggleExpand}
                t={t}
                currentLang={currentLang}
              />
            ))}
          </motion.div>
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
}

const ProjectCard = memo(
  ({ project, index, isExpanded, onToggle, t, currentLang }: ProjectCardProps) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle(project.id);
      }
    };

    return (
      <motion.div
        layout
        className="project-card bg-[var(--color-surface)] rounded-2xl overflow-hidden group border border-[var(--color-border)] cursor-pointer"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
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
            <div className="absolute top-3 right-3 px-2 py-1 bg-accent text-xs font-semibold rounded">
              {t("projects.internal")}
            </div>
          )}
        </div>

        <motion.div className="p-5" layout="position">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold mb-1 group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-[var(--color-text-subtle)] mb-3">{project.studio}</p>
            </div>
            <motion.div
              className="mt-1 text-[var(--color-text-muted)]"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
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
            </motion.div>
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
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-[var(--color-text-muted)] mt-4 pt-4 border-t border-[var(--color-border)]">
                  {project.description[currentLang]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  },
);
