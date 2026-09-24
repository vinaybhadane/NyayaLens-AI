/**
 * Public Legal Aid Resource directory for India (NALSA & DLSA).
 */
export interface LegalAidResource {
  name: string;
  level: 'National' | 'State' | 'District';
  contact: string;
  website: string;
  description: string;
  eligibility: string;
}

export const INDIAN_LEGAL_AID_RESOURCES: LegalAidResource[] = [
  {
    name: 'National Legal Services Authority (NALSA)',
    level: 'National',
    contact: 'National Toll-Free Helpline: 15100',
    website: 'https://nalsa.gov.in',
    description:
      'Provides free legal services to eligible persons and organizes Lok Adalats for speedy resolution of disputes.',
    eligibility:
      'Women, children, SC/ST members, industrial workmen, persons with disabilities, victims of trafficking or disaster, and individuals with annual income below specified statutory limits.',
  },
  {
    name: 'District Legal Services Authority (DLSA)',
    level: 'District',
    contact: 'Available at every District Court Complex across all states',
    website: 'https://nalsa.gov.in/district-legal-services-authorities',
    description:
      'Front offices at district courts provide legal aid counsels, pre-litigation mediation, and legal consultation free of cost.',
    eligibility: 'Same as NALSA statutory eligibility criteria under Section 12 of the Legal Services Authorities Act, 1987.',
  },
  {
    name: 'Tele-Law (Department of Justice)',
    level: 'National',
    contact: 'Helpline: 14455 / Common Service Centres (CSCs)',
    website: 'https://tele-law.in',
    description:
      'Connects citizens with panel lawyers through video conferencing and phone facilities at village level panchayats.',
    eligibility: 'Free for marginalized categories; nominal fee for others.',
  },
];
