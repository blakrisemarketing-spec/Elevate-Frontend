/**
 * Facilitators for the Get Into Grad School Bootcamp landing page.
 * Photos live in public/assets/facilitators/ (optimised webp). Bios are
 * condensed from the supplied long-form bios; the session tag maps each
 * facilitator to the curriculum.
 */

export interface Facilitator {
  name: string;
  /** One-line credential headline. */
  credential: string;
  /** Which session / topic they lead. */
  session: string;
  /** /assets/facilitators/<slug>.webp */
  photo: string;
  /** 2–3 sentence bio. */
  bio: string;
}

export const FACILITATORS: Facilitator[] = [
  {
    name: 'Stephanie Anokyewa Tawiah',
    credential: 'Cambridge MPhil · Mastercard Foundation Scholar',
    session: 'Personal Statements & Scholarship Essays',
    photo: '/assets/facilitators/stephanie-tawiah.webp',
    bio: 'A development finance professional and Mastercard Foundation Scholar alumna of the University of Cambridge (MPhil, Public Policy), with First Class honours from KNUST. She has advised at KPMG Africa, the Tony Blair Institute, and the African Development Bank.',
  },
  {
    name: 'Roissa Darko',
    credential: 'Chevening Scholar · MA, University of Manchester',
    session: 'Personal Statements & Scholarship Essays',
    photo: '/assets/facilitators/roissa-darko.webp',
    bio: 'A development professional whose Manchester master’s was funded by the prestigious Chevening Scholarship. She knows what a winning scholarship application looks like — because she has written one — and walks you through essays built to stand out.',
  },
  {
    name: 'Peggy Kere Osman',
    credential: 'DAAD Helmut-Schmidt Scholar · Duisburg-Essen',
    session: 'Becoming the Candidate Committees Can’t Overlook',
    photo: '/assets/facilitators/peggy-kere-osman.webp',
    bio: 'A DAAD Helmut-Schmidt Scholar pursuing an MA in Development & Governance, with a First Class in Political Science from the University of Ghana and a PMP certification. She shows you exactly how to go from overlooked to unforgettable.',
  },
  {
    name: 'Korkoe Yao Attipoe',
    credential: 'Fully-funded PhD · Wageningen · Mastercard Scholar',
    session: 'Research Proposals & Getting Funded',
    photo: '/assets/facilitators/korkoe-attipoe.webp',
    bio: 'A Food Science Engineer with First Class honours from KNUST and a fully funded PhD at Wageningen University. He has supported 100+ applicants at Elevate and offers first-hand guidance on winning competitive research admissions.',
  },
  {
    name: 'Freddy Da-Silveira',
    credential: 'Master’s, Ball State · Graduate Assistantship winner',
    session: 'Landing a Graduate Assistantship',
    photo: '/assets/facilitators/frederick-da-silveira.webp',
    bio: 'A Master’s student at Ball State University and co-founder of 233Labs / CollegeReady.io. He secured a graduate assistantship with a 2.5 GPA — proof that positioning beats grades — and gives a clear, honest roadmap to getting funded.',
  },
  {
    name: 'Rachel Arthur',
    credential: 'DAAD Scholar · Chartered Accountant',
    session: 'Scholarship Panel',
    photo: '/assets/facilitators/rachel-arthur.webp',
    bio: 'A Chartered Accountant and DAAD Scholar pursuing an MA in International & Development Economics in Berlin, with First Class honours from the University of Ghana and audit experience at EY. She shares her Accra-to-Berlin scholarship journey openly.',
  },
  {
    name: 'Alexander Dankyi Asare',
    credential: 'MBA, Duke Fuqua · ex-BCG, KPMG · CFA',
    session: 'The MBA Blueprint',
    photo: '/assets/facilitators/alex-dankyi.webp',
    bio: 'A finance and strategy professional and MBA candidate at Duke’s Fuqua School, where he co-leads the Business in Africa Club. A CFA charterholder (also ACCA and CPA), he has worked at Deloitte, KPMG, and BCG.',
  },
  {
    name: 'Eugene Modey',
    credential: 'MBA, Columbia · Investment Banking',
    session: 'The MBA Blueprint',
    photo: '/assets/facilitators/eugene-modey.webp',
    bio: 'From PwC Ghana to PwC UK to Wall Street — Eugene earned admission to MIT, Cornell, and NYU before choosing Columbia, then landed a Summer Associate role at one of the world’s largest investment banks. A story of intentionality and resilience.',
  },
  {
    name: 'Fred Sapathy',
    credential: 'MBA, Kellogg · IB Associate, Bank of America',
    session: 'The MBA Blueprint',
    photo: '/assets/facilitators/fred-sapathy.webp',
    bio: 'An Investment Banking Associate at Bank of America and Kellogg MBA who built his career across PwC and BDO in Ghana and the UK. As an international student and career switcher, he has navigated both MBA admissions and IB recruiting firsthand.',
  },
  {
    name: 'Fareedatu Naa Okailey Quaye',
    credential: 'Study Abroad Consultant',
    session: 'Visas & Getting Ready for School',
    photo: '/assets/facilitators/fareedatu-quaye.webp',
    bio: 'A Study Abroad Consultant with years of experience guiding students into universities across Canada, Germany, the US, and Europe — from choosing the right programmes to managing visa requirements at every stage.',
  },
];
