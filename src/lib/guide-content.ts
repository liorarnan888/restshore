export type GuideSource = {
  label: string;
  href: string;
};

export type GuideLink = {
  label: string;
  href: string;
};

export type GuideIndexSection = {
  title: string;
  description: string;
  links: GuideLink[];
};

export type GuideContent = {
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  lede: string;
  answer: string;
  whyThisHappens: string;
  commonTrap: string;
  practicalGuidance: string;
  howRestShoreHelps: string;
  whenToSeekSupport: string;
  updatedAt: string;
  keywords?: string[];
  keyTakeaways?: string[];
  practicalSteps?: string[];
  noticePoints?: string[];
  relatedLinks: GuideLink[];
  sources: GuideSource[];
};

export type GuideFlow = {
  previous?: GuideLink;
  next?: GuideLink;
  position: number;
  total: number;
};

function prose(...paragraphs: string[]) {
  return paragraphs.join("\n\n");
}

const aasmGuide = {
  label:
    "American Academy of Sleep Medicine: behavioral and psychological treatments for insomnia",
  href: "https://aasm.org/wp-content/uploads/2020/05/Behavioral-Insomnia-SR-05.12.2020-for-public-comment.pdf",
} satisfies GuideSource;

const medlineInsomnia = {
  label: "MedlinePlus: insomnia",
  href: "https://medlineplus.gov/insomnia.html",
} satisfies GuideSource;

const samhsa988 = {
  label: "SAMHSA: 988 crisis support",
  href: "https://www.samhsa.gov/find-help/988/faqs",
} satisfies GuideSource;

export const whatIsCbtiGuide: GuideContent = {
  path: "/what-is-cbti",
  eyebrow: "CBT-I",
  title: "What CBT-I is, in plain language",
  description:
    "What CBT-I means, why people talk about it so often in insomnia care, and how RestShore turns that structure into a practical sleep plan.",
  lede:
    "CBT-I stands for cognitive behavioral therapy for insomnia. In plain language, it is a structured behavioral approach that tries to make sleep steadier by changing timing, bedtime habits, and the way rough nights are handled.",
  answer: prose(
    "CBT-I is not one sleep trick. It is a framework for changing the pattern around insomnia. In practice, that usually means paying attention to wake time, time in bed, what the bed has come to mean emotionally, and what you do after a difficult night.",
    "People often hear the term and imagine a long psychology process or a list of positive thoughts. Some CBT-I work does include the way you relate to the night mentally, but much of the day-to-day work is more concrete than that. It is about structure: when you get up, how much time you spend in bed, how you respond when sleep is not happening, and how to stop turning every night into a performance test.",
    "That is why CBT-I is often described as more useful than generic sleep tips for persistent insomnia patterns. Instead of telling you to 'sleep better,' it gives you a way to make nights more understandable and less chaotic over time.",
  ),
  whyThisHappens: prose(
    "Insomnia often becomes self-reinforcing. The first problem may have been stress, travel, illness, parenting, work pressure, or a schedule disruption. But after enough rough nights, a second layer appears: worry about sleep itself. Bedtime starts to carry tension before the night has even begun.",
    "When that happens, people usually do reasonable things that can accidentally keep the pattern going. They go to bed earlier to catch more sleep, stay in bed longer to recover, check the clock, cancel the next day mentally, or search for the one thing that will finally make tonight different. Those moves make sense emotionally. They just do not always help the sleep system settle.",
  ),
  commonTrap: prose(
    "A common trap is treating sleep like an urgent project. The more effort you pour into solving it in the moment, the more attention and pressure you bring into bed with you. Sleep often responds better to steadier structure than to desperate effort.",
    "Another trap is assuming that one good tip should fix the whole problem. For persistent insomnia, the issue is usually not a missing trick. It is that the overall pattern has become unstable or loaded. That is why people can know a lot about sleep and still feel stuck every night.",
  ),
  practicalGuidance: prose(
    "If you are learning CBT-I ideas for the first time, start by looking for a stable wake anchor and a simpler view of your pattern. You do not need to optimize five variables at once. You need a structure you can keep even after a rough night.",
    "Write down what time you got into bed, roughly when you got up, whether sleep felt slow or broken, and how functional you felt the next day. This helps turn insomnia from a swirl of impressions into something you can actually review.",
  ),
  howRestShoreHelps: prose(
    "RestShore does not try to replace a clinician or claim to deliver therapy. It takes the useful structure around CBT-I and translates it into a behavioral-support format that is easier to start on your own: questionnaire, personal summary, six-week starting plan, and optional calendar guidance.",
    "That matters because many users do not need more theory. They need help turning the theory into something they can follow next Tuesday after a hard night. That translation layer is exactly where RestShore tries to help.",
  ),
  whenToSeekSupport: prose(
    "Behavioral sleep structure is not the right first step for every situation. If your sleep problems include loud snoring, choking, suspected sleep apnea, bipolar-spectrum symptoms, pregnancy or postpartum changes, seizures, sleepwalking, or an acute mental-health crisis, get clinician support before relying on a behavioral sleep plan alone.",
    "If you are exhausted to the point that driving, caregiving, or work safety feels shaky, step out of self-guided experimentation and get outside help. Safety matters more than squeezing one more lesson out of the pattern.",
  ),
  updatedAt: "2026-04-01",
  keywords: ["CBT-I", "cognitive behavioral therapy for insomnia", "sleep coaching"],
  keyTakeaways: [
    "CBT-I is a structured way of changing the insomnia pattern, not just a list of sleep tips.",
    "The goal is usually steadier timing, less bedtime pressure, and a clearer relationship between bed and sleep.",
    "It is most useful when it becomes practical, repeatable, and safe for your actual situation.",
  ],
  practicalSteps: [
    "Choose a wake time you can realistically protect most days this week.",
    "Keep one very short morning record instead of trying to remember the whole night from memory.",
    "Notice which of your nighttime habits are actually attempts to control sleep in the moment.",
    "Treat this as pattern work, not a test that must be won tonight.",
  ],
  noticePoints: [
    "Do you feel more pressure before bed than you do earlier in the evening?",
    "Does staying in bed longer actually help, or does it mostly make the night feel heavier?",
    "Are you reacting to one bad night, or to a pattern that has been repeating for weeks?",
  ],
  relatedLinks: [
    { label: "CBT-I vs sleep hygiene", href: "/guides/cbt-i-vs-sleep-hygiene" },
    { label: "Why a sleep diary helps", href: "/sleep-diary" },
    { label: "How RestShore works", href: "/how-restshore-works" },
  ],
  sources: [aasmGuide, medlineInsomnia, samhsa988],
};

export const sleepDiaryGuide: GuideContent = {
  path: "/sleep-diary",
  eyebrow: "Sleep Diary",
  title: "Why a sleep diary helps",
  description:
    "Why a sleep diary matters, what to track, and how RestShore uses a short morning log to keep guidance tied to real patterns.",
  lede:
    "A sleep diary is not meant to be a perfect record. Its job is to turn a blurry sleep story into a few repeatable signals you can actually use.",
  answer: prose(
    "A sleep diary helps because insomnia is surprisingly hard to remember accurately. Most people retain the emotional weight of the night more clearly than the timing of it. That means the story you tell yourself in the morning can be true emotionally but fuzzy practically.",
    "A diary gives you a calmer baseline. Instead of saying 'I never sleep' or 'last night was a disaster,' you start to see more specific patterns: bedtime drift, early waking, fragmented sleep, weekend sleep-ins, or mornings that feel better than expected even after a rough night.",
    "That pattern view is one of the most useful things a sleep diary can offer. It gives you something to work with besides fear, memory, and guesswork.",
  ),
  whyThisHappens: prose(
    "When sleep is frustrating, the worst nights become the most memorable. People naturally remember the 2 a.m. struggle, the long wake-up, or the terrible morning. What gets lost is how the whole week fits together.",
    "Without a diary, it becomes hard to tell whether the real problem is slow sleep onset, too much time in bed, early morning waking, or a schedule that keeps changing. Different problems can feel the same emotionally, which is why even simple tracking can be clarifying.",
  ),
  commonTrap: prose(
    "The main trap is making the diary too complicated. Once people start logging every feeling, every supplement, every food choice, and every minute, the diary becomes another burden. That is usually the moment it gets abandoned.",
    "Another trap is reading too much into one entry. A diary is useful because it shows trends across several nights. It gets much less helpful when each morning becomes a personal scorecard.",
  ),
  practicalGuidance: prose(
    "For most people, a good diary tracks only the basics: when you got into bed, when you got up, whether sleep felt slow or broken, and how functional you felt in the morning. That is enough to begin seeing shape in the week.",
    "If you review the diary, do it in clusters. Look at three to seven nights together. Ask what is repeating, what is drifting, and what is more stable than it feels in the middle of the night.",
  ),
  howRestShoreHelps: prose(
    "RestShore keeps the morning log intentionally short because a useful log is one that survives tired mornings. The product then looks for repeated patterns before changing future guidance, which helps you avoid reacting dramatically to one bad night.",
    "That also means the diary can stay practical. It is there to support decisions and understanding, not to become another heavy ritual you feel guilty about missing.",
  ),
  whenToSeekSupport: prose(
    "If your diary keeps surfacing loud snoring, choking, major daytime sleepiness, unusual behaviors during sleep, or anything that feels unsafe, pause the self-guided layer and talk with a clinician instead.",
    "Tracking can be helpful, but it is not the same as evaluation. A diary should never become a reason to ignore warning signs that point toward a broader sleep or health issue.",
  ),
  updatedAt: "2026-04-01",
  keywords: ["sleep diary", "sleep log", "sleep tracking"],
  keyTakeaways: [
    "A diary is useful because it shows patterns, not because it is perfectly accurate.",
    "Short, repeatable logging is usually better than detailed logging that collapses after three days.",
    "Interpret several nights together instead of turning each morning into a verdict.",
  ],
  practicalSteps: [
    "Track bedtime, wake time, whether sleep was slow or broken, and how functional you feel in the morning.",
    "Keep the logging window short enough that you can finish it in a minute or two.",
    "Review the week for patterns in timing, not just the worst emotional moments.",
    "Use the diary to support decisions, not to argue with yourself about the night.",
  ],
  noticePoints: [
    "Do bad nights cluster after schedule drift, later wake times, or stressful evenings?",
    "Are weekends helping your recovery, or quietly making Monday night harder?",
    "Is the main issue actually 'not sleeping,' or is it a more specific pattern such as early waking or sleep fragmentation?",
  ],
  relatedLinks: [
    { label: "How to use a sleep diary", href: "/guides/how-to-use-a-sleep-diary" },
    { label: "How to build a sleep schedule", href: "/guides/how-to-build-a-sleep-schedule" },
    { label: "When falling asleep feels like work", href: "/trouble-falling-asleep" },
  ],
  sources: [aasmGuide, medlineInsomnia, samhsa988],
};

