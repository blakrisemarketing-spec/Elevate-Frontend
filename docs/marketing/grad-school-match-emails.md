# Grad School Match, post-signup email sequence

*Final copy, ready to build in the ESP. June 2026.*

Companion to the Grad School Match tool (`/grad-school-match/`). The Day-0 match
report already fires automatically from `api/quiz-lead.php`. This doc holds the
follow-up nurture copy: 7 emails over ~16 days, anchored to signup, built to
convert into a Get Into Grad School Bootcamp registration.

**Primary segment:** the `reason` answer (their goal). **Modifiers:** `blocker`,
`funding`, `qualification`, `timeline`, `destination`, CV-uploaded.

Voice: Insider Friend, warm and a little funny, honest, second person, no em
dashes. Proof is real only (no fabricated testimonials).

## Tokens
- {first_name} first name
- {destination} top destination phrase, e.g. "the UK", "the US", "Canada", or "abroad"
- {goal} plain-language goal label
- {top_match} their #1 matched pathway name (e.g. "Fully funded UK master's")
- {blocker_label} their blocker, e.g. "finding the money and scholarships"
- All CTAs link to https://elevatecareerhub.com/get-into-grad-school-bootcamp/#tickets unless noted.

## Pricing + facts (keep accurate)
- Full Access Pass: **GHS 1,200 early-bird** (returns to GHS 1,500). Drop-in: **GHS 300 / session**.
- 8 live sessions, **26 Jul to 18 Aug 2026**, Google Meet, 2 hrs each + Q&A.
- Bonuses: Ultimate Funding Pack (50+ scholarships), Smart School List (30+ low-tuition universities), 90 days replay, WhatsApp community.
- Facilitators: Chevening, DAAD, Mastercard and Forte scholars, MBAs from Columbia, Duke and Kellogg, admissions and visa specialists.
- Co-founders: Rosemary (full-ride scholarship, University of Manchester), Naa (Michigan Ross, Forte Fellow).
- Approved stats: 6+ years, 2,000+ professionals helped, 96% positive reviews.

## Email 0, Day 0: The match report (already built)
Automated, goal-driven, sent on submit by `api/quiz-lead.php`. Listed here so the
sequence reads in order. Everything below is what gets built in the ESP.

## Email 1, Day 0 (about 3 hours after signup): Matching was the easy part
- **Subject options:**
  1. Matching was the easy part, {first_name}
  2. Your report is step 1. Here is step 2.
  3. So you have your matches. Now what?
- **Preview:** The thing that actually wins the offer, and the funding.
- **Purpose:** Reframe matching as step one; the application is the real game. Keep them warm.
- **Segment:** All.

Hi {first_name},

Your match report is sitting in your inbox, and if you are like most people who take our quiz, you have already taken a screenshot of the scholarships you liked. Good. Keep them somewhere safe.

Here is the part nobody tells you though. Getting matched to {top_match} is the easy bit. Plenty of people qualify for the same programs and scholarships you do. The ones who actually get the offer, and the funding, are the ones who know how to position themselves.

That is the whole game. Not your grades, not who you know. The story you tell and how you tell it.

Over the next few days we will show you exactly how that works, starting with what is genuinely possible for someone with your goal. For now, give your report another read and pick the two matches that made your heart beat a little faster.

**[See the bootcamp that makes it happen]**

Talk soon,
Naa and Rosemary, from Elevate Career Hub

## Email 2, Day 1: Goal story (one of five variants)
- **Purpose:** The emotional core. Show that someone with their goal really does make it, then bridge to the bootcamp.
- **Segment:** by `reason`. Send the matching variant only.

### 2A. Goal = Immigration ("moving and building a life abroad")
- **Subjects:** (1) They said the visa rules killed the dream. They did not. (2) Your life in {destination} is closer than the headlines suggest. (3) Moving abroad is not luck. It is a plan.
- **Preview:** Why grad school is still the cleanest way through.

Hi {first_name},

You told us the real goal: moving and building a life in {destination}. Not a holiday. A life.

And we know the noise. Visa rules tightening, headlines telling you the door is closing. Here is the truth from people who walked through it: that door is still wide open for a student with a funded offer. Grad school is the cleanest, most legal route to living and working abroad, and it usually comes with a study-to-work pathway most people do not even know to ask for.

Our co-founder Rosemary did exactly this, a full-ride scholarship to the University of Manchester. Not because she knew someone. Because she learned the system.

The Get into Grad School bootcamp hands you that system: how to pick a country and school that actually leads to staying (Session 1), how to fund it (Session 7), and how to clear the visa at the end (Session 8).

**[Show me the route]**

