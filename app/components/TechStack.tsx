'use client';

import { useTranslation } from '../i18n';

const technologies = [
  'C/C++',
  'C#',
  'Rust',
  'Zig',
  'Odin',
  'Go',
  'Python',
  'Lua',
  'TypeScript',
  'JavaScript',
  'Swift',
  'Kotlin',
  'HLSL',
  'GLSL',
  'Vulkan',
  'DirectX',
  'Metal',
  'Unreal',
  'Unity',
  'Godot',
  'Babylon.js',
  'React',
  'Next.js',
  'Node.js',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'AWS',
  'Azure',
  'Docker',
  'Kubernetes',
  'Git',
  'Perforce',
  'SVN',
  'Unity VCS',
  'Blender',
  'Maya',
  'Houdini',
];

export function TechStack() {
  const { t } = useTranslation();

  return (
    <div className="border-y border-line">
      <div className="container grid gap-4 py-8 md:grid-cols-12 md:gap-8 md:py-10">
        <h2 className="eyebrow md:col-span-2 md:pt-0.5">{t('techStack.title')}</h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-meta text-muted md:col-span-10">
          {technologies.map((tech) => (
            <li key={tech} className="transition-colors hover:text-ink">
              {tech}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