export const troubleFallingAsleepGuide: GuideContent = {
  path: "/trouble-falling-asleep",
  eyebrow: "Falling Asleep",
  title: "When falling asleep feels like work",
  description:
    "A calmer look at why falling asleep can feel hard and how RestShore approaches wake anchors, bedtime effort, and sleep-window structure.",
  lede:
    "Trouble falling asleep often gets worse when bedtime starts to feel like a test. The more the night feels high-stakes, the harder it becomes to let sleep happen.",
  answer: prose(
    "Difficulty falling asleep is rarely just about 'not being tired enough.' It is often a mix of timing, alertness, learned anticipation, and pressure. After enough rough nights, the bed itself can start to feel like the place where the struggle begins.",
    "That is why people can feel sleepy on the couch, then fully awake the moment they get into bed. The issue is not always a lack of tiredness. Sometimes it is that the night has become emotionally loaded and the body has learned to stay vigilant there.",
    "This can improve, but it usually improves through pattern changes rather than through forcing yourself to relax harder.",
  ),
  whyThisHappens: prose(
    "After repeated trouble falling asleep, bedtime becomes a checkpoint. You start scanning your state, checking whether you feel sleepy enough, worrying about tomorrow, and monitoring how fast sleep is arriving. That monitoring can make the nervous system more alert instead of less.",
    "The schedule often plays a role too. Going to bed much earlier after a bad night, napping more, or sleeping in later can reduce sleep pressure by evening. Then the body is not ready when the mind desperately wants it to be ready.",
  ),
  commonTrap: prose(
    "The most common trap is expanding the bedtime window in response to insomnia. It feels sensible to get into bed earlier to recover. But more time in bed can mean more time awake in the exact place you want sleep to feel natural.",
    "Another trap is building a giant pre-sleep performance routine. Wind-down can help, but when the routine becomes one more thing that has to work, it can start feeding the same pressure it was supposed to reduce.",
  ),
  practicalGuidance: prose(
    "Start with the repeatable pieces: a steadier wake time, a more realistic bedtime target, and a wind-down that lowers stimulation without becoming a project. The goal is not to create the perfect night. It is to make the night less loaded and more predictable.",
    "If you cannot fall asleep, the most useful question is often not 'How do I knock myself out right now?' but 'What pattern am I teaching with my schedule and my response to this moment?' That shift changes how you treat the night.",
  ),
  howRestShoreHelps: prose(
    "RestShore turns these ideas into a structured starting plan instead of leaving them as theory. The output gives you a wake anchor, a bedtime target, and an optional calendar layer so you are not holding the whole plan in your head when you are already tired.",
    "It also keeps the framing calmer. A difficult onset night does not automatically mean the plan is broken. The product is built around repeated patterns rather than panic about single nights.",
  ),
  whenToSeekSupport: prose(
    "If falling asleep difficulty comes with mania symptoms, a major mental-health flare-up, exhaustion that is creating safety risks, or a complicated medication situation, get outside support before leaning on self-guided changes alone.",
    "The question is not whether the night is frustrating enough. It is whether anything in the bigger picture makes self-directed schedule changes an unsafe first move.",
  ),
  updatedAt: "2026-04-01",
  keywords: ["trouble falling asleep", "can't fall asleep", "bedtime anxiety"],
  keyTakeaways: [
    "Slow sleep onset often reflects pressure, timing, and learned alertness around bed, not just tiredness.",
    "Going to bed earlier is understandable, but it can make the problem heavier for some people.",
    "A calmer, more repeatable schedule usually helps more than bedtime heroics.",
  ],
  practicalSteps: [
    "Protect wake time before you start redesigning bedtime.",
    "Keep your wind-down simple enough that it lowers stimulation without becoming another performance test.",
    "Notice whether you are trying to 'win tonight' instead of supporting the pattern for the week.",
    "If a night goes badly, avoid rebuilding the whole schedule the next morning.",
  ],
  noticePoints: [
    "Do you start monitoring yourself the moment bedtime begins?",
    "Are later wake times or naps quietly lowering sleep pressure by night?",
    "Does the hardest part feel like tiredness, or does it feel more like pressure and vigilance?",
  ],
  relatedLinks: [
    { label: "Sleep anxiety at night", href: "/guides/sleep-anxiety-at-night" },
    { label: "How to build a sleep schedule", href: "/guides/how-to-build-a-sleep-schedule" },
    { label: "Stimulus control for insomnia", href: "/guides/stimulus-control-for-insomnia" },
  ],
  sources: [aasmGuide, medlineInsomnia, samhsa988],
};

export const wakeTimeProblemsGuide: GuideContent = {
  path: "/wake-time-problems",
  eyebrow: "Wake Time",
  title: "Why wake time matters more than most people expect",
  description:
    "Why wake time drift can keep nights unstable and how RestShore uses wake anchors to support a steadier rhythm.",
  lede:
    "When sleep is messy, most people focus on bedtime first. But the morning often teaches the body clock more clearly than the evening does.",
  answer: prose(
    "Wake time matters because it helps anchor the whole sleep pattern. It influences how much sleep pressure builds through the day and gives your body clock a more stable signal than an inconsistent bedtime usually can.",
    "That is why people can keep trying to fix the night while quietly undoing progress in the morning. A few extra hours after a bad night feel like recovery, but they can also make it harder to feel ready for sleep the next evening.",
    "The point is not rigid perfection. It is that a realistic, repeatable wake anchor often gives the rest of the plan something solid to grow from.",
  ),
  whyThisHappens: prose(
    "After poor sleep, sleeping in feels rational. You are tired, you want relief, and the morning is the only place that seems negotiable. But the body often 'learns' more from the time you get up than from the time you hope sleep will start.",
    "Wake time drift is also easy to miss because it feels small day to day. Thirty minutes here, ninety minutes on the weekend, an extra hour after a brutal night. But over time, that drift can make the entire week feel less stable.",
  ),
  commonTrap: prose(
    "A common trap is treating wake time as optional while treating bedtime as sacred. That often creates a setup where the evening feels disciplined but the rhythm underneath keeps moving.",
    "Another trap is trying to recover from every bad night immediately. Recovery sounds wise, but when it takes the form of large schedule swings, it can keep the pattern muddy and harder to work with.",
  ),
  practicalGuidance: prose(
    "Pick a wake time that is realistic for your actual life, not an aspirational version of it. Protect it most days. Use light, movement, and getting out of bed promptly as the first signals of the day.",
    "You do not need a punishing morning routine. You need a consistent enough morning that the rest of the day starts organizing around it. That is often more helpful than another evening trick.",
  ),
  howRestShoreHelps: prose(
    "RestShore builds the plan from the wake anchor outward. That makes the schedule easier to understand because bedtime, wind-down, and future adjustments all sit on top of a clear reference point.",
    "This is also where the optional calendar can help. A wake anchor becomes more real when it lives in the week you are actually trying to keep, not only in a summary you read once.",
  ),
  whenToSeekSupport: prose(
    "If your schedule is dominated by rotating shifts, pregnancy or postpartum changes, seizures, or any other factor that makes timing changes riskier, pause and get clinician guidance before making major adjustments.",
    "The rule of thumb is simple: if wake-time consistency is hard because life is chaotic, behavioral support may still help. If it is hard because there may be a broader health or safety issue, get help first.",
  ),
  updatedAt: "2026-04-01",
  keywords: ["wake time", "wake anchor", "sleep schedule"],
  keyTakeaways: [
    "Wake time is often the most practical anchor for rebuilding a messy sleep pattern.",
    "Sleeping in after bad nights can feel restorative while quietly making the next night harder.",
    "A realistic, protected wake time helps the rest of the schedule make sense.",
  ],
  practicalSteps: [
    "Choose a wake time that you can hold on weekdays and most weekends.",
    "Get out of bed promptly rather than negotiating with the morning for another block of sleep.",
    "Use light and movement early when possible to reinforce the transition into daytime.",
    "Judge the pattern across the week instead of by one punishing morning.",
  ],
  noticePoints: [
    "How much does wake time shift after a bad night?",
    "Do weekends reset you, or do they make Sunday and Monday harder?",
    "Is bedtime the real problem, or is the whole 24-hour rhythm drifting underneath it?",
  ],
  relatedLinks: [
    { label: "How to build a sleep schedule", href: "/guides/how-to-build-a-sleep-schedule" },
    { label: "What to do when you keep waking up too early", href: "/guides/waking-up-too-early" },
    { label: "A calmer way to think about insomnia support", href: "/insomnia-support" },
  ],
  sources: [aasmGuide, medlineInsomnia, samhsa988],
};