Naa and Rosemary from Elevate Career Hub

### 2B. Goal = Career switch
- **Subjects:** (1) Your "random" background is actually your edge. (2) It is not too late to switch. It is the perfect time. (3) The cleanest career reset there is.
- **Preview:** How people pivot fields, and countries, at once.

Hi {first_name},

Switching into a whole new career is one of the bravest things you can do, and grad school is one of the few resets that genuinely works. A master's lets you walk into a new field with a credential that says you belong there.

Here is what most switchers get wrong: they hide their old career like it is a weakness. It is the opposite. The accountant moving into public health, the teacher moving into data, that journey is your most interesting story. Committees love a clear, deliberate pivot. You just have to frame it right.

That is Session 2 (becoming the candidate they cannot overlook) and Session 4 (writing the essay that turns your switch into a strength). And if business school is the goal, Session 3, MBA blueprint is built for exactly this.

You are not starting over. You are leveling up with everything you already know.

**[Show me how to pivot]**

Naa and Rosemary from Elevate Career Hub

### 2C. Goal = Promotion ("leveling up where I already am")
- **Subjects:** (1) The raise is on the other side of this degree. (2) Is grad school worth it? Let us be honest. (3) Rocket fuel for the career you already have.
- **Preview:** The ROI math nobody shows you.

Hi {first_name},

You are not lost. You are good at what you do and you want to go further, faster. The right master's or MBA is one of the most reliable ways to do it, and yes, the numbers usually work out.

One of our bootcamp facilitators, Eugene, pursued an MBA at Columbia University as a Forte Fellow, and he will be the first to tell you the degree was less about the classroom and more about the doors it opened. That is what you are really buying: access, network, and a credential that moves you up a tier.

The trick is doing it without drowning in tuition. Session 3, MBA blueprint, will show you how to get into a top MBA and maximise your returns, Session 6 will show you how to land assistantships that pay you to study, and in Session 7, the scholarship deep dive, a panel of scholars will teach you all there is to know about landing competitive scholarships like Erasmus Mundus, DAAD and Chevening. Level up without the debt spiral.

**[Show me the ROI]**

Naa and Rosemary from Elevate Career Hub.

### 2D. Goal = Research career
- **Subjects:** (1) How to get a supervisor to say yes, and fund you. (2) The research world has a seat for you. (3) Funded PhDs are not just for the published few.
- **Preview:** Most people pitch supervisors completely wrong.

Hi {first_name},

Building a research or academic career can feel like a closed club, especially when the listings ask for publications you do not have yet. Here is the secret: the strongest funded applicants often are not the most published. They are the ones who pitch a supervisor a project that supervisor actually wants to run.

That is a skill, and it is learnable. Most people send a generic email and never hear back. We will show you how to find the right supervisor, read their work, and write the kind of proposal that gets a reply with a funding line attached.

Session 5 is the whole playbook (proposals, pitching, getting funded), and Session 6 covers assistantships, one of the most underused ways to fund research. Your ideas deserve a seat at the table.

**[Show me how to get funded]**

Naa and Rosemary from Elevate Career Hub

### 2E. Goal = Prestige ("a world-class school on my CV")
- **Subjects:** (1) Harvard is not as far as it feels. (2) Top schools are not reserved for insiders. (3) You are allowed to aim that high.
- **Preview:** What actually gets you into a world-class school.

Hi {first_name},

Let us name it: you want a world-class school on your CV. Harvard, Oxford, LSE, Columbia, the names that open rooms. And somewhere a voice told you those are for other people.

They are not. Every year, we help students with profiles a lot like yours get in, and none of them are supergeniuses or trust-fund kids. They are people who understood what those committees actually look for and built an application around it.

That is not grades alone. It is a sharp narrative, a standout profile, and an essay that makes a reader sit up. Session 2 shows you how to become the candidate they cannot overlook, Session 4 builds the essay, and Session 7 makes sure money never becomes the reason you do not go.

Aim high. You have earned the right to.

**[Show me how to stand out]**

Naa and Rosemary from Elevate Career Hub.

## Email 3, Day 3: Name the blocker, show the fix
- **Purpose:** Take their single biggest worry and point to the exact session that solves it.
- **Segment:** by `blocker`. Shared opening, then the one matching block.
- **CTA (all):** **[Fix this with me]**

**Shared opening:**

Hi {first_name},

When we asked what is stressing you out most, you said: {blocker_label}. So let us talk about that, because it is more fixable than it feels right now.

### Blocker = funding
- **Subjects:** (1) The truth about scholarships nobody tells you. (2) Funding is not the wall you think it is.

