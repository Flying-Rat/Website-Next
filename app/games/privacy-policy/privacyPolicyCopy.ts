import type { Language } from '../../i18n';
import { tieShortWordsDeep } from '../../utils/czechTypography';

export type PolicyBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'details'; rows: { label: string; value: string; href?: string }[] }
  | { type: 'links'; items: { label: string; href: string }[] };

export type PolicySection = {
  id: string;
  title: string;
  /** Short label for the page header; sections without one only appear in the contents list. */
  nav?: string;
  blocks: PolicyBlock[];
};

export type PolicyCopy = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  published: string;
  contentsLabel: string;
  sections: PolicySection[];
};

const PRIVACY_EMAIL = 'marty+privacy@flying-rat.studio';
const PRIVACY_MAILTO = `mailto:${PRIVACY_EMAIL}`;
const WEBSITE_URL = 'https://www.flying-rat.studio';
const AUTHORITY_URL = 'https://uoou.gov.cz';

const platformPolicies = {
  steam: 'https://store.steampowered.com/privacy_agreement/',
  playstation: 'https://www.playstation.com/en-us/legal/privacy-policy/',
  xbox: 'https://privacy.microsoft.com/',
  nintendo: 'https://www.nintendo.com/us/privacy-policy/',
};

export const privacyPolicyCopy: Record<Language, PolicyCopy> = {
  en: {
    eyebrow: 'Flying Rat Studio',
    title: 'Privacy Policy',
    description:
      'How Flying Rat Studio handles information when you play our games on PC and consoles.',
    updated: 'Last updated November 2026',
    published: 'First published March 2025',
    contentsLabel: 'Contents',
    sections: [
      {
        id: 'who-we-are',
        title: 'Who we are',
        nav: 'Who we are',
        blocks: [
          {
            type: 'p',
            text: 'Flying Rat Studio ("we", "us", "our") is an independent video game developer and publisher. This policy explains what information we collect when you play our games on PC and console platforms, why we collect it, and what rights you have.',
          },
          {
            type: 'p',
            text: 'It applies to the games we publish ourselves. Games we work on for other studios and publishers are covered by those companies’ own privacy policies.',
          },
          {
            type: 'p',
            text: 'Flying Rat Studio is operated by the company below, which is the data controller for the processing described in this policy.',
          },
          {
            type: 'details',
            rows: [
              { label: 'Controller', value: 'GADEN ALPHA s.r.o.' },
              { label: 'Company ID (IČO)', value: '09949194' },
              {
                label: 'Registered office',
                value: 'Polní 21, 252 64 Velké Přílepy, Czech Republic',
              },
              {
                label: 'Registration',
                value: 'Commercial Register kept by the Municipal Court in Prague, file C 345227',
              },
              { label: 'Privacy contact', value: PRIVACY_EMAIL, href: PRIVACY_MAILTO },
            ],
          },
        ],
      },
      {
        id: 'data-we-collect',
        title: 'What we collect',
        nav: 'Data',
        blocks: [
          {
            type: 'p',
            text: 'We collect a limited amount of data to improve our games and understand how they are played. We do not collect payment information, and our games do not require you to register an account with us.',
          },
          { type: 'h3', text: 'Analytics and telemetry' },
          { type: 'p', text: 'When you play our games, we may automatically collect:' },
          {
            type: 'list',
            items: [
              'Gameplay statistics, such as levels completed, session duration, and in-game actions',
              'Game performance metrics, such as frame rate, crash reports, and error logs',
              'Device and platform information, such as operating system version and hardware specifications',
              'Game version and build information',
              'Aggregated play patterns and feature usage',
            ],
          },
          {
            type: 'p',
            text: 'This data is anonymized at the point of collection. We do not assign or store user identifiers, device identifiers, or any other data that could be used to identify you as an individual, and we work only with aggregated data.',
          },
          {
            type: 'p',
            text: 'Sending this data over the internet necessarily involves your IP address reaching the server that receives it. We do not store your IP address with the telemetry or use it to identify you.',
          },
          { type: 'h3', text: 'Data from platforms' },
          {
            type: 'p',
            text: 'If you play through Steam or a console platform such as PlayStation, Xbox, or Nintendo, the platform collects data under its own privacy policy and is responsible for that data. We may receive limited, aggregated information from these platforms, such as achievement statistics or crash reports, as their developer agreements allow. Their policies are here:',
          },
          {
            type: 'links',
            items: [
              { label: 'Steam Privacy Policy', href: platformPolicies.steam },
              { label: 'PlayStation Privacy Policy', href: platformPolicies.playstation },
              { label: 'Xbox Privacy Policy', href: platformPolicies.xbox },
              { label: 'Nintendo Privacy Policy', href: platformPolicies.nintendo },
            ],
          },
        ],
      },
      {
        id: 'how-we-use-data',
        title: 'How we use it',
        nav: 'Use',
        blocks: [
          { type: 'p', text: 'We use the analytics and telemetry data to:' },
          {
            type: 'list',
            items: [
              'Identify and fix bugs, crashes, and performance issues',
              'Understand which features and content players engage with most',
              'Balance gameplay and improve overall game quality',
              'Plan future updates, patches, and new content',
              'Produce aggregated, anonymized reports about how our games are used',
            ],
          },
          {
            type: 'p',
            text: 'We do not sell, rent, or trade your data to third parties for marketing or advertising purposes. We do not use it to make automated decisions about you or to build a profile of you.',
          },
        ],
      },
      {
        id: 'legal-basis',
        title: 'Legal basis',
        blocks: [
          {
            type: 'p',
            text: 'Because the analytics and telemetry data described above is anonymous, we do not treat it as personal data. To the extent that any of it counts as personal data under the General Data Protection Regulation (GDPR) or the UK GDPR, we process it on the basis of our legitimate interests (Article 6(1)(f) GDPR). Those interests are keeping our games stable and improving their quality.',
          },
          {
            type: 'p',
            text: 'Where the law requires your consent before analytics data is collected, we will ask for it first. If you give consent, you can withdraw it at any time. Withdrawing it does not affect processing that took place before.',
          },
        ],
      },
      {
        id: 'data-sharing',
        title: 'Who we share it with',
        blocks: [
          {
            type: 'p',
            text: 'We may share limited data with service providers who help us operate our games and analyze their performance, such as crash-reporting and analytics tools. They act on our instructions and are bound by contract to keep the data confidential and to use it only on our behalf.',
          },
          {
            type: 'p',
            text: 'Beyond that, we do not share personal data with third parties unless the law requires us to.',
          },
        ],
      },
      {
        id: 'international-transfers',
        title: 'Transfers outside the EEA',
        blocks: [
          {
            type: 'p',
            text: 'Some of our service providers may process data on servers outside the European Economic Area. Where that involves personal data, we make sure the transfer is covered by a safeguard recognized by the GDPR: an adequacy decision of the European Commission or the Commission’s standard contractual clauses. You can ask us for details.',
          },
        ],
      },
      {
        id: 'data-retention',
        title: 'How long we keep it',
        blocks: [
          {
            type: 'p',
            text: 'We keep analytics and telemetry data only for as long as necessary for the purposes described in this policy. Aggregated and anonymized data may be kept indefinitely, as it can no longer be linked to any individual. When data is no longer needed, we delete or anonymize it.',
          },
        ],
      },
      {
        id: 'your-rights',
        title: 'Your rights',
        nav: 'Your rights',
        blocks: [
          { type: 'p', text: 'If the GDPR or the UK GDPR applies to you, you have the right to:' },
          {
            type: 'list',
            items: [
              'Ask whether we hold personal data about you and receive a copy of it (access)',
              'Have inaccurate data corrected (rectification)',
              'Have your data deleted (erasure)',
              'Have its processing restricted',
              'Receive your data in a portable format, where that right applies',
              'Withdraw your consent at any time, where we rely on consent',
            ],
          },
          { type: 'h3', text: 'Right to object' },
          {
            type: 'p',
            text: 'You have the right to object at any time, on grounds relating to your particular situation, to processing that we base on our legitimate interests. If you object, we will stop unless we have compelling legitimate grounds to continue.',
          },
          { type: 'h3', text: 'How to use your rights' },
          {
            type: 'p',
            text: 'Email us at the address in the Contact section. We will reply within one month, free of charge. Because we do not store identifiers with our telemetry, we will usually be unable to tell which data, if any, relates to you. If that is the case, we will tell you so.',
          },
          { type: 'h3', text: 'Complaints' },
          {
            type: 'p',
            text: 'You can lodge a complaint with a data protection authority, in particular in the country where you live or work. In the Czech Republic, where we are established, that authority is:',
          },
          {
            type: 'details',
            rows: [
              {
                label: 'Authority',
                value: 'Office for Personal Data Protection (Úřad pro ochranu osobních údajů)',
              },
              { label: 'Address', value: 'Pplk. Sochora 27, 170 00 Praha 7, Czech Republic' },
              { label: 'Website', value: 'uoou.gov.cz', href: AUTHORITY_URL },
            ],
          },
        ],
      },
      {
        id: 'changes',
        title: 'Changes to this policy',
        blocks: [
          {
            type: 'p',
            text: 'We may update this policy to reflect changes in our practices or in the law. When we do, we will change the "Last updated" date at the top of this page. If a change materially affects how we handle your data, we will point it out clearly on this page.',
          },
        ],
      },
      {
        id: 'contact',
        title: 'Contact',
        nav: 'Contact',
        blocks: [
          {
            type: 'p',
            text: 'For any question or request about this policy or your data, contact us:',
          },
          {
            type: 'details',
            rows: [
              { label: 'Company', value: 'GADEN ALPHA s.r.o. (Flying Rat Studio)' },
              { label: 'Email', value: PRIVACY_EMAIL, href: PRIVACY_MAILTO },
              { label: 'Post', value: 'Polní 21, 252 64 Velké Přílepy, Czech Republic' },
              { label: 'Website', value: 'www.flying-rat.studio', href: WEBSITE_URL },
            ],
          },
        ],
      },
    ],
  },
  cs: tieShortWordsDeep<PolicyCopy>({
    eyebrow: 'Flying Rat Studio',
    title: 'Zásady ochrany soukromí',
    description:
      'Jak Flying Rat Studio nakládá s informacemi, když hrajete naše hry na PC a konzolích.',
    updated: 'Naposledy aktualizováno: listopad 2026',
    published: 'Poprvé zveřejněno: březen 2025',
    contentsLabel: 'Obsah',
    sections: [
      {
        id: 'who-we-are',
        title: 'Kdo jsme',
        nav: 'Kdo jsme',
        blocks: [
          {
            type: 'p',
            text: 'Flying Rat Studio („my“, „nás“, „naše“) je nezávislý vývojář a vydavatel videoher. Tyto zásady vysvětlují, jaké informace shromažďujeme, když hrajete naše hry na PC a konzolových platformách, proč je shromažďujeme a jaká máte práva.',
          },
          {
            type: 'p',
            text: 'Vztahují se na hry, které sami vydáváme. Na hry, na kterých pracujeme pro jiná studia a vydavatele, se vztahují zásady ochrany soukromí těchto společností.',
          },
          {
            type: 'p',
            text: 'Flying Rat Studio provozuje níže uvedená společnost, která je správcem údajů pro zpracování popsané v těchto zásadách.',
          },
          {
            type: 'details',
            rows: [
              { label: 'Správce', value: 'GADEN ALPHA s.r.o.' },
              { label: 'IČO', value: '09949194' },
              { label: 'Sídlo', value: 'Polní 21, 252 64 Velké Přílepy' },
              {
                label: 'Zápis',
                value: 'Obchodní rejstřík vedený Městským soudem v Praze, sp. zn. C 345227',
              },
              { label: 'Kontakt pro ochranu soukromí', value: PRIVACY_EMAIL, href: PRIVACY_MAILTO },
            ],
          },
        ],
      },
      {
        id: 'data-we-collect',
        title: 'Jaká data shromažďujeme',
        nav: 'Data',
        blocks: [
          {
            type: 'p',
            text: 'Shromažďujeme omezené množství dat, abychom mohli naše hry zlepšovat a lépe rozuměli tomu, jak se hrají. Neshromažďujeme platební údaje a naše hry nevyžadují registraci účtu přímo u nás.',
          },
          { type: 'h3', text: 'Analytická a telemetrická data' },
          { type: 'p', text: 'Při hraní našich her můžeme automaticky shromažďovat:' },
          {
            type: 'list',
            items: [
              'Herní statistiky, například dokončené úrovně, délku relace a akce ve hře',
              'Metriky výkonu hry, například snímkovou frekvenci, hlášení pádů a chybové logy',
              'Informace o zařízení a platformě, například verzi operačního systému a hardwarové specifikace',
              'Informace o verzi hry a buildu',
              'Agregované vzorce hraní a využívání funkcí',
            ],
          },
          {
            type: 'p',
            text: 'Tato data jsou anonymizována již při sběru. Nepřiřazujeme ani neukládáme žádné uživatelské identifikátory, identifikátory zařízení ani jiná data, podle kterých by vás bylo možné identifikovat, a pracujeme výhradně s agregovanými daty.',
          },
          {
            type: 'p',
            text: 'Odeslání těchto dat přes internet nutně znamená, že se k serveru, který je přijímá, dostane vaše IP adresa. S telemetrickými daty ji neukládáme a nepoužíváme ji k vaší identifikaci.',
          },
          { type: 'h3', text: 'Data od platforem' },
          {
            type: 'p',
            text: 'Pokud hrajete prostřednictvím služby Steam nebo konzolové platformy, jako je PlayStation, Xbox nebo Nintendo, shromažďuje platforma data podle vlastních zásad ochrany soukromí a sama za ně odpovídá. Od těchto platforem můžeme získat omezené agregované informace, například statistiky achievementů nebo hlášení pádů, v rozsahu, který umožňují jejich vývojářské smlouvy. Jejich zásady najdete zde:',
          },
          {
            type: 'links',
            items: [
              { label: 'Zásady ochrany soukromí služby Steam', href: platformPolicies.steam },
              { label: 'Zásady ochrany soukromí PlayStation', href: platformPolicies.playstation },
              { label: 'Zásady ochrany soukromí Xbox', href: platformPolicies.xbox },
              { label: 'Zásady ochrany soukromí Nintendo', href: platformPolicies.nintendo },
            ],
          },
        ],
      },
      {
        id: 'how-we-use-data',
        title: 'Jak data používáme',
        nav: 'Použití',
        blocks: [
          { type: 'p', text: 'Analytická a telemetrická data používáme k tomu, abychom:' },
          {
            type: 'list',
            items: [
              'Nacházeli a opravovali chyby, pády a problémy s výkonem',
              'Pochopili, které funkce a obsah hráči využívají nejvíce',
              'Vyvažovali hratelnost a zlepšovali celkovou kvalitu her',
              'Plánovali budoucí aktualizace, patche a nový obsah',
              'Vytvářeli agregované a anonymizované přehledy o tom, jak se naše hry používají',
            ],
          },
          {
            type: 'p',
            text: 'Vaše data neprodáváme, nepronajímáme ani neposkytujeme třetím stranám pro marketingové nebo reklamní účely. Nepoužíváme je k automatizovanému rozhodování o vás ani k vytváření vašeho profilu.',
          },
        ],
      },
      {
        id: 'legal-basis',
        title: 'Právní základ',
        blocks: [
          {
            type: 'p',
            text: 'Protože jsou výše popsaná analytická a telemetrická data anonymní, nepovažujeme je za osobní údaje. Pokud by některá z nich byla podle obecného nařízení o ochraně osobních údajů (GDPR) nebo britského GDPR osobními údaji, zpracováváme je na základě našeho oprávněného zájmu (čl. 6 odst. 1 písm. f) GDPR). Tímto zájmem je stabilita našich her a zlepšování jejich kvality.',
          },
          {
            type: 'p',
            text: 'Pokud zákon vyžaduje, abychom před sběrem analytických dat získali váš souhlas, nejprve vás o něj požádáme. Udělený souhlas můžete kdykoli odvolat. Odvoláním není dotčena zákonnost zpracování, které proběhlo před ním.',
          },
        ],
      },
      {
        id: 'data-sharing',
        title: 'S kým data sdílíme',
        blocks: [
          {
            type: 'p',
            text: 'Omezené množství dat můžeme sdílet s poskytovateli služeb, kteří nám pomáhají provozovat naše hry a analyzovat jejich výkon, například s nástroji pro analytiku a hlášení pádů. Jednají podle našich pokynů a jsou smluvně zavázáni zachovávat důvěrnost dat a používat je pouze pro naše účely.',
          },
          {
            type: 'p',
            text: 'Nad tento rámec osobní údaje s třetími stranami nesdílíme, ledaže nám to ukládá zákon.',
          },
        ],
      },
      {
        id: 'international-transfers',
        title: 'Předávání mimo EHP',
        blocks: [
          {
            type: 'p',
            text: 'Někteří naši poskytovatelé služeb mohou data zpracovávat na serverech mimo Evropský hospodářský prostor. Pokud se to týká osobních údajů, zajistíme, aby se na předání vztahovala záruka uznaná GDPR: rozhodnutí Evropské komise o odpovídající ochraně nebo standardní smluvní doložky vydané Komisí. Podrobnosti vám na požádání sdělíme.',
          },
        ],
      },
      {
        id: 'data-retention',
        title: 'Jak dlouho data uchováváme',
        blocks: [
          {
            type: 'p',
            text: 'Analytická a telemetrická data uchováváme pouze po dobu nezbytnou k naplnění účelů popsaných v těchto zásadách. Agregovaná a anonymizovaná data mohou být uchovávána neomezeně dlouho, protože je již nelze spojit s žádnou konkrétní osobou. Jakmile data nejsou potřeba, smažeme je nebo anonymizujeme.',
          },
        ],
      },
      {
        id: 'your-rights',
        title: 'Vaše práva',
        nav: 'Vaše práva',
        blocks: [
          {
            type: 'p',
            text: 'Pokud se na vás vztahuje GDPR nebo britské GDPR, máte právo:',
          },
          {
            type: 'list',
            items: [
              'Zjistit, zda o vás zpracováváme osobní údaje, a získat jejich kopii (právo na přístup)',
              'Nechat opravit nepřesné údaje (právo na opravu)',
              'Nechat své údaje vymazat (právo na výmaz)',
              'Požadovat omezení jejich zpracování',
              'Získat své údaje v přenositelném formátu, pokud se toto právo uplatní',
              'Kdykoli odvolat souhlas, pokud zpracování probíhá na jeho základě',
            ],
          },
          { type: 'h3', text: 'Právo vznést námitku' },
          {
            type: 'p',
            text: 'Máte právo kdykoli vznést z důvodů týkajících se vaší konkrétní situace námitku proti zpracování, které opíráme o náš oprávněný zájem. Pokud námitku vznesete, zpracování ukončíme, ledaže pro jeho pokračování máme závažné oprávněné důvody.',
          },
          { type: 'h3', text: 'Jak práva uplatnit' },
          {
            type: 'p',
            text: 'Napište nám na e-mail uvedený v části Kontakt. Odpovíme do jednoho měsíce a nic si za to neúčtujeme. Protože s telemetrií neukládáme žádné identifikátory, obvykle nedokážeme určit, která data se vás týkají a zda vůbec nějaká. Pokud to tak bude, sdělíme vám to.',
          },
          { type: 'h3', text: 'Stížnosti' },
          {
            type: 'p',
            text: 'Můžete podat stížnost u dozorového úřadu, zejména v zemi, kde žijete nebo pracujete. V České republice, kde sídlíme, je jím:',
          },
          {
            type: 'details',
            rows: [
              { label: 'Úřad', value: 'Úřad pro ochranu osobních údajů' },
              { label: 'Adresa', value: 'Pplk. Sochora 27, 170 00 Praha 7' },
              { label: 'Web', value: 'uoou.gov.cz', href: AUTHORITY_URL },
            ],
          },
        ],
      },
      {
        id: 'changes',
        title: 'Změny těchto zásad',
        blocks: [
          {
            type: 'p',
            text: 'Tyto zásady můžeme aktualizovat, aby odpovídaly změnám v našich postupech nebo v právních předpisech. V takovém případě změníme datum „Naposledy aktualizováno“ v horní části stránky. Pokud se změna podstatně dotkne toho, jak s vašimi daty nakládáme, na této stránce na ni zřetelně upozorníme.',
          },
        ],
      },
      {
        id: 'contact',
        title: 'Kontakt',
        nav: 'Kontakt',
        blocks: [
          {
            type: 'p',
            text: 'S jakýmkoli dotazem nebo žádostí ohledně těchto zásad nebo vašich dat se na nás obraťte:',
          },
          {
            type: 'details',
            rows: [
              { label: 'Společnost', value: 'GADEN ALPHA s.r.o. (Flying Rat Studio)' },
              { label: 'E-mail', value: PRIVACY_EMAIL, href: PRIVACY_MAILTO },
              { label: 'Adresa', value: 'Polní 21, 252 64 Velké Přílepy' },
              { label: 'Web', value: 'www.flying-rat.studio', href: WEBSITE_URL },
            ],
          },
        ],
      },
    ],
  }),
};
