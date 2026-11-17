import { projects } from '../data/projects';
import { jobSections } from '../jobs/jobSections';
import { absoluteUrl, CONTACT_EMAILS, SITE_NAME, SOCIAL_PROFILES } from '../lib/site';
import en from '../locales/en.json';

// Built once with the site: everything below comes from the same copy and data
// the pages render, so this file cannot drift from them.
export const dynamic = 'force-static';

const bullet = (name: string, text: string) => `- **${name}**: ${text}`;

function buildLlmsTxt(): string {
  const { factSheet, about } = en.pressKit;
  const openRoles = jobSections
    .filter((section) => section.id !== 'previously')
    .flatMap((section) => section.positions)
    .map(({ key }) => en.jobs.positions[key as keyof typeof en.jobs.positions].title);

  return [
    `# ${SITE_NAME}`,
    `> ${about.boilerplate}`,
    [
      bullet('Based in', `Prague, Czech Republic (${factSheet.hqValue})`),
      bullet('Founded', factSheet.foundedValue),
      bullet('Team', factSheet.teamSizeValue),
      bullet('Legal entity', factSheet.legalEntityName),
      bullet('Languages', 'English and Czech; every page has a language switch'),
    ].join('\n'),

    '## What we do',
    Object.values(en.whatWeDo)
      .flatMap((item) => (typeof item === 'string' ? [] : [bullet(item.title, item.body)]))
      .join('\n'),

    '## How we work with a client',
    Object.values(en.howWeWork.models)
      .map((model) => bullet(model.label, `${model.title} ${model.body}`))
      .join('\n'),

    '## How we use AI',
    en.aiPolicy.subtitle,
    Object.values(en.aiPolicy.principles)
      .map((principle) => bullet(principle.title, principle.body))
      .join('\n'),

    '## Games we have worked on',
    projects
      .map(({ title, studio, achievement, platforms }) => {
        const name = platforms[0] ? `[${title}](${platforms[0].url})` : title;
        return `- ${name} (${studio}): ${achievement.en}`;
      })
      .join('\n'),

    '## Pages',
    [
      `- [Home](${absoluteUrl('/')}): what the studio does, how it works with clients, and its projects`,
      `- [Jobs](${absoluteUrl('/jobs')}): open roles (${openRoles.join(', ')}) and the hiring process`,
      `- [Press kit](${absoluteUrl('/press')}): logos, brand colours, fact sheet and boilerplate`,
      `- [Privacy policy for our games](${absoluteUrl('/games/privacy-policy')})`,
      `- [Credits](${absoluteUrl('/credits')}): the software and services this site is built on`,
      `- [Tech blog](${SOCIAL_PROFILES.blog})`,
    ].join('\n'),

    '## Contact',
    [
      bullet('New projects', CONTACT_EMAILS.projects),
      bullet('Jobs', CONTACT_EMAILS.jobs),
      bullet('Press', CONTACT_EMAILS.press),
      bullet('Anything else', CONTACT_EMAILS.general),
    ].join('\n'),
  ].join('\n\n');
}

export function GET() {
  return new Response(`${buildLlmsTxt()}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