Most people believe scholarships go to a tiny group of perfect students. Wrong. The biggest reason people do not get funded is that they either apply to the wrong ones, apply too late, or apply with a generic essay. There is a system to it: which scholarships fit your profile, when their windows open, and how to write one essay you can adapt across many. Session 7 is a deep dive into scholarships, and you will walk away with our Ultimate Funding Pack which contains 50+ scholarships you can apply to and when. Get a seat in the room so that money is no longer an excuse for not pursuing your grad school dreams.

### Blocker = essays
- **Subjects:** (1) Staring at a blank personal statement? Read this. (2) Your essay is the difference. Here is how to win it.

The blank Google Doc at 11pm is a rite of passage, and also completely avoidable. Strong essays are not about fancy writing, they are about a clear narrative: who you are, why this, why now. We hand you the exact framework our scholars used to break through writer's block and write something a committee actually remembers. Session 4 is built around it, personal statements and scholarship essays, step by step.

### Blocker = school-selection
- **Subjects:** (1) 15 tabs open and no idea which school? Same. (2) How to build a school list that gets you funded.

Picking schools on reputation alone is how smart people waste an entire application cycle. The right list balances reach, match, and fundability, and it is built around your goal, not a rankings website. Session 1 walks you through it, plus you get our Smart School List of 30+ low-tuition universities with high funding rates. Stop guessing, start with a plan.

### Blocker = low-gpa ("my grades feel too low")
- **Subjects:** (1) Your GPA is not your ceiling. (2) A lower grade is a strategy problem, not a dead end.

Here is something we wish more people knew: a lower class does not automatically close the door, it changes the route. Committees read a whole profile, and there are real ways to balance a weaker grade through the right references and the right framing. Programs weigh experience and potential over a single number. Session 2 is all about becoming the candidate they cannot overlook, especially when your transcript is not doing the talking. Your story is bigger than one number.

### Blocker = visa
- **Subjects:** (1) The visa part is scarier in your head than in real life. (2) From offer letter to landing, sorted.

The visa and moving process feels like a black box, which is why people freeze. It is actually a checklist. Documents, timelines, the interview, what to say and what not to. Get it right and it is smooth. Get it wrong and a real offer can slip away. Session 8 takes you from document prep to the visa interview so you step onto campus confident, not panicking.

### Blocker = start ("I don't know where to start")
- **Subjects:** (1) Do not know where to start? Start here. (2) The whole thing, one step at a time.

Not knowing where to begin is the most honest answer you can give, and the most common. The good news is, there is an order to this, and once you see it, the overwhelm lifts. School selection, profile, essays, funding, visa, in the right sequence, with someone walking beside you. That is exactly what the 8 sessions are, start to finish. You do not need to figure it all out on your own.

## Email 4, Day 6: Learn from people who actually did it
- **Subjects:** (1) The people teaching you have the receipts. (2) Chevening, DAAD, Forte, and you. (3) Why this is not another generic webinar.
- **Preview:** Advice from people who actually won the thing.
- **Segment:** All.

Hi {first_name},

There is a lot of grad school advice online, and most of it is written by people who never actually won the scholarship or got the offer. That is the difference here.

The bootcamp is run by people with the receipts: Chevening, DAAD, Mastercard and Forte scholars, MBAs from Columbia, Duke and Kellogg, and admissions and visa specialists who have sat on the other side of the desk.

In 6+ years we have helped over 2,000 people move toward better jobs, top universities, and new countries, with 96% leaving positive reviews. This is not theory. It is the exact playbook from people who walked your path a few years ahead.

You bring the goal. They bring the map.

**[Meet your facilitators]**

Naa and Rosemary from Elevate Career Hub.

## Email 5, Day 9: Is it worth GHS 1,200? Let us do the math
- **Subjects:** (1) Is it worth GHS 1,200? Let us do the math. (2) The most expensive option is doing nothing. (3) About the price.
- **Preview:** And the cheaper way in if you need it.
- **Segment:** All.

Hi {first_name},

Let us talk money, plainly. The full bootcamp is GHS 1,200 right now on early-bird, and it goes back to GHS 1,500 after. I know that is real money. So here is the honest math.

One wasted application cycle, the rejections, the re-takes, the missed scholarship deadlines, costs you a year of your life and far more than GHS 1,200 in application and test fees alone. The bootcamp exists so you do not lose that year.

You also get more than the 8 live sessions: the 50+ scholarship Funding Pack, the 30+ low-tuition school list, 90 days of replays, and a WhatsApp community walking it with you.

And if the full pass is not right today, you do not have to skip everything. Grab a single drop-in session for GHS 300, start with the one that fixes your biggest blocker, and build from there.

