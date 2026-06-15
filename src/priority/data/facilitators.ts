/**
 * Facilitators for the Get Into Grad School Bootcamp landing page.
 * Photos live in public/assets/facilitators/ (optimised webp).
 * `bio` holds the FULL bio verbatim (one string per paragraph); the card shows
 * the name + credential + session and opens the full bio in a zero-JS modal.
 */

export interface Facilitator {
  name: string;
  /** One-line credential headline shown on the card. */
  credential: string;
  /** Which session / topic they lead. */
  session: string;
  /** /assets/facilitators/<slug>.webp — the filename slug also keys the modal. */
  photo: string;
  /** Full bio, one entry per paragraph. */
  bio: string[];
}

export const FACILITATORS: Facilitator[] = [
  {
    name: 'Stephanie Anokyewa Tawiah',
    credential: 'Cambridge MPhil · Mastercard Foundation Scholar',
    session: 'Personal Statements & Scholarship Essays',
    photo: '/assets/facilitators/stephanie-tawiah.webp',
    bio: [
      'Stephanie Anokyewa Tawiah is a development finance professional and Mastercard Foundation Scholar alumna of the University of Cambridge, where she completed an MPhil in Public Policy at Churchill College. During her time at Cambridge, she was recognised with the Policy Analysis Exercise Award for collaborative work with the World Bank, and served as a mentor on the University of Cambridge Pre-Application Mentorship (PAM) Project, supporting aspiring students through the graduate school application process.',
      'A First Class Economics graduate of Kwame Nkrumah University of Science and Technology (KNUST), Stephanie has built an impressive career spanning management consulting at KPMG Africa, investment analysis, and policy advisory roles at institutions including the Tony Blair Institute for Global Change and the African Development Bank Group, where she currently serves as a Graduate in the Human Capital Development division. She is also Head of Programmes at the Centre for Policy Scrutiny. Across her career, she has led DFI-funded programmes worth over US$3 million and driven measurable impact across Ghana and beyond.',
      'Stephanie knows what it takes to craft an application that stands out. From earning First Class Honours at KNUST to securing one of Africa’s most competitive postgraduate scholarships and gaining admission to one of the world’s top universities, she has navigated the full arc of the scholarship and graduate school application journey.',
      'In this session, “The A-Z of Personal Statements and Scholarship Essays,” Stephanie brings both hard-won experience and a genuine passion for opening doors for others.',
    ],
  },
  {
    name: 'Roissa Darko',
    credential: 'Chevening Scholar · MA, University of Manchester',
    session: 'Personal Statements & Scholarship Essays',
    photo: '/assets/facilitators/roissa-darko.webp',
    bio: [
      'Roissa Darko is a development professional with a multidisciplinary background spanning urban and housing development, gender and youth empowerment, and migration. She holds a Master’s degree in International Development, specialising in Urban and Housing Development, from the University of Manchester, where her postgraduate research investigated the effects of housing policy on low-income households and the socioeconomic consequences of labour migration on vulnerable urban communities.',
      'Her postgraduate degree was awarded under the prestigious Chevening Scholarship in 2020, granted by the United Kingdom’s Foreign, Commonwealth and Development Office (FCDO), one of the most competitive government-funded scholarship programmes in the world. She remains an active member of the Chevening Ghana Alumni Network, currently serving as an Organiser for the 2025 to 2027 term.',
      'Roissa knows what a winning scholarship application looks like, because she has written one. In the session, “The A-Z of Personal Statements and Scholarship Essays,” she will draw on her own experience of earning one of the UK’s most sought-after scholarships to walk participants through how to craft personal statements and essays that are compelling, authentic, and built to stand out in a competitive pool.',
    ],
  },
  {
    name: 'Peggy Kere Osman',
    credential: 'DAAD Helmut-Schmidt Scholar · Duisburg-Essen',
    session: 'Becoming the Candidate Admissions Committees Can’t Overlook',
    photo: '/assets/facilitators/peggy-kere-osman.webp',
    bio: [
      'Peggy Kere Osman is a DAAD Helmut-Schmidt Scholar pursuing a Master of Arts in Development and Governance at the University of Duisburg-Essen, Germany, where she also serves as student representative for her cohort. She holds a Bachelor of Arts in Political Science and Chinese from the University of Ghana, graduating with First Class Honours, and is a certified Project Management Professional (PMP).',
      'Her work sits at the intersection of governance, gender advocacy, and strategic communication, with hands-on experience supporting development programmes across Ghana and Germany. She has contributed to initiatives spanning climate action, community development, youth empowerment, and agritech innovation, bringing both research expertise and programme coordination skills to each context.',
      'Beyond her professional work, Peggy is a writer and storyteller who believes that narrative is a powerful tool for policy and social change. She channels this conviction into her YouTube channel, where she is committed to equipping young Africans with the knowledge, confidence, and tools needed to compete for global scholarships and academic opportunities.',
      'In the session, “Becoming the Candidate Admissions Committees Cannot Overlook,” Peggy will draw on her own journey of earning First Class Honours, securing the prestigious DAAD Helmut-Schmidt Scholarship, and building a standout profile across two continents, to show participants exactly what it takes to go from overlooked to unforgettable.',
    ],
  },
  {
    name: 'Korkoe Yao Attipoe',
    credential: 'Fully-funded PhD · Wageningen · Mastercard Scholar',
    session: 'Research Proposals & Getting Funded',
    photo: '/assets/facilitators/korkoe-attipoe.webp',
    bio: [
      'Korkoe Yao Attipoe is a Food Science Engineer and Mastercard Foundation Scholar alumnus of Kwame Nkrumah University of Science and Technology (KNUST), where he graduated with First Class Honours in Food Science and Technology. He went on to earn a Master of Science and Engineering in Food Science from Junia Ingénieurs in France, before securing a fully funded PhD position at Wageningen University and Research in the Netherlands, one of the world’s leading institutions for life sciences and sustainability.',
      'His PhD research focuses on sustainable packaging solutions through the valorisation of food by-products into bioplastic materials, sitting at the intersection of food science, circular economy, and environmental innovation. Prior to his doctoral studies, Korkoe built a strong research foundation through roles at Institut Charles Viollette and Kakao Mundo, and was recognised for his work by the FAO as a shortlisted candidate for the World Food Safety Day 2025 Poster Competition.',
      'Beyond the lab, Korkoe is the founder of FoodSci Lab Life and Beyond, a science communication platform dedicated to making food science, nutrition, and sustainability accessible to everyday audiences. He is also a creative writer at Elevate Career Hub, where he has supported over 100 applicants in strengthening their CVs and school applications.',
      'In this session, “Getting Into a Research Programme: Proposals, Pitching to Supervisors and Getting Funded,” Korkoe draws on his own journey navigating the competitive world of research admissions to offer practical, first-hand guidance to aspiring researchers.',
    ],
  },
  {
    name: 'Freddy Da-Silveira',
    credential: 'Master’s, Ball State · Graduate Assistantship winner',
    session: 'Landing a Graduate Assistantship',
    photo: '/assets/facilitators/frederick-da-silveira.webp',
    bio: [
      'Freddy Da-silveira is a Master’s student in Information and Communication Sciences at Ball State University in the United States. His background spans technology, digital systems, digital banking operations, and organisational support, with a consistent focus on using technology to solve real problems.',
      'He is also the co-founder of 233Labs, a technology venture focused on building AI-driven solutions. One of their key products is CollegeReady.io, a platform that helps students navigate the study abroad journey through tools like university matching and AI-powered visa interview preparation.',
      'What makes Freddy’s perspective particularly valuable is that he secured a graduate assistantship with a 2.5/4.0 GPA, proof that a strong GPA is not always the deciding factor and that how you position yourself matters just as much. In his session, “Get Paid to Study: The Complete Guide to Landing a Graduate Assistantship,” he will walk participants through everything from understanding what a graduate assistantship actually is, to finding opportunities, putting together a strong application, negotiating offers, and managing the balance between assistantship responsibilities and coursework.',
      'Whether you are hearing about assistantships for the first time or already in the middle of the process, this session will give you a clear and honest roadmap from someone who has been through it.',
    ],
  },
  {
    name: 'Rachel Arthur',
    credential: 'DAAD Scholar · Chartered Accountant',
    session: 'Scholarship Panel',
    photo: '/assets/facilitators/rachel-arthur.webp',
    bio: [
      'Rachel Arthur is a Chartered Accountant and current DAAD Scholar pursuing a Master of Arts in International and Development Economics at Hochschule für Technik und Wirtschaft Berlin, Germany. She holds a Bachelor of Business Administration in Accounting from the University of Ghana, where she graduated with First Class Honours, and is a fully qualified member of the Institute of Chartered Accountants, Ghana.',
      'Before relocating to Germany for her postgraduate studies, Rachel spent over three years in audit and financial reporting, including a role as an Experienced Audit Associate at EY, one of the world’s Big Four professional services firms. Her work spanned financial services, oil and gas, real estate, manufacturing, and the public sector, building a track record that speaks to both her technical depth and her ability to perform under pressure.',
      'At HTW Berlin, she serves as a University Buddy, mentoring incoming international students through the academic and cultural transitions that come with studying abroad. Her journey from Accra to Berlin, through the DAAD scholarship, is one she is glad to share openly on a scholarship panel as part of the ‘Get into Grad School Bootcamp’.',
    ],
  },
  {
    name: 'Sylvia Boamah Yeboah',
    credential: 'Erasmus Mundus Scholar · Social Work',
    session: 'Scholarship Panel',
    photo: '/assets/facilitators/sylvia-boamah.webp',
    bio: [
      'Sylvia Boamah Yeboah is an Erasmus Mundus Scholar whose academic journey took her across multiple European universities through one of the world’s most prestigious and competitive fully funded scholarship programmes. With a background in Social Work and a passion for social inclusion and community development, Sylvia has built experience working with diverse populations and contributing to initiatives that create meaningful social impact. Her journey reflects a commitment to lifelong learning, global engagement, and using education as a tool for transformation.',
      'Having successfully secured and completed the highly competitive Erasmus Mundus Scholarship programme, Sylvia understands firsthand what it takes to navigate the scholarship application process, stand out as a candidate, and thrive in an international academic environment. Her experience has equipped her with practical insights into scholarship strategy, application preparation, studying abroad, and building a global network.',
      'As a panellist for the “Deep Dive into Scholarships” session at the Get Into Grad School Bootcamp, Sylvia is excited to share lessons from her Erasmus Mundus journey and help aspiring graduate students identify and successfully pursue fully funded scholarship opportunities around the world.',
    ],
  },
  {
    name: 'Alexander Dankyi Asare',
    credential: 'MBA, Duke Fuqua · ex-BCG, KPMG · CFA',
    session: 'The MBA Blueprint',
    photo: '/assets/facilitators/alex-dankyi.webp',
    bio: [
      'Alexander Dankyi Asare is a finance and strategy professional with a global perspective and a strong foundation in business advisory, financial reporting, and leadership. He is currently an MBA candidate at Duke University’s Fuqua School of Business (Class of 2026), where he serves as Co-President of the Business in Africa Club and is passionate about creating opportunities for future African business leaders.',
      'Alexander began his career in Ghana as a Teaching and Research Assistant at the University of Cape Coast before joining Deloitte as a Tax Consultant, advising diverse clients on complex tax and regulatory matters. He later joined KPMG, first in Ghana and then in the United States, where he led audit engagements across multiple industries and developed deep expertise in financial reporting, risk management, and business transformation.',
      'Driven by a desire to broaden his impact beyond accounting and assurance, Alexander pursued an MBA as a platform to expand his leadership capabilities and transition into strategy consulting. During his MBA, he secured a highly competitive Summer Consultant role with Boston Consulting Group (BCG), one of the world’s leading consulting firms, where he worked on solving complex business challenges for global clients.',
      'Alexander is a Chartered Financial Analyst (CFA) charterholder and also holds ACCA and CPA certifications, reflecting his commitment to continuous learning and professional excellence. Throughout his career, he has remained deeply passionate about mentoring young people, helping them find direction, build confidence, and realize their full potential.',
    ],
  },
  {
    name: 'Eugene Modey',
    credential: 'MBA, Columbia · Investment Banking',
    session: 'The MBA Blueprint',
    photo: '/assets/facilitators/eugene-modey.webp',
    bio: [
      'Eugene Modey began his career at PwC Ghana, where he built a strong foundation in audit and financial advisory. Driven by a desire to broaden his exposure and challenge himself further, he later moved to PwC in the UK.',
      'Although he was progressing well professionally, Eugene realised he wanted to move beyond audit and reposition himself closer to Mergers & Acquisitions (M&A) and capital markets. That decision led him to pursue the MBA route as a deliberate pivot into investment banking.',
      'His MBA journey is a story of intentionality and resilience. Eugene earned admission into multiple top business schools like MIT, Cornell & NYU amongst others, securing funding along the way before ultimately choosing Columbia Business School. While at Columbia, he approached the experience with the same intentionality, building meaningful relationships, leveraging the school’s network, and fully immersing himself in opportunities both inside and outside the classroom.',
      'Through persistence, networking, and consistent hard work, he secured a Summer Associate internship at one of the largest investment banks globally, later earning a full-time return offer. His journey from Accra, to the UK, and eventually to Wall Street reflects what is possible when preparation meets bold ambition.',
      'Outside of finance, Eugene is an avid traveller who has visited 31 countries and counting, with Japan currently ranking as his favourite destination.',
    ],
  },
  {
    name: 'Fred Sapathy',
    credential: 'MBA, Kellogg · IB Associate, Bank of America',
    session: 'The MBA Blueprint',
    photo: '/assets/facilitators/fred-sapathy.webp',
    bio: [
      'Fred Sapathy is an Investment Banking Associate at Bank of America and a graduate of Northwestern University’s Kellogg School of Management. Prior to business school, he built his career across PwC and BDO in Ghana and the UK, advising clients in the financial services sector and gaining exposure to some of the world’s leading financial institutions.',
      'As an international student and career switcher, Fred successfully navigated both the MBA admissions process and the highly competitive investment banking recruiting journey. Having experienced those transitions firsthand, he is passionate about helping others chart their own paths, make informed career decisions, and unlock opportunities they may not have thought possible.',
    ],
  },
  {
    name: 'Fareedatu Naa Okailey Quaye',
    credential: 'Study Abroad Consultant',
    session: 'Visas & Getting Ready for School',
    photo: '/assets/facilitators/fareedatu-quaye.webp',
    bio: [
      'Fareedatu Naa Okailey Quaye is a Study Abroad Consultant with several years of experience supporting students through the international admissions and visa application process. Through her work at Femon Travel and Tours Ltd., she has guided aspiring students in securing admissions to universities across Canada, Germany, the United States, and other European countries.',
      'Known for her personalized approach and deep understanding of the study abroad landscape, Fareedatu has helped numerous students successfully navigate what can often be a complex and overwhelming journey. From identifying the right academic programmes and institutions to preparing strong applications and managing visa requirements, she works closely with students at every stage of the process.',
      'Passionate about expanding access to global education opportunities, Fareedatu is committed to helping students make informed decisions, achieve their academic aspirations, and confidently pursue opportunities beyond their borders.',
    ],
  },
];
