import projectsData from "./projects.json";

export interface PlatformLink {
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
  description?: {
    en: string;
    cs: string;
  };
}

export const projects: Project[] = projectsData;
