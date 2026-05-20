# Non-Priority Route QA — Pre-Rendered SPA Shells

Generated: 2026-05-10T10:40:46.385Z

Command: `node scripts/qa-non-priority-routes.mjs`

Result: PASS (24/24 routes passed)

Each non-priority migrated route ships as a pre-rendered SPA shell with route-specific
`<head>` metadata + meaningful `<body>` content. This gate proves crawlers and social
previews see real, indexable content (not the generic SPA fallback).

| Route | HTTP | Title | Meta description (len) | H1 | Result |
|---|---:|---|---:|---|---|
| `/blog/` | 200 | Career & Education Insights — Elevate Career Hub Blog | 114 | Career & Education Insights | PASS |
| `/career-strategy-session/` | 200 | 1-on-1 Career Strategy Session — Elevate Career Hub | 120 | Career Strategy Session | PASS |
| `/cover-letter/` | 200 | Cover Letter Writing Service — Elevate Career Hub | 127 | Cover Letter Writing | PASS |
| `/curriculum-vitae/` | 200 | CV Writing Service — Elevate Career Hub | 112 | Curriculum Vitae (CV) Writing | PASS |
| `/faqs/` | 200 | Frequently Asked Questions — Elevate Career Hub | 106 | Frequently Asked Questions | PASS |
| `/how-our-career-development-company-can-help-you-stand-out/` | 200 | How Elevate Career Hub Helps You Stand Out | 131 | How Our Career Development Company Helps You Stand Out | PASS |
| `/how-to-boost-your-career-with-professional-resume-writing/` | 200 | Boost Your Career with Professional Resume Writing | 112 | How to Boost Your Career with Professional Resume Writing | PASS |
| `/interview-preparation-session/` | 200 | Interview Preparation Session — Elevate Career Hub | 108 | Interview Preparation Session | PASS |
| `/job-readiness-bootcamp/` | 200 | Job Readiness Bootcamp — Elevate Career Hub | 101 | Job Readiness Bootcamp | PASS |
| `/jrb-thank-you/` | 200 | Welcome to the Job Readiness Bootcamp — Elevate Career Hub | 127 | Welcome to the Job Readiness Bootcamp | PASS |
| `/lets-keep-in-touch/` | 200 | Let’s Keep in Touch — Elevate Career Hub | 112 | Let’s Keep in Touch | PASS |
| `/linkedin-optimization/` | 200 | LinkedIn Optimization Service — Elevate Career Hub | 115 | LinkedIn Optimization | PASS |
| `/product/becoming-a-job-magnet-on-linkedin/` | 200 | Becoming a Job Magnet on LinkedIn — DIY Product | 94 | Becoming a Job Magnet on LinkedIn | PASS |
| `/product/complete-grad-school-bundle/` | 200 | Complete Grad School Bundle — DIY Product | 110 | Complete Grad School Bundle | PASS |
| `/product/how-to-write-the-resume-that-lands-the-interview/` | 200 | How to Write the Resume That Lands the Interview — DIY Product | 100 | How to Write the Resume That Lands the Interview | PASS |
| `/product/mastering-the-art-of-job-hunting-in-the-uk-as-an-international-student/` | 200 | Job Hunting in the UK as an International Student — DIY Product | 118 | Mastering the Art of Job Hunting in the UK as an International Student | PASS |
| `/product/nailing-your-job-interviews/` | 200 | Nailing Your Job Interviews — DIY Product | 113 | Nailing Your Job Interviews | PASS |
| `/product/remote-job-playbook/` | 200 | Remote Job Playbook — DIY Product | 82 | Remote Job Playbook | PASS |
| `/product/the-complete-job-search-bundle/` | 200 | The Complete Job Search Bundle — DIY Product | 99 | The Complete Job Search Bundle | PASS |
| `/reference-letter/` | 200 | Reference Letter Service — Elevate Career Hub | 110 | Reference Letter Drafts | PASS |
| `/statement-of-purpose/` | 200 | Statement of Purpose & Scholarship Essay — Elevate Career Hub | 128 | Statement of Purpose & Scholarship Essay | PASS |
| `/suggestion-of-schools/` | 200 | School Suggestion Service — Elevate Career Hub | 101 | School Suggestion Service | PASS |
| `/the-importance-of-professional-documents-in-career-development/` | 200 | The Importance of Professional Documents in Career Development | 110 | The Importance of Professional Documents in Career Development | PASS |
| `/tips-for-crafting-an-effective-resume-cover-letter-personal-statement-and-school-application/` | 200 | Tips for Crafting an Effective Resume, Cover Letter & Application | 116 | Tips for Crafting an Effective Resume, Cover Letter, Personal Statement, and School Application | PASS |
