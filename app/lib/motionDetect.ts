const PRIVACY_BROWSER_UA = /LibreWolf|Mullvad/i;

export function isPrivacyBrowser(userAgent: string) {
  return PRIVACY_BROWSER_UA.test(userAgent);
}
