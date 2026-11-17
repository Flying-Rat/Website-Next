/** The teams we hire into and their roles; `previously` holds roles that are closed. */
export const jobSections = [
  {
    id: 'engineering',
    positions: [
      { key: 'cppMediorEngineer', level: 'medior' },
      { key: 'cppRustEngineer', level: 'senior' },
      { key: 'backendEngineer', level: 'medior' },
    ],
  },
  {
    id: 'qa',
    positions: [{ key: 'qaEngineer', level: 'medior' }],
  },
  {
    id: 'production',
    positions: [{ key: 'mediorProducer', level: 'medior' }],
  },
  {
    id: 'marketing',
    positions: [{ key: 'marketingManager', level: 'medior' }],
  },
  {
    id: 'it',
    positions: [{ key: 'juniorIt', level: 'junior' }],
  },
  {
    id: 'previously',
    positions: [
      { key: 'unrealEngineer', level: 'medior' },
      { key: 'unityEngineer', level: 'medior' },
      { key: 'pythonProgrammer', level: 'medior' },
      { key: 'officeCultureManager', level: 'medior' },
    ],
  },
];
