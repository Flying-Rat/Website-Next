interface IconProps {
  className?: string;
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Light Mode</title>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Dark Mode</title>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>External Link</title>
      <path d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}

export function EngineeringIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 6a2 2 0 0 1 2-2h4a1 1 0 1 1 0 2H6v12h4a1 1 0 1 1 0 2H6a2 2 0 0 1-2-2V6Zm10-2a1 1 0 1 1 0 2h4v12h-4a1 1 0 1 1 0 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4Zm-1.7 4.3a1 1 0 0 1 1.4 0l2.3 2.3a1 1 0 0 1 0 1.4l-2.3 2.3a1 1 0 1 1-1.4-1.4l.6-.6H11a1 1 0 1 1 0-2h1.9l-.6-.6a1 1 0 0 1 0-1.4Zm-4.6 0a1 1 0 0 1 0 1.4l-.6.6H9a1 1 0 1 1 0 2H7.1l.6.6a1 1 0 1 1-1.4 1.4L4 12a1 1 0 0 1 0-1.4l2.3-2.3a1 1 0 0 1 1.4 0Z"
      />
    </svg>
  );
}

export function PortingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 4C5.1 4 4 5.1 4 6.5v11c0 1.4 1.1 2.5 2.5 2.5h1.6c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1H6.5Zm8.2 0c-.6 0-1 .4-1 1v14c0 .6.4 1 1 1h2.6c1.5 0 2.7-1.2 2.7-2.7V6.7C20 5.2 18.8 4 17.3 4h-2.6Zm-2.8 2.4c-.5 0-.9.4-.9.9v9.4c0 .5.4.9.9.9s.9-.4.9-.9V7.3c0-.5-.4-.9-.9-.9Z"
      />
    </svg>
  );
}

export function QaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.5 4a6.5 6.5 0 1 0 3.9 11.7l3 3a1 1 0 0 0 1.4-1.4l-3-3A6.5 6.5 0 0 0 10.5 4Zm-4.5 6.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Zm6.7-1.7a1 1 0 0 1 0 1.4l-2.6 2.6a1 1 0 0 1-1.4 0l-1.4-1.4a1 1 0 1 1 1.4-1.4l.7.7 1.9-1.9a1 1 0 0 1 1.4 0Z"
      />
    </svg>
  );
}

export function ReleaseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6.6a2 2 0 0 0 1.4-.6l3-3a2 2 0 0 0 .6-1.4V5a2 2 0 0 0-2-2H7Zm0 2h9v11h-2a2 2 0 0 0-2 2v2H7V5Zm6.5 11H16l-2.5 2.5V16Zm-5.8-6.2a1 1 0 1 1 1.4-1.4l1.1 1.1 2.2-2.2a1 1 0 1 1 1.4 1.4l-2.9 2.9a1 1 0 0 1-1.4 0l-1.8-1.8Z"
      />
    </svg>
  );
}

export function BackendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.5 18a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.6 1.6A3.5 3.5 0 0 1 17.5 18H7.5Zm0-2h10a1.5 1.5 0 0 0 .1-3 1 1 0 0 1-.9-1 3.5 3.5 0 0 0-6.8-1.1 1 1 0 0 1-1.2.7 2.5 2.5 0 0 0-.2 5.4Z"
      />
    </svg>
  );
}

export function AiIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 4a4 4 0 0 0-4 4v2a3 3 0 0 0 1.5 2.6V15a3 3 0 0 0 3 3h1v2a1 1 0 1 0 2 0v-2h1a3 3 0 0 0 3-3v-2.4A3 3 0 0 0 18 10V8a4 4 0 0 0-4-4H9Zm0 2h5a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1h-1v4a1 1 0 0 1-1 1h-1v-4h-1v4h-1a1 1 0 0 1-1-1v-4H8a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2Zm1 4a1 1 0 1 0 0 2h.5a1 1 0 1 0 0-2H10Zm3.5 0a1 1 0 1 0 0 2H14a1 1 0 1 0 0-2h-.5Z"
      />
    </svg>
  );
}

export function DiscordIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <title>Discord</title>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <title>X</title>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <title>YouTube</title>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function TwitchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <title>Twitch</title>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <title>Instagram</title>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <title>Facebook</title>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Email</title>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function GitHubIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <title>GitHub</title>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function BlogIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Tech Blog</title>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h10a2.5 2.5 0 0 1 2.5 2.5v15" />
      <path d="M12 2v20" />
      <path d="M6.5 2H4v20h16v-2.5" />
      <path d="M16 2.5v2" />
    </svg>
  );
}

export const socialLinks = [
  { name: "GitHub", Icon: GitHubIcon, url: "https://github.com/Flying-Rat" },
  { name: "Tech Blog", Icon: BlogIcon, url: "https://tech.flying-rat.studio/" },
  { name: "Discord", Icon: DiscordIcon, url: "https://discord.gg/M66zD5FsMn" },
  { name: "Facebook", Icon: FacebookIcon, url: "https://www.facebook.com/FlyingRatStudio" },
  { name: "X", Icon: XIcon, url: "https://x.com/flyingratstudio" },
  {
    name: "YouTube",
    Icon: YouTubeIcon,
    url: "https://www.youtube.com/channel/UC00SEDeDnkKrvnfVtjUf7CQ/featured",
  },
  { name: "Twitch", Icon: TwitchIcon, url: "https://www.twitch.tv/flyingratstudio" },
  { name: "Instagram", Icon: InstagramIcon, url: "https://instagram.com/flyingrat.studio" },
];
