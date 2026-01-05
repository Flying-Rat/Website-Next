const LIBREWOLF_UA = /LibreWolf/i;

export function isPrivacyBrowser(userAgent: string) {
  return LIBREWOLF_UA.test(userAgent);
}