export const insomniaSupportGuide: GuideContent = {
  path: "/insomnia-support",
  eyebrow: "Insomnia Support",
  title: "A calmer way to think about insomnia support",
  description:
    "A consumer-first overview of insomnia support, when structured behavioral coaching may help, and how RestShore fits into a non-medical workflow.",
  lede:
    "People looking for insomnia support are often tired, overloaded, and wary of one more product that overpromises. A useful starting point is structure, clarity, and less panic around each night.",
  answer: prose(
    "Useful insomnia support usually starts by lowering chaos, not by promising a miracle. People often need a way to understand what pattern they are in, what they can do safely, and what would count as a meaningful next step.",
    "That is especially true once sleep has become emotionally heavy. By that point, advice alone can feel insulting because the person already knows plenty of tips. What they are missing is a structure that is concrete enough to follow when they are tired and discouraged.",
    "In that sense, good support is often less about novelty and more about making the basics usable again.",
  ),
  whyThisHappens: prose(
    "Insomnia tends to spread. It starts with the night, then it affects mood, planning, work, caregiving, confidence, and the way you think about tomorrow. The longer it goes on, the more every new suggestion can feel like one more test you may fail.",
    "That is why support needs to be calm and practical. People struggling with sleep are not usually helped by louder promises. They are helped by clearer structure and honest limits.",
  ),
  commonTrap: prose(
    "A common trap is bouncing between supplements, bedtime hacks, podcasts, devices, and contradictory internet advice without building a simple pattern view first. That can create motion without progress.",
    "Another trap is choosing support that speaks with more certainty than the real situation deserves. If the message sounds like a cure, it is often a sign to slow down and look for something more honest.",
  ),
  practicalGuidance: prose(
    "A solid support starting point is a wake anchor, a short morning log, and one clear evening boundary. That may sound small, but small repeatable structure is often more useful than a huge list of recommendations you cannot sustain.",
    "Try to define what would count as progress for you. Less panic at bedtime? Fewer schedule swings? A clearer summary you can review? Better mornings? Progress is easier to notice when it is named in advance.",
  ),
  howRestShoreHelps: prose(
    "RestShore is positioned as behavioral support, not medical care. It uses intake answers to build a starting plan, a structured sleep summary, and optional calendar guidance that helps the plan live in daily life instead of sitting in a forgotten document.",
    "The product is designed for people who want calmer structure and clearer follow-through. It is not designed to diagnose what is wrong or replace clinician judgment when safety flags are present.",
  ),
  whenToSeekSupport: prose(
    "If insomnia is sitting next to loud snoring or choking, crisis symptoms, mania history, major fatigue safety concerns, or other health issues that make schedule changes risky, clinician help should come before self-guided behavioral work.",
    "The right question is not just 'Do I have insomnia?' It is 'Is there anything about my situation that makes generic behavioral support the wrong first move?'",
  ),
  updatedAt: "2026-04-01",
  keywords: ["insomnia support", "sleep coaching", "sleep structure"],
  keyTakeaways: [
    "Support is most useful when it replaces chaos with structure, not when it promises a cure.",
    "The best starting point is often smaller and calmer than people expect.",
    "A product like RestShore should help with clarity and follow-through, not pretend to be diagnosis or emergency help.",
  ],
  practicalSteps: [
    "Decide what kind of support you actually need right now: explanation, structure, follow-through, or safety screening.",
    "Build around one wake anchor and one short morning log before layering more tactics on top.",
    "Treat bedtime advice skeptically if it sounds dramatic or guaranteed.",
    "Get clinician help first if warning signs or safety concerns are part of the picture.",
  ],
  noticePoints: [
    "Are you looking for more tips, or are you actually missing structure?",
    "Does the support you are using make you feel calmer and clearer, or more pressured and confused?",
    "What would meaningful progress look like over the next two weeks, not just tonight?",
  ],
  relatedLinks: [
    { label: "What CBT-I is", href: "/what-is-cbti" },
    { label: "Who RestShore is for", href: "/who-restshore-is-for" },
    { label: "How RestShore works", href: "/how-restshore-works" },
  ],
  sources: [aasmGuide, medlineInsomnia, samhsa988],
};

export const whoRestShoreIsForGuide: GuideContent = {
  path: "/who-restshore-is-for",
  eyebrow: "Fit and Safety",
  title: "Who RestShore is for, and when not to use it alone",
  description:
    "Who RestShore is designed for, who should seek clinician clearance first, and what the product does and does not do.",
  lede:
    "RestShore is built for adults who want structured behavioral sleep support. It is not for emergencies, it is not diagnosis, and it is not a substitute for a clinician when safety flags are present.",
  answer: prose(
    "RestShore is for adults who want help turning behavioral sleep ideas into a practical plan. It is designed for people who are looking for structure, follow-through, and a calmer way to understand their sleep pattern without starting from a medical-treatment claim.",
    "It is not designed to diagnose a condition, replace a clinician, or stand in for emergency support. The product has a lane, and staying honest about that lane is part of making it useful and safe.",
    "In practice, that means some users are a good fit for self-guided behavioral support and some need outside clearance first. The difference matters.",
  ),
  whyThisHappens: prose(
    "Sleep problems do not exist in a vacuum. They can sit next to suspected sleep apnea, parasomnias, seizure disorders, pregnancy or postpartum changes, medication issues, or mental-health conditions that make do-it-yourself schedule changes riskier.",
    "A lot of products blur that line because it is more marketable to sound universal. RestShore should not do that. A useful product in this area needs to be clear about where self-guided support stops and professional evaluation should begin.",
  ),
  commonTrap: prose(
    "A common trap is assuming that because a plan is 'behavioral' it must be safe for everyone. That is not true. Even sensible schedule changes can be the wrong move if the bigger picture includes red flags or a crisis context.",
    "Another trap is using a product because it feels easier than asking for help, even when the situation clearly calls for clinical evaluation. Ease is not the same thing as fit.",
  ),
  practicalGuidance: prose(
    "Use RestShore if you want educational, structured support and your situation feels appropriate for self-guided behavioral work. Read the safety framing carefully, take warning signs seriously, and do not treat the product as a substitute for judgment.",
    "If your picture includes red flags or medically complicated features, the practical next step is not more experimentation. It is getting clinician guidance first and returning to behavioral support only if it still fits.",
  ),
  howRestShoreHelps: prose(
    "For the right users, RestShore can make a big difference in clarity. It turns answers into a personal plan, a shareable summary, and optional calendar guidance. That helps users move from vague intention to something they can actually follow.",
    "For the wrong users, the right product behavior is not more persuasion. It is route-out, caution, and honesty about limits.",
  ),
  whenToSeekSupport: prose(
    "Do not rely on RestShore alone if you have loud snoring or choking, suspected sleep apnea, bipolar-spectrum symptoms or mania history, seizures, severe sleepwalking or parasomnias, pregnancy or recent postpartum changes, frequent prescription sleep medication use, or an acute mental-health crisis.",
    "In the United States, call or text 988 if there is crisis risk. If you are outside the United States, use local emergency or crisis support rather than waiting for a product workflow to help.",
  ),
  updatedAt: "2026-04-01",
  keywords: ["sleep support safety", "who sleep coaching is for", "behavioral sleep support"],
  keyTakeaways: [
    "RestShore is for adults seeking behavioral structure, not diagnosis or emergency help.",
    "Fit matters as much as interest. Some sleep situations need clinician clearance first.",
    "A good health-adjacent product should route people out when safety flags are present.",
  ],
  practicalSteps: [
    "Pause and check whether your sleep problem includes any of the listed red flags before starting self-guided work.",
    "Use the product for structure and clarity, not as a replacement for clinical judgment.",
    "If you are unsure whether you are a fit, err toward asking for help rather than pushing forward alone.",
    "Treat adult-only and safety boundaries as product design choices that protect you, not as legal filler.",
  ],
  noticePoints: [
    "Are you looking for help with routine and follow-through, or with diagnosis and medical decisions?",
    "Do any symptoms in your picture suggest another condition that needs evaluation first?",
    "Would you feel comfortable sharing your sleep situation with a clinician if you needed to?",
  ],
  relatedLinks: [
    { label: "Insomnia support", href: "/insomnia-support" },
    { label: "How RestShore works", href: "/how-restshore-works" },
    { label: "Start the questionnaire", href: "/start" },
  ],
  sources: [medlineInsomnia, samhsa988],
};

