import projectsData from "./projects.json";

interface PlatformLink {
  name: string;
  url: string;
}

interface Project {
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
