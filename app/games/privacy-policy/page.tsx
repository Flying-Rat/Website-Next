import type { Metadata } from 'next';

import { pageMetadata } from '../../lib/seo';
import { PrivacyPolicyClient } from './PrivacyPolicyClient';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy | Flying Rat Studio',
  description: "Read Flying Rat Studio's privacy policy for games on PC and console platforms.",
  path: '/games/privacy-policy',
  keywords: [
    'Flying Rat Studio',
    'privacy policy',
    'game privacy',
    'telemetry',
    'analytics',
    'GDPR',
  ],
});

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