export const howRestShoreWorksGuide: GuideContent = {
  path: "/how-restshore-works",
  eyebrow: "How It Works",
  title: "How RestShore turns answers into a practical sleep plan",
  description:
    "How RestShore works, what the questionnaire produces, and how the optional calendar fits into the product.",
  lede:
    "RestShore is built to turn sleep answers into something more usable than scattered advice. The goal is a plan you can actually follow, not a wall of theory.",
  answer: prose(
    "RestShore starts with a guided questionnaire and turns the answers into a structured summary, a six-week starting plan, and optional calendar guidance. The product is designed to answer a common problem: even when people understand sleep advice, they often do not know how to carry it into ordinary life.",
    "That is why Google is optional and appears later. The calendar is not the product's definition of value. It is one way of helping the plan become real in a week that already contains work, family, mornings, setbacks, and bad nights.",
    "The core promise is practical structure. The calendar is there to support that structure if you want it.",
  ),
  whyThisHappens: prose(
    "A lot of sleep advice dies in translation. People hear a principle, agree with it, and then immediately run into the harder question: what does that actually mean for my bedtime, my wake time, tomorrow morning, or the next weekend?",
    "That translation gap is especially painful when sleep already feels emotionally expensive. It is hard to build a plan from scratch when you are tired, frustrated, and second-guessing every decision.",
  ),
  commonTrap: prose(
    "A common trap is assuming that understanding a principle is the same thing as being able to use it under pressure. It usually is not. Nights get hard precisely when your best intentions become the hardest to remember clearly.",
    "Another trap is thinking a calendar by itself solves the problem. A calendar helps only if the structure inside it is personal and believable in the first place.",
  ),
  practicalGuidance: prose(
    "The practical next step is simple: start with the questionnaire, review the generated summary carefully, and decide whether the calendar layer would make the plan easier to follow in your real week.",
    "You do not need to commit to every part at once. The summary alone may help you clarify the pattern. The calendar may become useful once you want the structure to show up in daily life without needing to remember it all.",
  ),
  howRestShoreHelps: prose(
    "RestShore is built around a translation problem. It takes a CBT-I-inspired structure and turns it into something readable, personal, and actionable. That includes a summary you can revisit, a six-week arc that gives time shape, and optional Google Calendar support for people who want it.",
    "The system is also designed to avoid overreacting. Future guidance changes are meant to respond to repeated patterns, not one bad night that makes everything feel broken.",
  ),
  whenToSeekSupport: prose(
    "If your sleep situation includes medical red flags, crisis symptoms, or a complicated health picture that makes schedule changes feel risky, use RestShore only after clinician guidance or skip self-guided work entirely and seek help directly.",
    "A helpful product has to know its lane. In RestShore's case, that lane is behavioral support and practical structure, not diagnosis or emergency response.",
  ),
  updatedAt: "2026-04-01",
  keywords: ["how RestShore works", "sleep plan", "calendar sleep support"],
  keyTakeaways: [
    "RestShore turns answers into a summary, a six-week starting plan, and optional calendar support.",
    "Google Calendar is a support layer, not a requirement to begin.",
    "The product is trying to solve the translation gap between advice and real life.",
  ],
  practicalSteps: [
    "Start with the questionnaire before deciding whether you want Google Calendar in the loop.",
    "Read the summary as a pattern explanation, not as a grade on your sleep.",
    "Use the calendar only if it will make follow-through easier in your real schedule.",
    "Pay attention to which parts of the plan feel immediately practical and which feel like they may need support.",
  ],
  noticePoints: [
    "Do you need more explanation, or do you mostly need a way to follow through?",
    "Would the plan help enough as a summary alone, or would calendar structure make it easier to keep?",
    "Which parts of the plan feel clear enough to start this week?",
  ],
  relatedLinks: [
    { label: "What CBT-I is", href: "/what-is-cbti" },
    { label: "Who RestShore is for", href: "/who-restshore-is-for" },
    { label: "Start the questionnaire", href: "/start" },
  ],
  sources: [aasmGuide, medlineInsomnia],
};

