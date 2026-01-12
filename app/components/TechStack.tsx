"use client";

import { useTranslation } from "../i18n";

const technologies = [
  "C/C++",
  "C#",
  "Rust",
  "Zig",
  "Odin",
  "Go",
  "Python",
  "Lua",
  "TypeScript",
  "JavaScript",
  "Swift",
  "Kotlin",
  "HLSL",
  "GLSL",
  "Vulkan",
  "DirectX",
  "Metal",
  "Unreal",
  "Unity",
  "Godot",
  "Babylon.js",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "Git",
  "Perforce",
  "SVN",
  "Unity VCS",
  "Blender",
  "Maya",
  "Houdini",
];

export function TechStack() {
  const { t } = useTranslation();

  return (
    <div className="py-10 md:py-12">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.35em] text-[var(--color-text-subtle)]">
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-text)]/20 to-transparent" />
          <span>{t("techStack.title")}</span>
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--color-text)]/20 to-transparent" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs md:text-sm text-[var(--color-text-muted)] max-w-4xl mx-auto">
          {technologies.map((tech, index) => (
            <span key={tech} className="flex items-center gap-4">
              <span className="hover:text-[var(--color-text)] transition-colors">{tech}</span>
              {index < technologies.length - 1 && (
                <span className="text-[var(--color-text-subtle)]/50">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