**[Lock in early-bird]**  (secondary link: or pick one session)

Naa and Rosemary from Elevate Career Hub.

## Email 6, Day 12: Early-bird is about to close
- **Subjects:** (1) Early-bird closes soon, and seats are going. (2) The price goes up after this. (3) Do not say we did not warn you, {first_name}.
- **Preview:** GHS 1,200 will not last, and neither will the seats.
- **Segment:** All EXCEPT `timeline` = exploring / next-year (suppressed for the slow lane).

Hi {first_name},

Quick, honest heads up. The early-bird price on the Get Into Grad School Bootcamp is about to end, and seats are limited because the sessions are live, not a faceless recording.

After early-bird, the full pass goes from GHS 1,200 back to GHS 1,500. Same bootcamp, more money. There is no reason to pay the later price when you can lock it in now.

You already know which programs and scholarships fit you, we matched you. The only thing between you and actually winning them is the system the bootcamp teaches. The cohort starts 26 July. Future you would really like you to register today.

**[Lock in my seat]**

Naa and Rosemary from Elevate Career Hub.

## Email 7, Day 15: Last call before we start
- **Subjects:** (1) Last call before we start, {first_name}. (2) Doors close on this one. (3) This is the email you do not want to ignore.
- **Preview:** Full pass, drop-in, or the next cohort. Your call.
- **Segment:** All remaining (unconverted).

Hi {first_name},

This is the last nudge, then we will get out of your inbox.

The bootcamp starts 26 July, and registration for this cohort is closing. You took the quiz because some part of you is ready to stop dreaming about grad school and start doing it. This is the move.

Three ways in:
- The full pass at early-bird, everything included, the best value.
- A single drop-in session for GHS 300 if you just want to fix one thing first.
- And if the timing genuinely is not right, reply with "next" and we will hold you a spot in the next cohort.

Whatever you do, choose something. The people who get the offer are simply the ones who started.

**[Register now]**

Cheering you on,
Naa and Rosemary from Elevate Career Hub.

## Modifier inserts (drop into the relevant track)
- **Low grades** (`qualification` = 2:2 or third), add near the top of Email 2 and Email 5: "And before you talk yourself out of this over your grades: a lower class changes the strategy, not the outcome. We have got you."
- **Needs full funding** (`funding` = full, or `budget` = under-5k), add to Email 2: "You do not need rich parents or savings for this. You need the right scholarships and the system to win them, which is exactly what you get."
- **Exploring / next year** (`timeline`): run the slow lane. Stretch cadence to Day 0 / 3 / 7 / 14 / 21, swap hard CTAs for **[Book a free chat]** (`/contact-us/`) and "join the next cohort" framing, and skip Emails 6 and 7. No false urgency.
- **CV uploaded:** insert a Day-2, 1:1, human-sent note (not automated branding): "Hi {first_name}, Naa here. I had a quick look at the CV you sent, one thing jumped out that is costing you. Got 10 minutes this week?" Route to a free chat. This is the hottest segment, treat it like one.

## WhatsApp layer (4 short touches, opt-in)

Read rates here beat email for this audience. Until the WhatsApp Business API / a
BSP is set up, run WA-1 and the CV follow-up as 1:1 from the team, and WA-2/3/4 as
manual broadcasts.

- **WA-1, Day 0 (minutes after signup):** "Hey {first_name}, it is Elevate. Your grad school report just hit your inbox, did it land? Reply with your #1 goal and I will tell you the one session that matters most for you."
- **WA-2, Day 4:** "{first_name}, the #1 scholarship mistake we see: applying to the wrong ones, too late, with a generic essay. The bootcamp fixes exactly that (and you get our 50+ scholarship pack). Want the link?"
- **WA-3, Day 12 (skip for slow lane):** "Heads up, early-bird on the bootcamp ends soon and seats are limited. GHS 1,200 now, GHS 1,500 after. Lock it in: [link]"
- **WA-4, Day 15:** "Last call {first_name}, the cohort starts 26 July and registration is closing. Full pass, a single GHS 300 session, or the next cohort. Which one? [link]"

## Build notes
- Day-0 report already automated in `api/quiz-lead.php`. Build Emails 1 to 7 + the WhatsApp layer in an ESP.
- Export `api/_leads/*.ndjson` (or sync on capture later). Enroll on lead creation. Segment primarily on `reason`; branch on `timeline` (slow lane) and `blocker` (Email 3); personalize with `destination`, `{top_match}`, and the match tiers.
- Exit on registration. Suppress on unsubscribe. Pause automation if they book a free chat (human takes over).