export const guideLibrary: Record<string, GuideContent> = {
  "cbt-i-vs-sleep-hygiene": {
    path: "/guides/cbt-i-vs-sleep-hygiene",
    eyebrow: "Guide",
    title: "CBT-I vs sleep hygiene: what is the difference?",
    description:
      "What sleep hygiene can and cannot do, how it differs from CBT-I, and when a structured plan may help more.",
    lede:
      "Sleep hygiene and CBT-I are not the same thing. Sleep hygiene is usually about general habits, while CBT-I is a more structured behavioral approach to the pattern underneath insomnia.",
    answer: prose(
      "Sleep hygiene is a collection of general habits that can support better sleep: light, caffeine boundaries, winding down, bedroom environment, and regularity. CBT-I is different. It is a structured approach for persistent insomnia patterns, especially when good habits alone have not changed the night.",
      "That distinction matters because people are often told to work harder on sleep hygiene when what they really need is a clearer approach to timing, wake anchors, time in bed, and what to do when the night goes off the rails.",
      "So the practical difference is this: sleep hygiene supports the environment around sleep. CBT-I tries to change the pattern that is keeping insomnia stuck.",
    ),
    whyThisHappens: prose(
      "Sleep hygiene is easy to explain, easy to recommend, and usually low-risk. That makes it the first thing many people hear. But persistent insomnia can keep going even when the room is dark, the phone is away, and the tea is caffeine-free.",
      "When that happens, repeating the same list of habits can start to feel invalidating. The person is not failing to dim the lights. They are dealing with a pattern that needs more structure than a list can provide.",
    ),
    commonTrap: prose(
      "The most common trap is assuming that because sleep hygiene is helpful, more intense effort at those habits must solve the whole problem. Sometimes that just produces a cleaner bedroom and a more frustrated person.",
      "Another trap is throwing sleep hygiene away completely once you learn about CBT-I. General habits still matter. They just work best as background support, not as the whole strategy.",
    ),
    practicalGuidance: prose(
      "Use sleep hygiene to lower friction around sleep: light, caffeine timing, stimulation boundaries, and a gentler evening. Then ask whether the bigger issue is actually schedule drift, bedtime pressure, or the way the night is being handled.",
      "If the problem has become persistent, do not stop at habits. Start looking for pattern-level structure as well.",
    ),
    howRestShoreHelps: prose(
      "RestShore sits closer to the structure side than to the tip-list side. It does not ignore habits, but it turns answers into a plan that includes timing, wake anchors, a summary of your pattern, and optional calendar support.",
      "That makes it a better fit for users who do not need more generic advice so much as a practical framework they can actually follow.",
    ),
    whenToSeekSupport: prose(
      "If persistent sleep problems come with health or mental-health warning signs, clinician input matters more than upgrading from one set of internet sleep tips to another.",
      "Pattern work can help a lot, but it still has to live inside the reality of the person's full situation.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["CBT-I vs sleep hygiene", "sleep hygiene", "CBT-I"],
    keyTakeaways: [
      "Sleep hygiene supports sleep, but it does not always solve persistent insomnia by itself.",
      "CBT-I is more about structure and pattern than about collecting more habits.",
      "For many users, the real shift is moving from general advice to a plan.",
    ],
    practicalSteps: [
      "Keep the useful habits, but stop expecting them to solve every sleep pattern alone.",
      "Ask whether your issue is mainly environment, or whether it is timing and pressure.",
      "Look for wake-anchor and bedtime-structure problems before adding more bedtime rituals.",
      "Treat hygiene as support, not the full intervention.",
    ],
    noticePoints: [
      "Have you actually implemented sleep hygiene consistently, or mostly thought about it?",
      "If you have implemented it, what still feels stuck underneath?",
      "Does your current plan help with the pattern, or only with the atmosphere around bedtime?",
    ],
    relatedLinks: [
      { label: "What CBT-I is", href: "/what-is-cbti" },
      { label: "How to build a sleep schedule", href: "/guides/how-to-build-a-sleep-schedule" },
      { label: "Insomnia support", href: "/insomnia-support" },
    ],
    sources: [aasmGuide, medlineInsomnia],
  },
  "how-to-build-a-sleep-schedule": {
    path: "/guides/how-to-build-a-sleep-schedule",
    eyebrow: "Guide",
    title: "How to build a sleep schedule you can actually follow",
    description:
      "A practical guide to building a sleep schedule around wake time, realistic timing, and less bedtime guesswork.",
    lede:
      "A sleep schedule only helps if it fits real life. The goal is not a perfect spreadsheet. It is a structure you can hold even after a bad night.",
    answer: prose(
      "A workable sleep schedule usually starts from wake time, not from an imagined ideal bedtime. Wake time is often the most stable lever you have, and it helps the rest of the day organize around something real.",
      "From there, the question becomes: what bedtime target is realistic enough that you can keep it without spending huge amounts of extra time awake in bed? A schedule works when it is credible, not when it looks ambitious on paper.",
      "The best schedule is often the one that feels slightly boring. Boring schedules are easier to repeat, and repetition is what gives the pattern a chance to settle.",
    ),
    whyThisHappens: prose(
      "People often design sleep schedules around the amount of sleep they wish they were getting instead of the pattern they are actually living. That creates plans that look generous but fall apart as soon as the first difficult night arrives.",
      "Schedules also break because they ignore real-life friction. Commutes, caregiving, social life, work emails, and fatigue all matter. If the plan cannot survive ordinary life, it was never truly a plan.",
    ),
    commonTrap: prose(
      "The biggest trap is building a schedule that only works if tonight goes perfectly. Those schedules collapse fast because insomnia is rarely polite enough to cooperate on demand.",
      "Another trap is treating weekends like a total exception. A little flexibility can be fine. A full weekly reset often makes the whole schedule feel theoretical.",
    ),
    practicalGuidance: prose(
      "Pick a wake time you can realistically keep most days. Then set a bedtime target that gives the evening shape without turning the bed into a place where you wait for hours. Start simple and let the pattern teach you what needs adjusting.",
      "If a rough night happens, try to preserve the skeleton of the schedule. The more the schedule survives difficulty, the more useful it becomes.",
    ),
    howRestShoreHelps: prose(
      "RestShore takes schedule decisions out of guesswork mode. It builds around wake anchors, a personal summary of your pattern, and optional calendar support so the schedule is easier to see and follow across the week.",
      "That matters because a schedule is not just a bedtime. It is a repeatable agreement with your week, and many people need help making that agreement concrete.",
    ),
    whenToSeekSupport: prose(
      "If shift work, severe exhaustion, pregnancy or postpartum changes, or medical concerns make schedule changes feel risky, get clinician guidance first. A sleep schedule is helpful only when it is safe to implement.",
      "The more a person's life contains non-negotiable timing disruptions or health risks, the more important outside guidance becomes.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["sleep schedule", "wake anchor", "bedtime schedule"],
    keyTakeaways: [
      "Start with wake time, not bedtime fantasy.",
      "A credible schedule beats an ambitious one that collapses after one bad night.",
      "Real-life follow-through matters more than a beautiful plan on paper.",
    ],
    practicalSteps: [
      "Choose a wake time that fits your real obligations.",
      "Set a bedtime target that feels sustainable, not heroic.",
      "Keep the schedule simple enough that weekends and bad nights do not erase it.",
      "Review the pattern after several days rather than rewriting it daily.",
    ],
    noticePoints: [
      "Which part of your week most often breaks the schedule?",
      "Are you trying to recover with more time in bed instead of more consistency?",
      "Does the schedule still make sense after a hard night, or only after a good one?",
    ],
    relatedLinks: [
      { label: "Wake time problems", href: "/wake-time-problems" },
      { label: "Why a sleep diary helps", href: "/sleep-diary" },
      { label: "How RestShore works", href: "/how-restshore-works" },
    ],
    sources: [aasmGuide, medlineInsomnia],
  },
  "waking-up-in-the-night": {
    path: "/guides/waking-up-in-the-night",
    eyebrow: "Guide",
    title: "What to do when you keep waking up in the night",
    description:
      "Why sleep fragmentation happens, what usually makes it worse, and how a calmer structure can help.",
    lede:
      "Waking up in the night can feel random, but it often follows a pattern. The goal is to reduce the loop that makes awakenings feel longer, more threatening, and harder to recover from.",
    answer: prose(
      "Night waking is common, but persistent fragmentation can become exhausting because it makes the whole night feel fragile. The problem is often not only the waking itself. It is what the waking has come to mean emotionally and how the rest of the pattern supports or worsens it.",
      "Once a person starts expecting the wake-up, the night can become more vigilant. A brief awakening turns into clock-checking, frustration, or decision-making about tomorrow. That extra activation can make the wake period longer and more memorable.",
      "The encouraging part is that the pattern around fragmented sleep is often more changeable than it feels in the middle of the night.",
    ),
    whyThisHappens: prose(
      "Fragmented sleep can be shaped by schedule, stress, conditioned alertness, too much time in bed, or other sleep and health issues. That is why the broader picture matters. A wake-up at 2:30 a.m. is not automatically the same kind of problem for every person.",
      "It also feels random because people remember the awakenings vividly and forget the surrounding pattern. Looking only at the most painful moment can hide the role of wake time, bedtime drift, or over-recovery after bad nights.",
    ),
    commonTrap: prose(
      "A common trap is treating every awakening like an emergency. Reaching for the phone, changing the next day immediately, or trying to force sleep back can make the wake period feel more loaded than it already is.",
      "Another trap is assuming that one more comfort behavior in bed will solve the issue. Sometimes it helps in the moment. Sometimes it teaches the brain that bed is also the place for worry, planning, and wakefulness.",
    ),
    practicalGuidance: prose(
      "Start by supporting the bigger pattern: wake anchor, realistic sleep window, and a calmer approach to awakenings. The less every wake-up becomes a personal crisis, the easier it is for the pattern to soften over time.",
      "Try to interpret awakenings in context. Was the whole week fragmented? Did bedtime drift? Did sleep pressure weaken? The broader pattern often tells you more than the single wake period does.",
    ),
    howRestShoreHelps: prose(
      "RestShore is built to keep a fragmented night inside a larger structure. Instead of assuming one bad wake-up means everything should change, it watches for repeated patterns before future guidance shifts.",
      "That can be especially helpful for people who feel tempted to reinvent the whole plan every morning after broken sleep.",
    ),
    whenToSeekSupport: prose(
      "If awakenings come with choking, gasping, severe daytime sleepiness, unusual movements, parasomnias, or other signs that point toward another sleep disorder, clinician input should come before self-guided experimentation.",
      "The point is not to ignore awakenings. It is to recognize when they are part of a broader health picture rather than simply a routine insomnia pattern.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["waking up in the night", "sleep maintenance insomnia", "broken sleep"],
    keyTakeaways: [
      "The wake-up itself matters, but the pattern around it matters just as much.",
      "Expecting the wake-up can make it feel more threatening and more memorable.",
      "It helps to respond to fragmentation as a repeated pattern, not as a nightly emergency.",
    ],
    practicalSteps: [
      "Support the schedule first: wake anchor, realistic bedtime, and reduced overnight stimulation.",
      "Avoid turning each wake-up into a moment of evaluation and planning.",
      "Review fragmentation across several nights instead of over-interpreting one event.",
      "Watch for warning signs that suggest another sleep disorder may need evaluation.",
    ],
    noticePoints: [
      "Do awakenings cluster after schedule drift or heavier bedtime pressure?",
      "What do you tend to do during a wake period that may keep the brain more alert?",
      "Does the night feel fragmented in general, or is there a more specific pattern to the timing?",
    ],
    relatedLinks: [
      { label: "Waking up too early", href: "/guides/waking-up-too-early" },
      { label: "Why wake time matters more than most people expect", href: "/wake-time-problems" },
      { label: "A calmer way to think about insomnia support", href: "/insomnia-support" },
    ],
    sources: [aasmGuide, medlineInsomnia, samhsa988],
  },
  "sleep-restriction-therapy": {
    path: "/guides/sleep-restriction-therapy",
    eyebrow: "Guide",
    title: "What sleep restriction therapy is, in plain language",
    description:
      "A plain-language guide to sleep restriction therapy, why it can help some people, and why safety matters.",
    lede:
      "Sleep restriction therapy is one of the most misunderstood parts of CBT-I. It is not about punishing yourself with less sleep. It is about creating a tighter, more reliable sleep window when it is appropriate and safe.",
    answer: prose(
      "Sleep restriction therapy is better understood as sleep-window tightening. The idea is that if someone has been spending a lot of time in bed but sleeping inconsistently, a more deliberate window can sometimes make sleep feel more consolidated and predictable.",
      "That does not mean it is pleasant at first, and it definitely does not mean it is a universal do-it-yourself move. The early stages can increase tiredness, which is why safety and fit matter so much.",
      "So the plain-language definition is this: it is a structured way of reducing excess time in bed in order to rebuild a more coherent sleep pattern, but only when that approach is appropriate for the person.",
    ),
    whyThisHappens: prose(
      "When sleep is unreliable, people usually expand time in bed to recover. The intention is understandable: go to bed earlier, stay in bed later, and hope the body catches up. For some insomnia patterns, that increases time awake in bed and blurs the pattern further.",
      "Sleep-window tightening tries to respond to that specific problem. Instead of giving the night more room, it tries to make the timing clearer and the sleep period denser. That is why it shows up in CBT-I conversations so often.",
    ),
    commonTrap: prose(
      "The biggest trap is copying this idea from the internet as if it were a challenge or discipline test. It is not. If you have red flags, heavy fatigue, safety-sensitive responsibilities, or a complicated health picture, this approach can be the wrong move.",
      "Another trap is taking the concept too literally and pushing harder than the situation can safely support. More restriction is not automatically better. The goal is coherence, not self-punishment.",
    ),
    practicalGuidance: prose(
      "If you are learning about sleep restriction therapy, start with the concept before the tactic. Understand why too much time in bed can be part of the problem, and why a tighter window sometimes helps. Do not jump straight to self-experimentation if you do not know whether you are a safe fit.",
      "Often the most useful first step is not to restrict aggressively. It is to build a clearer diary, a steadier wake anchor, and a better understanding of your current pattern.",
    ),
    howRestShoreHelps: prose(
      "RestShore uses a cautious behavioral-support framing and does not ask users to invent timing changes from scratch. The product is designed to keep the plan explicit, readable, and bound by safety language rather than turning sleep-window ideas into a macho self-optimization exercise.",
      "That matters because the people most drawn to this concept are often the people already trying very hard. The product should calm that tendency, not intensify it.",
    ),
    whenToSeekSupport: prose(
      "Do not rely on self-guided sleep restriction if you have loud snoring, suspected sleep apnea, bipolar-spectrum symptoms, seizures, parasomnias, pregnancy or postpartum changes, regular overnight shift work, or major fatigue-related safety concerns.",
      "If you are already barely functioning, the right question is not whether this could work in theory. It is whether the added sleepiness could put you or someone else at risk.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["sleep restriction therapy", "CBT-I sleep restriction", "sleep window"],
    keyTakeaways: [
      "Sleep restriction therapy is really about tightening the sleep window when appropriate, not about punishing yourself.",
      "It can be useful for some insomnia patterns and risky for others.",
      "Understanding the concept is safer than copying the tactic blindly.",
    ],
    practicalSteps: [
      "Learn the logic of time-in-bed vs. sleep consistency before making changes.",
      "Strengthen your wake anchor and diary before attempting more aggressive timing work.",
      "Do not treat this as a generic self-discipline challenge.",
      "Step out and get help if fatigue or red flags make the idea feel unsafe.",
    ],
    noticePoints: [
      "Are you spending a lot of time in bed but sleeping poorly within it?",
      "Would extra tiredness make work, driving, or caregiving riskier right now?",
      "Do you actually know your current pattern well enough to evaluate this approach?",
    ],
    relatedLinks: [
      { label: "Sleep efficiency", href: "/guides/sleep-efficiency" },
      { label: "Who RestShore is for", href: "/who-restshore-is-for" },
      { label: "What CBT-I is", href: "/what-is-cbti" },
    ],
    sources: [aasmGuide, medlineInsomnia, samhsa988],
  },
  "stimulus-control-for-insomnia": {
    path: "/guides/stimulus-control-for-insomnia",
    eyebrow: "Guide",
    title: "Stimulus control for insomnia, explained simply",
    description:
      "What stimulus control means in insomnia care and why the bed-sleep connection matters.",
    lede:
      "Stimulus control is about teaching the brain a cleaner relationship between bed and sleep. It sounds simple, but it often changes the emotional tone of the night more than people expect.",
    answer: prose(
      "Stimulus control means trying to make bed feel like a clearer cue for sleep again instead of a place for prolonged wakefulness, worry, scrolling, work, or effort. It is about relationship as much as routine.",
      "That may sound small, but it matters because the brain learns context quickly. If bed repeatedly becomes the place where you struggle, measure, plan, and plead for sleep, the emotional tone of bedtime changes.",
      "Stimulus control tries to reverse that learning in a practical, behavioral way.",
    ),
    whyThisHappens: prose(
      "People with insomnia spend a lot of meaningful time in bed awake. That is understandable. Bed is where sleep is supposed to happen, so of course they stay there trying to help it happen. Over time, that can unintentionally strengthen the bed-awake association.",
      "Once that association is strong, bedtime becomes loaded. The body may relax elsewhere and tense up in bed. That mismatch is one reason falling asleep can feel so confusing and personal.",
    ),
    commonTrap: prose(
      "A common trap is assuming that more time in bed equals more opportunity for sleep. Sometimes it equals more opportunity to reinforce wakefulness in the same environment.",
      "Another trap is treating stimulus control as a rigid set of rules detached from the rest of the schedule. It works best as part of a broader structure that includes wake time, time in bed, and a calmer relationship to the night.",
    ),
    practicalGuidance: prose(
      "Keep the bed as sleep-specific as you reasonably can. Reduce the amount of time it becomes a place for planning, scrolling, or monitoring. Think in terms of association, not perfection.",
      "The goal is not to behave flawlessly. It is to make the bed less crowded with non-sleep meanings over time.",
    ),
    howRestShoreHelps: prose(
      "RestShore turns this principle into practical structure instead of leaving it as abstract advice. Bedtime timing, wake anchors, and optional calendar support work together so the bed-sleep link is supported by the rest of the week.",
      "That is important because stimulus control rarely helps when treated as a disconnected tip. It needs a home inside the larger pattern.",
    ),
    whenToSeekSupport: prose(
      "If bedtime difficulty or night waking comes with severe distress, crisis symptoms, parasomnias, or other safety concerns, do not rely on a simple behavioral summary alone.",
      "Association work can help, but it is not a substitute for evaluation when the situation contains higher-risk signals.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["stimulus control insomnia", "bed sleep association", "CBT-I"],
    keyTakeaways: [
      "Stimulus control is about rebuilding the bed as a sleep cue.",
      "The emotional meaning of the bed can change after enough hard nights.",
      "This principle works best when it sits inside a larger, calmer structure.",
    ],
    practicalSteps: [
      "Notice what the bed has become associated with for you right now.",
      "Reduce non-sleep activities in bed where you reasonably can.",
      "Support the principle with wake-time and schedule consistency.",
      "Treat this as gradual re-learning, not a rigid performance standard.",
    ],
    noticePoints: [
      "Do you feel different in bed than you do elsewhere in the evening?",
      "What non-sleep behaviors are most tied to your time in bed?",
      "Is the bed currently a cue for rest, or a cue for effort and vigilance?",
    ],
    relatedLinks: [
      { label: "Trouble falling asleep", href: "/trouble-falling-asleep" },
      { label: "Waking up in the night", href: "/guides/waking-up-in-the-night" },
      { label: "How to think about sleep anxiety at night", href: "/guides/sleep-anxiety-at-night" },
    ],
    sources: [aasmGuide, medlineInsomnia, samhsa988],
  },
  "sleep-efficiency": {
    path: "/guides/sleep-efficiency",
    eyebrow: "Guide",
    title: "What sleep efficiency means",
    description:
      "What sleep efficiency is, why people track it in CBT-I-style work, and why it is only one signal.",
    lede:
      "Sleep efficiency is a way of comparing time asleep with time spent in bed. It can be useful, but it is not the whole story and it should not become one more number to obsess over.",
    answer: prose(
      "Sleep efficiency is the relationship between time spent asleep and time spent in bed. In practical terms, it helps answer a simple question: is your time in bed lining up reasonably well with actual sleep, or is there a lot of wakefulness inside that window?",
      "That can be useful because many people know they are exhausted but cannot tell whether the problem is mostly timing, fragmentation, too much time in bed, or some combination of all three.",
      "The caution is that sleep efficiency is a pattern signal, not a personal grade. It helps when it clarifies. It hurts when it becomes another number to fear.",
    ),
    whyThisHappens: prose(
      "People with insomnia often stretch the sleep window in response to bad sleep. That can make the night feel longer without making it more restorative. Sleep efficiency gives one way of noticing that mismatch.",
      "It also becomes relevant because insomnia is so easy to experience as a blur. A metric can help turn the blur into a pattern, but only if you remember that the metric is a tool, not the truth of your whole experience.",
    ),
    commonTrap: prose(
      "A common trap is checking sleep efficiency in isolation and reacting emotionally to one low number. That usually creates more monitoring and less clarity.",
      "Another trap is using sleep efficiency to argue with yourself. If you feel awful, the answer is not 'but the number was fine.' The number is just one piece of the picture.",
    ),
    practicalGuidance: prose(
      "Use sleep efficiency as a pattern marker across several nights. Pair it with wake time, sleep fragmentation, and daytime function. The metric becomes more useful when it sits beside other signals rather than replacing them.",
      "If numbers make you more anxious, step back. Sometimes the better move is to return to simple diary logging and let the product or a clinician interpret the pattern more calmly.",
    ),
    howRestShoreHelps: prose(
      "RestShore uses repeated patterns rather than one off-metric night to shape future guidance. That helps keep sleep efficiency in its proper place: informative, but not tyrannical.",
      "The product is trying to create useful structure, not turn sleep into a spreadsheet competition.",
    ),
    whenToSeekSupport: prose(
      "If the numbers seem concerning and the bigger picture includes snoring, choking, severe fatigue, or other health risks, clinician evaluation matters more than self-optimizing a metric.",
      "Metrics can guide questions. They should not replace assessment when something broader may be going on.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["sleep efficiency", "time in bed", "sleep window"],
    keyTakeaways: [
      "Sleep efficiency helps compare sleep time with time in bed.",
      "It is useful as a pattern signal across several nights, not as a nightly grade.",
      "Numbers should support calm decisions, not feed more sleep anxiety.",
    ],
    practicalSteps: [
      "Review efficiency alongside wake time, fragmentation, and how you function during the day.",
      "Avoid turning one low number into a reason to redesign everything.",
      "Use the metric to notice mismatches between time in bed and actual sleep.",
      "Step back if tracking is making you more activated rather than more informed.",
    ],
    noticePoints: [
      "Are you spending long stretches in bed awake?",
      "Does the number help you understand the pattern, or just make you anxious?",
      "What does efficiency look like across a week instead of one night?",
    ],
    relatedLinks: [
      { label: "Sleep restriction therapy", href: "/guides/sleep-restriction-therapy" },
      { label: "Why a sleep diary helps", href: "/sleep-diary" },
      { label: "How to use a sleep diary without overcomplicating it", href: "/guides/how-to-use-a-sleep-diary" },
    ],
    sources: [aasmGuide, medlineInsomnia],
  },
  "waking-up-too-early": {
    path: "/guides/waking-up-too-early",
    eyebrow: "Guide",
    title: "What to do when you keep waking up too early",
    description:
      "Why early waking can happen, what usually makes it harder, and how a steadier schedule can help.",
    lede:
      "Waking up too early can feel especially discouraging because it can steal the end of the night and the start of the day at the same time.",
    answer: prose(
      "Early waking often reflects a pattern problem more than a single bad moment. The night ends before you want it to, but the reasons can include schedule drift, light sleep in the second half of the night, low sleep pressure, or the way the week has been structured.",
      "What makes it especially frustrating is that it can feel like there is nothing to do. You are close to morning, too awake to relax, and already worrying about what the early wake-up means for the day ahead.",
      "The helpful shift is to see early waking as something to understand in context rather than as proof that the entire night is broken beyond repair.",
    ),
    whyThisHappens: prose(
      "The body clock, sleep pressure, stress, and previous nights all play a role in when the night ends. If wake time drifts or bedtime keeps stretching, the second half of the night may stop feeling stable.",
      "Early waking can also become a pattern of anticipation. Once it happens enough times, the mind starts expecting it. That expectation alone can make the early-morning period feel more alert and more difficult to ride out calmly.",
    ),
    commonTrap: prose(
      "A common trap is compensating with dramatic sleep-ins or much earlier bedtimes. That is emotionally understandable, but it can make the broader pattern harder to stabilize.",
      "Another trap is deciding that early waking means the schedule has failed. Sometimes it means the pattern still needs time and steadier signals, not a complete redesign.",
    ),
    practicalGuidance: prose(
      "Protect the wake anchor and judge the pattern across the week, not only from the most painful early-morning wake-up. If the schedule keeps collapsing into compensation, the pattern often stays muddy.",
      "Try to distinguish between what feels unfair and what is actually informative. Early waking is discouraging, but it can still teach you something useful about timing and consistency.",
    ),
    howRestShoreHelps: prose(
      "RestShore keeps early waking inside a broader structure. Instead of reinventing the plan every morning the night ends too soon, the product helps you compare repeated mornings and respond to the underlying pattern.",
      "That can reduce the temptation to chase each early waking with a brand-new bedtime experiment.",
    ),
    whenToSeekSupport: prose(
      "If early waking comes with crisis symptoms, severe depression concerns, or other mental-health warning signs, get outside support rather than treating it as a simple schedule issue.",
      "It is important not to flatten every early wake-up into the same category. Context matters, especially when mood and safety are involved.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["waking up too early", "early waking", "sleep maintenance"],
    keyTakeaways: [
      "Early waking usually makes more sense when you look at the whole week, not one morning.",
      "Compensation can accidentally keep the pattern unstable.",
      "Consistency often helps more than dramatic recovery attempts.",
    ],
    practicalSteps: [
      "Hold the wake anchor rather than chasing every early morning with a new recovery plan.",
      "Look for patterns in bedtime drift, weekend timing, and second-half-of-night fragmentation.",
      "Treat early waking as a signal to understand, not a verdict on the whole plan.",
      "Get support if mood or safety concerns are part of the picture.",
    ],
    noticePoints: [
      "Does early waking follow later weekends or other schedule swings?",
      "How much of the distress comes from the waking itself vs. what you imagine it means for the day?",
      "Is the pattern stable enough to evaluate, or are you still reacting strongly every morning?",
    ],
    relatedLinks: [
      { label: "Why wake time matters more than most people expect", href: "/wake-time-problems" },
      { label: "What to do when you keep waking up in the night", href: "/guides/waking-up-in-the-night" },
      { label: "How to build a sleep schedule you can actually follow", href: "/guides/how-to-build-a-sleep-schedule" },
    ],
    sources: [aasmGuide, medlineInsomnia, samhsa988],
  },
  "sleep-anxiety-at-night": {
    path: "/guides/sleep-anxiety-at-night",
    eyebrow: "Guide",
    title: "How to think about sleep anxiety at night",
    description:
      "A calmer explanation of sleep anxiety, bedtime pressure, and how to reduce the sense that every night is a test.",
    lede:
      "Sleep anxiety is often less about one single fear and more about the feeling that the night has become high-stakes. That pressure can make it harder to let sleep happen.",
    answer: prose(
      "Sleep anxiety usually grows when bedtime starts to feel like a performance test. The mind begins checking whether you are sleepy enough, whether tomorrow will be ruined, whether the plan is working, and whether this night will finally be different.",
      "That vigilance can become the very thing that keeps the system activated. The person is not 'doing sleep wrong.' They are stuck in a loop where fear of another bad night becomes part of the next bad night.",
      "This is why reducing pressure is not a soft extra. It is often central to making the pattern easier to change.",
    ),
    whyThisHappens: prose(
      "After enough hard nights, the brain learns to anticipate the struggle. Bedtime no longer feels neutral. It feels loaded with consequences, and the body responds accordingly.",
      "Sleep anxiety can also be strengthened by all-or-nothing thinking: if tonight goes badly, tomorrow is doomed; if I am awake now, the plan is failing; if this routine does not work, nothing will. That mental tone makes the night more evaluative than restful.",
    ),
    commonTrap: prose(
      "A common trap is searching obsessively for the perfect calming technique every night. Techniques can help, but the search can itself become part of the pressure if it feels like one more thing that has to work right now.",
      "Another trap is blaming yourself for being anxious about sleep. The anxiety often develops as a consequence of repeated difficulty. It is usually a learned response, not a moral failure.",
    ),
    practicalGuidance: prose(
      "The goal is not to force calmness. It is to make the night less evaluative. A steadier schedule, lower stimulation, gentler internal language, and less last-minute problem-solving often matter more than finding a magical relaxation method.",
      "If you notice that the night has become a test, name that pattern. The moment you can say 'I am being pulled into evaluation again,' you create a little more room to respond differently.",
    ),
    howRestShoreHelps: prose(
      "RestShore tries to reduce sleep anxiety by replacing ambiguity with structure. Instead of asking you to invent tonight's solution while you are activated, it gives you a calmer plan, a summary you can return to, and optional calendar support that carries the plan into the day.",
      "That does not remove anxiety instantly. It does make the night less dependent on improvisation and memory, which often helps lower pressure.",
    ),
    whenToSeekSupport: prose(
      "If sleep anxiety sits inside a larger mental-health crisis, panic, or risk of self-harm, get immediate outside support. In the United States, call or text 988.",
      "Behavioral support can help with bedtime pressure, but it should never become a reason to delay help when safety is the deeper issue.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["sleep anxiety", "bedtime anxiety", "can't sleep anxiety"],
    keyTakeaways: [
      "Sleep anxiety often reflects learned vigilance around the night.",
      "The goal is not perfect calm, but less evaluation and pressure.",
      "Structure can lower anxiety by reducing improvisation and uncertainty.",
    ],
    practicalSteps: [
      "Notice when bedtime starts to feel like a test or deadline.",
      "Reduce stimulation and problem-solving late in the evening.",
      "Use a repeatable plan so the night is less dependent on decision-making in the moment.",
      "Get immediate outside support if anxiety is part of a broader crisis.",
    ],
    noticePoints: [
      "What do you start predicting about tomorrow as bedtime approaches?",
      "Do you keep searching for a perfect technique instead of supporting the broader pattern?",
      "Which parts of the night feel most evaluative or high-stakes for you?",
    ],
    relatedLinks: [
      { label: "When falling asleep feels like work", href: "/trouble-falling-asleep" },
      { label: "Stimulus control for insomnia, explained simply", href: "/guides/stimulus-control-for-insomnia" },
      { label: "Who RestShore is for, and when not to use it alone", href: "/who-restshore-is-for" },
    ],
    sources: [aasmGuide, medlineInsomnia, samhsa988],
  },
  "how-to-use-a-sleep-diary": {
    path: "/guides/how-to-use-a-sleep-diary",
    eyebrow: "Guide",
    title: "How to use a sleep diary without overcomplicating it",
    description:
      "A practical guide to using a sleep diary, what to track, and how to keep it simple enough to stay useful.",
    lede:
      "A sleep diary works best when it is consistent, not perfect. You are trying to notice patterns, not produce a clinical document every morning.",
    answer: prose(
      "The easiest way to use a sleep diary well is to keep it lighter than you think. You do not need a research-grade sleep log. You need a small number of repeatable signals that help you understand the pattern.",
      "That usually means logging basic timing, whether sleep felt slow or broken, and how the morning felt. Simpler logs are easier to continue, and continuity is what makes the diary useful.",
      "The diary becomes valuable once it helps you step back from the night and see the week more clearly.",
    ),
    whyThisHappens: prose(
      "People often stop using diaries because they confuse usefulness with completeness. The more they try to capture everything, the more exhausting the process becomes.",
      "The other problem is expectation. If you expect the diary to fix the night by itself, you will be disappointed. Its job is to help you see and respond to patterns, not to work like a sedative.",
    ),
    commonTrap: prose(
      "A common trap is filling the diary with guesses you do not actually trust. If you are unsure about exact timing, estimate simply and move on instead of turning the diary into another source of stress.",
      "Another trap is reading every entry as proof that you are failing or improving. The diary is far more helpful when it is descriptive instead of moral.",
    ),
    practicalGuidance: prose(
      "Track only what you can keep doing. Bedtime, wake time, slow or broken sleep, and morning function are enough to get started. Use the same few categories long enough to make comparison possible.",
      "Review the diary every few days, not every few minutes. The goal is to learn what repeats, not to solve the night retroactively after it is over.",
    ),
    howRestShoreHelps: prose(
      "RestShore keeps the log short by design and looks for repeated patterns before changing future guidance. That helps the diary stay informative without turning it into a daily exam.",
      "The product is trying to preserve the diary's main benefit: clarity. More detail is not always more clarity.",
    ),
    whenToSeekSupport: prose(
      "If your diary starts surfacing snoring, choking, severe fatigue, unusual nighttime behaviors, or other warning signs, use that as a reason to get clinician support, not just to improve your tracking technique.",
      "A diary can highlight patterns. It should not become a substitute for evaluation when the pattern points to something bigger.",
    ),
    updatedAt: "2026-04-01",
    keywords: ["how to use a sleep diary", "sleep log", "sleep diary guide"],
    keyTakeaways: [
      "A good diary is consistent and usable, not exhaustive.",
      "Short logs make it easier to see patterns across time.",
      "The diary should describe the pattern, not grade the night.",
    ],
    practicalSteps: [
      "Track the same small set of signals each morning.",
      "Use estimates when needed instead of chasing false precision.",
      "Review several entries together before drawing conclusions.",
      "Let the diary support decisions rather than becoming a ritual you fear getting wrong.",
    ],
    noticePoints: [
      "Which detail do you keep trying to add that is not actually helping?",
      "Are you abandoning the diary because it feels too heavy?",
      "What becomes clearer when you look at a week instead of one entry?",
    ],
    relatedLinks: [
      { label: "Why a sleep diary helps", href: "/sleep-diary" },
      { label: "What sleep efficiency means", href: "/guides/sleep-efficiency" },
      { label: "How to build a sleep schedule you can actually follow", href: "/guides/how-to-build-a-sleep-schedule" },
    ],
    sources: [aasmGuide, medlineInsomnia],
  },
};

export const guideSlugs = Object.keys(guideLibrary);

const allGuides: GuideContent[] = [
  whatIsCbtiGuide,
  sleepDiaryGuide,
  troubleFallingAsleepGuide,
  wakeTimeProblemsGuide,
  insomniaSupportGuide,
  whoRestShoreIsForGuide,
  howRestShoreWorksGuide,
  ...Object.values(guideLibrary),
];

const guideLookupByPath = new Map(allGuides.map((guide) => [guide.path, guide]));

function pathLink(path: string): GuideLink {
  const guide = guideLookupByPath.get(path);

  if (!guide) {
    throw new Error(`Unknown guide path: ${path}`);
  }

  return {
    label: guide.title,
    href: guide.path,
  };
}

const learningPathOrder = [
  "/what-is-cbti",
  "/guides/cbt-i-vs-sleep-hygiene",
  "/sleep-diary",
  "/guides/how-to-use-a-sleep-diary",
  "/guides/how-to-build-a-sleep-schedule",
  "/wake-time-problems",
  "/trouble-falling-asleep",
  "/guides/stimulus-control-for-insomnia",
  "/guides/sleep-anxiety-at-night",
  "/guides/waking-up-in-the-night",
  "/guides/waking-up-too-early",
  "/guides/sleep-efficiency",
  "/guides/sleep-restriction-therapy",
  "/insomnia-support",
  "/who-restshore-is-for",
  "/how-restshore-works",
] as const;

export function getGuideFlow(path: string): GuideFlow | null {
  const position = learningPathOrder.indexOf(path as (typeof learningPathOrder)[number]);

  if (position === -1) {
    return null;
  }

  return {
    previous: position > 0 ? pathLink(learningPathOrder[position - 1]) : undefined,
    next:
      position < learningPathOrder.length - 1
        ? pathLink(learningPathOrder[position + 1])
        : undefined,
    position: position + 1,
    total: learningPathOrder.length,
  };
}

export const guideIndexSections: GuideIndexSection[] = [
  {
    title: "Start with the foundations",
    description:
      "These pages explain the core ideas behind insomnia-focused behavioral structure before you get into tactics.",
    links: [
      pathLink("/what-is-cbti"),
      pathLink("/guides/cbt-i-vs-sleep-hygiene"),
      pathLink("/who-restshore-is-for"),
      pathLink("/how-restshore-works"),
    ],
  },
  {
    title: "Build a usable toolkit",
    description:
      "These guides help you notice the pattern clearly and turn it into a routine you can actually keep.",
    links: [
      pathLink("/sleep-diary"),
      pathLink("/guides/how-to-use-a-sleep-diary"),
      pathLink("/guides/how-to-build-a-sleep-schedule"),
      pathLink("/wake-time-problems"),
    ],
  },
  {
    title: "Learn from common insomnia patterns",
    description:
      "These pages are for the moments users most often search for directly: falling asleep, waking at night, early waking, and bedtime pressure.",
    links: [
      pathLink("/trouble-falling-asleep"),
      pathLink("/guides/sleep-anxiety-at-night"),
      pathLink("/guides/waking-up-in-the-night"),
      pathLink("/guides/waking-up-too-early"),
      pathLink("/insomnia-support"),
    ],
  },
  {
    title: "Go deeper into the method",
    description:
      "Once the basics make sense, these pages explain the more technical concepts in plain language and keep the safety framing visible.",
    links: [
      pathLink("/guides/stimulus-control-for-insomnia"),
      pathLink("/guides/sleep-efficiency"),
      pathLink("/guides/sleep-restriction-therapy"),
    ],
  },
];
