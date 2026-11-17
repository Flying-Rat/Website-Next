import type { Language } from '../i18n';
import { tieShortWords } from '../utils/czechTypography';
import projectsData from './projects.json';

interface PlatformLink {
  name: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  studio: string;
  platforms: PlatformLink[];
  image: string;
  isInternal?: boolean;
  achievement: Record<Language, string>;
  description: Record<Language, string>;
}

export const projects: Project[] = projectsData.map((project) => ({
  ...project,
  achievement: { ...project.achievement, cs: tieShortWords(project.achievement.cs) },
  description: { ...project.description, cs: tieShortWords(project.description.cs) },
}));
