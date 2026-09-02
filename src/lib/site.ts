/*
  Canonical church information, taken from the official Quest Laguna Church
  Handbook. This is real site copy, not CMS fallback content — sample-content.ts
  holds the CMS fallbacks only.

  Anything here is a statement of fact about the church (identity, beliefs,
  locations, gathering times, ministries). Never invent or "improve" these
  values. If the church changes something, update it here and every page that
  renders it follows.
*/

export const IDENTITY = {
  legalName: 'Quest Laguna Church Inc.',
  name: 'Quest Laguna Church',
  shortName: 'Quest Laguna',
  established: 'December 2024',
  leader: 'Pastora Apple Matabuena Eugenio',
} as const;

/** Who we are, in the handbook's own three words. Public-facing explanations. */
export const IDENTITY_MARKS = [
  {
    title: 'Independent',
    body: 'We are not governed by a denomination. We answer to Scripture and follow the leading of the Holy Spirit in every decision.',
  },
  {
    title: 'Evangelical',
    body: 'Salvation is found in Jesus Christ alone. Sharing that good news is not a job for a few. It belongs to every believer.',
  },
  {
    title: 'Charismatic',
    body: 'We believe the Holy Spirit still moves today. Our faith rests on Jesus Christ, never on signs alone.',
  },
] as const;

export const VISION = {
  name: 'Every Nation Harvest',
  body: 'To see every nation transformed by the Gospel of Jesus Christ through multiplying disciples, healthy churches, and Kingdom-minded leaders.',
} as const;

export const MISSION = {
  name: 'Make Christlike Disciples',
  body: 'We exist to make disciples who know Christ personally, live according to His Word, and faithfully reproduce disciples who will do the same.',
} as const;

export const PASSION = {
  name: 'Love God. Love People.',
  body: 'Everything we do is rooted in the two greatest commandments. Love God wholeheartedly. Love people unconditionally.',
} as const;

export const SCRIPTURE_FOOTER = {
  text: '"Go and make disciples of all nations."',
  reference: 'Matthew 28:19',
} as const;

/**
 * The church culture. The handbook brands these "SIDE PAD" (an acronym of the
 * first letters) — that shorthand is internal teaching language, so public
 * pages present the values themselves without the acronym.
 */
export const CULTURE = [
  { name: 'Spirit-Led', body: 'We follow the leading of the Holy Spirit in every area of life and ministry.' },
  { name: 'Influential', body: "We are called to be salt and light in every sphere of society, for God's glory." },
  { name: 'Disciple Maker', body: 'Every believer is called to intentionally make disciples.' },
  { name: 'Engaged', body: 'We actively serve our church, community, workplace, campus, and nation.' },
  { name: 'Purpose-Driven', body: "We live intentionally according to God's calling." },
  { name: 'Authentic', body: 'We pursue genuine relationships, honesty, humility, and integrity.' },
  { name: 'Devoted', body: "We remain faithful in prayer, worship, God's Word, discipleship, and service." },
] as const;

/** Christlike character, held above every ministry and achievement. */
export const CORE_VALUES = [
  'Love like Christ',
  'Forgive quickly',
  'Walk in humility',
  'Live with integrity',
  'Honor one another',
  'Serve faithfully',
  'Pursue holiness',
  'Remain teachable',
] as const;

export type DistinctiveBlock =
  /*
    `quote` is a phrase in another language closing the sentence. It is split
    out so the page can mark it with `lang`, which is what makes a screen
    reader switch pronunciation instead of reading Tagalog with English
    phonemes (WCAG 3.1.2). Never translate these away.
  */
  | { kind: 'p'; text: string; quote?: { text: string; lang: string } }
  | { kind: 'scripture'; text: string; reference: string };

/*
  "Our Distinctive" — the church's own identity statement, supplied verbatim by
  marketing (2026-09). Reproduce it, never reword it.

  Modelled as ordered blocks so the scripture sits exactly where the church
  placed it, mid-statement, rather than being lifted into a separate band.
  Scripture `text` is stored WITHOUT quote marks: ScriptureLine adds its own.

  The two Tagalog questions are the church's own wording inside an English
  statement, the same exception the "Isang Dekada" campaign name gets. They are
  quoted speech, not hardcoded Tagalog headings.
*/
export const DISTINCTIVE: { title: string; blocks: readonly DistinctiveBlock[] } = {
  title: 'A Promise-Driven Church',
  blocks: [
    { kind: 'p', text: 'At Quest Laguna Church, we choose to be a Promise-Driven Church.' },
    {
      kind: 'p',
      text: 'We believe that the size of what God has called us to do should never be determined by the size of what we can currently accomplish.',
    },
    {
      kind: 'p',
      text: 'We serve a God who is far greater than our resources, abilities, experience, limitations, and circumstances. Therefore, we refuse to put God inside the boundaries of what we can see, understand, or accomplish on our own.',
    },
    {
      kind: 'p',
      text: "We do not measure God's possibilities by our capacity. We measure our capacity in light of God's promises.",
    },
    {
      kind: 'p',
      text: 'Our faith is anchored not in human ability but in the character and Word of God. What God has spoken, He is faithful to fulfill. He does not lie, He does not change, and He does not make empty promises.',
    },
    {
      kind: 'scripture',
      reference: 'Numbers 23:19',
      text: 'God is not a man, so he does not lie. He is not human, so he does not change his mind. Has he ever spoken and failed to act? Has he ever promised and not carried it through?',
    },
    {
      kind: 'p',
      text: 'Because God is faithful, His promises give us courage to believe for things that are beyond our natural ability.',
    },
    {
      kind: 'p',
      text: 'This means that when God gives us a vision that seems too big, we do not immediately ask, ',
      quote: { text: '\u201cKaya ba natin?\u201d', lang: 'fil' },
    },
    {
      kind: 'p',
      text: 'We first ask, ',
      quote: { text: '\u201cAno ang sinabi ng Diyos?\u201d', lang: 'fil' },
    },
    {
      kind: 'p',
      text: 'When the answer is bigger than our capacity, we do not shrink the vision to fit our resources. We return to His Word, strengthen our faith, prepare ourselves, and obey.',
    },
    {
      kind: 'p',
      text: 'We believe that faith does not deny our limitations; faith simply refuses to make our limitations the final word.',
    },
  ],
};

export interface Belief {
  title: string;
  body: string;
  refs: readonly string[];
}

/** The Seven Quest Beliefs — the church's statement of faith. */
export const BELIEFS: readonly Belief[] = [
  {
    title: 'About God',
    body: 'There is only one true and living God, the Creator and Sustainer of heaven and earth. He is eternal, holy, all-powerful, all-knowing, and sovereign over all creation. He has revealed Himself as one God in three Persons: the Father, the Son, and the Holy Spirit, equal in nature, glory, and authority.',
    refs: ['Deuteronomy 6:4', '1 Timothy 2:5', 'Genesis 1:1', 'Colossians 1:16-17', 'Hebrews 1:3, 8', 'John 14:16-17'],
  },
  {
    title: 'About the Bible',
    body: 'The Holy Bible is the inspired, infallible, and authoritative Word of God. It is our highest authority for faith, doctrine, and Christian living. Every teaching and practice of the Church is measured by the truth of Scripture.',
    refs: ['Matthew 5:18', '2 Timothy 3:16-17'],
  },
  {
    title: 'About humanity',
    body: "Humanity was created in the image of God and declared very good. Through sin, we became spiritually dead, separated from God, and unable to save ourselves. Every person needs God's grace and redemption through Jesus Christ.",
    refs: ['Genesis 1:31', 'Romans 3:23', 'Romans 6:23', 'Ephesians 2:1'],
  },
  {
    title: 'About Jesus Christ',
    body: 'Jesus Christ is fully God and fully man. He is the eternal Son of God who became flesh to reveal the Father, redeem humanity, and reconcile sinners to God. He alone is Savior, and the only way to eternal life.',
    refs: ['1 Timothy 2:5', 'John 14:6'],
  },
  {
    title: 'About the first and second coming of Christ',
    body: 'Jesus Christ was conceived by the Holy Spirit, born of the virgin Mary, and lived a sinless life. He died on the cross as the perfect sacrifice for our sins, was buried, rose bodily on the third day, ascended into heaven, and is seated at the right hand of the Father. He will return personally and visibly to establish His Kingdom.',
    refs: ['Luke 1:30-35', 'Luke 2:52', '1 Corinthians 15:3-4', 'Acts 1:11', 'Revelation 11:15'],
  },
  {
    title: 'About true followers of Jesus Christ',
    body: "Salvation is entirely by God's grace, received through faith alone in Jesus Christ alone. A true follower of Christ has been born again by the Holy Spirit, forgiven, justified before God, and made a new creation to live a life that honors Him.",
    refs: ['Ephesians 2:8-9', 'Romans 1:17'],
  },
  {
    title: 'About the Church',
    body: "Every true believer belongs to the one universal Church, the Body of Christ, of which Jesus Christ is the Head. The local church exists to worship God, proclaim the Gospel, make Christlike disciples, equip believers for ministry, and show God's love to the world until Christ returns.",
    refs: ['1 Corinthians 12:13', 'Ephesians 4:1-7', 'Ephesians 3:7-13', 'Matthew 28:18-20'],
  },
];

export interface Location {
  name: string;
  /** Town or city. Kept short — it renders as a sub-line in the footer. */
  area?: string;
  /** Full street address. Only the main mission point has one. */
  address?: string;
}

export const MAIN_LOCATION: Location = {
  name: 'Quest Laguna Church',
  area: 'Biñan City, Laguna',
  address: 'San Antonio National Highway, Biñan City, Laguna',
};

/*
  The handbook lists Quest Las Piñas twice, once with no province and once
  under Cavite. Las Piñas City is in Metro Manila, so rather than publish
  either version we leave its area blank until the church confirms it.
*/
export const SATELLITES: readonly Location[] = [
  { name: 'Quest Southville', area: 'San Pedro, Laguna' },
  { name: 'Quest San Pedro', area: 'Laguna' },
  { name: 'Quest Sta. Rosa', area: 'Laguna' },
  { name: 'Quest Ondoy', area: 'General Mariano Alvarez, Cavite' },
  { name: 'Quest Las Piñas' },
  { name: 'Quest Dasmariñas', area: 'Cavite' },
  { name: 'Quest Los Baños', area: 'Laguna' },
  { name: 'Quest Casile', area: 'Biñan, Laguna' },
  { name: 'Quest Cavinti', area: 'Laguna' },
  { name: 'Quest Hungary', area: 'Europe' },
];

/** Main mission point first, then the satellite churches. */
export const LOCATIONS: readonly Location[] = [MAIN_LOCATION, ...SATELLITES];

/**
 * Sermon service slugs. These key the YOUTUBE_PLAYLIST_* environment variables
 * in youtube.ts and the deployed configuration — never rename them. Display
 * names live on the gatherings below.
 */
export type ServiceSlug = 'family' | 'youngpro' | 'youth' | 'dawn';

export interface Gathering {
  slug: string;
  name: string;
  /** Plain-language description so a first-time visitor knows what it is. */
  subtitle: string;
  schedule: string;
  /** 0 = Sunday, for the sermons live banner. */
  day: number;
  /** Minutes past midnight, Asia/Manila. 10:00 AM = 600. */
  startMin: number;
  durationMin: number;
  online?: boolean;
  /** Set when the gathering has its own sermon archive on YouTube. */
  sermonSlug?: ServiceSlug;
  /** Whether the sermons page should show a "we're live" banner for it. */
  liveOnYouTube: boolean;
}

export const GATHERINGS: readonly Gathering[] = [
  {
    slug: 'family-reunion',
    name: 'Family Reunion',
    subtitle: 'Our main worship service, for the whole family.',
    schedule: 'Sundays · 10:00 AM',
    day: 0,
    startMin: 600,
    durationMin: 120,
    sermonSlug: 'family',
    liveOnYouTube: true,
  },
  {
    slug: 'nxtgn',
    name: 'NXTGN',
    subtitle: "Children's church, running at the same time as Family Reunion.",
    schedule: 'Sundays · 10:00 AM',
    day: 0,
    startMin: 600,
    durationMin: 120,
    liveOnYouTube: false,
  },
  {
    slug: 'elevate',
    name: 'Elevate',
    subtitle: 'For young professionals.',
    schedule: 'Fridays · 7:00 PM',
    day: 5,
    startMin: 1140,
    durationMin: 120,
    sermonSlug: 'youngpro',
    liveOnYouTube: true,
  },
  {
    slug: 'genzeal',
    name: 'GenZeal',
    subtitle: 'For students and young people.',
    schedule: 'Saturdays · 3:00 PM',
    day: 6,
    startMin: 900,
    durationMin: 120,
    sermonSlug: 'youth',
    liveOnYouTube: true,
  },
  {
    slug: 'dawn-prayer-rally',
    name: 'Dawn Prayer Rally',
    subtitle: 'Early morning prayer, together as one church.',
    schedule: 'Saturdays · 5:00 AM',
    day: 6,
    startMin: 300,
    durationMin: 120,
    sermonSlug: 'dawn',
    liveOnYouTube: true,
  },
  {
    slug: 'thirstday',
    name: 'Thirstday',
    subtitle: 'Our online prayer rally. Message us for the link and pray with us.',
    schedule: 'Thursdays · 5:00 AM',
    day: 4,
    startMin: 300,
    durationMin: 120,
    online: true,
    liveOnYouTube: false,
  },
];

/** Gatherings that carry a sermon archive, in the order the tabs render. */
export const SERMON_SERVICES = GATHERINGS.filter(
  (gathering): gathering is Gathering & { sermonSlug: ServiceSlug } =>
    gathering.sermonSlug !== undefined,
);

/**
 * In-person gatherings, one per time slot, for the "give in person" schedule.
 * NXTGN runs alongside Family Reunion, so listing both would repeat the same
 * Sunday morning twice.
 */
export const IN_PERSON_GATHERINGS = GATHERINGS.filter(
  (gathering, i, all) =>
    !gathering.online && all.findIndex((other) => other.schedule === gathering.schedule) === i,
);

export interface Ministry {
  name: string;
  blurb: string;
}

export interface MinistryGroup {
  title: string;
  body: string;
  /** Header photo for the group card, from public/images/site. */
  photo: { src: string; label: string; alt: string; width: number; height: number };
  ministries: readonly Ministry[];
}

/**
 * The fourteen ministries of the church, grouped so the page stays readable on
 * a phone. Names are the official ones from the handbook.
 */
export const MINISTRY_GROUPS: readonly MinistryGroup[] = [
  {
    title: 'Worship & Creative',
    body: 'If you sing, play, dance, or love being behind a camera or a soundboard, this is your team.',
    photo: {
      src: '/images/site/ministry-worship.webp',
      width: 900,
      height: 413,
      label: 'JUDAH Worship PH leading on a Sunday',
      alt: 'The JUDAH Worship PH team leading worship',
    },
    ministries: [
      { name: 'JUDAH Worship PH', blurb: 'Leads the church into Christ-centered worship.' },
      { name: 'Creative Arts Ministry', blurb: 'Dance and creative movement that points people to Jesus.' },
      { name: 'Creative Media Ministry', blurb: 'Photo, video, design, livestream, and social media.' },
      { name: 'Production & Technical Ministry', blurb: 'Sound, lights, and everything behind the scenes.' },
    ],
  },
  {
    title: 'Care & Welcome',
    body: 'The people who make sure no one arrives unnoticed and no one carries a burden alone.',
    photo: {
      src: '/images/site/ministry-ushering.webp',
      width: 900,
      height: 413,
      label: 'The Guest Experience team at the door',
      alt: 'The Guest Experience Ministry team welcoming guests',
    },
    ministries: [
      { name: 'Pastoral Ministry', blurb: 'Spiritual leadership, teaching, counseling, and pastoral care.' },
      { name: 'Guest Experience Ministry', blurb: 'Welcomes every guest and helps them feel at home.' },
      { name: 'Hospitality & Kitchen Ministry', blurb: 'Meals and refreshments for gatherings and outreaches.' },
      { name: 'Prayer Warriors Ministry', blurb: 'Intercedes for the church, its leaders, and the nations.' },
    ],
  },
  {
    title: 'Next Generation & Family',
    body: 'Raising children, students, and families who will follow Jesus for a lifetime.',
    photo: {
      src: '/images/site/ministry-kids.webp',
      width: 900,
      height: 410,
      label: 'An NXTGN Kids class',
      alt: 'The NXTGN Kids Ministry team with the children',
    },
    ministries: [
      { name: 'NXTGN Kids Ministry', blurb: 'Introduces children to the love of Jesus, alongside their parents.' },
      { name: 'Campus Missionaries', blurb: 'Reaches students and disciples future leaders on campus.' },
      { name: 'Couples Ministry', blurb: 'Equips husbands and wives to build Christ-centered marriages.' },
    ],
  },
  {
    title: 'Operations & Missions',
    body: 'The quiet work that keeps the church running and carries the Gospel beyond our walls.',
    photo: {
      src: '/images/site/ministry-serving.webp',
      width: 900,
      height: 413,
      label: 'Volunteers serving behind the scenes',
      alt: 'Volunteers serving behind the scenes on a Sunday',
    },
    ministries: [
      { name: 'Administration Ministry', blurb: 'Documentation, scheduling, finance coordination, and support.' },
      { name: 'Events Management Ministry', blurb: 'Plans and runs gatherings, conferences, and outreaches.' },
      { name: 'Corporate Missionaries', blurb: 'Disciples professionals and turns workplaces into mission fields.' },
    ],
  },
];

export interface PathwayStep {
  name: string;
  blurb: string;
}

/*
  Visitor-facing next steps. The handbook's full membership process (with
  internal stages like Schooling and Sending) belongs to the Church Processes
  booklet — internal teaching material, not public website content. This is
  the condensed version a first-time guest actually needs.
*/
export const NEXT_STEPS: readonly PathwayStep[] = [
  { name: 'Visit a gathering', blurb: 'Come as you are, on your own or with the person who invited you.' },
  { name: 'Grow in discipleship', blurb: 'Learn the basics of following Jesus with someone walking beside you.' },
  { name: 'Join a Life Group', blurb: 'A small group near you, so you are not doing faith alone.' },
  { name: 'Be baptized in water', blurb: 'When you are ready, go public with your faith.' },
  { name: 'Become a member', blurb: 'Make Quest your home and be counted on by the family.' },
  { name: 'Serve with a ministry', blurb: 'Find your team and put your gifts to work.' },
];

export interface PastoralService {
  slug: string;
  /** The service, in the church's own words. */
  name: string;
  /*
    FIRST NAME ONLY of the admin who handles it.

    Never add a surname, phone number, email address or social handle, even
    when the list we were given includes them: that is member PII
    (.claude/rules/content.md). People reach them through the question form on
    /connect, which emails the office to pass on. Edit here when someone hands
    the role over.
  */
  adminFirstName: string;
  /*
    The card photo. `src` stays undefined until the church supplies a real
    photograph, and PhotoSlot renders a labelled placeholder meanwhile —
    `label` describes the shot we are waiting for.
  */
  photo: { label: string; src?: string; alt?: string; width?: number; height?: number };
}

/*
  Booking and assisting for pastoral services and rites, rendered at /services.

  The names are the church's own list, kept as they were given rather than
  reworded. They already say what each one covers, so the cards carry no extra
  description line.
*/
export const PASTORAL_SERVICES: readonly PastoralService[] = [
  {
    slug: 'dedication',
    name: 'Child, House, Business, Properties Dedication',
    adminFirstName: 'Ailene',
    photo: { label: 'A family at a child dedication' },
  },
  {
    slug: 'wedding',
    name: 'Wedding Ceremony, Renewal of Vows, Family Dedication',
    adminFirstName: 'Rose Ann',
    photo: { label: 'A couple at a Quest Laguna wedding' },
  },
  {
    slug: 'funeral',
    name: 'Funeral Service, Bereavement',
    adminFirstName: 'Helen',
    photo: { label: 'The church gathered around a grieving family' },
  },
  {
    slug: 'counseling',
    name: 'Counseling, Reconciliation, Spiritual Care',
    adminFirstName: 'Marivic',
    photo: { label: 'A pastor listening in a one-to-one conversation' },
  },
  {
    slug: 'baptism',
    name: 'Water Baptism, Communion, Commissioning',
    adminFirstName: 'Len Len',
    photo: {
      label: 'Families gathered around the baptism pool',
      src: '/images/site/baptism.webp',
      alt: 'Families gathered around the baptism pool at Quest Laguna',
      width: 900,
      height: 493,
    },
  },
];

/** Shared by the header and the footer so the two never drift. */
export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Sermons', href: '/sermons' },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  { label: 'Testimonies', href: '/testimonies' },
  { label: 'Give', href: '/give' },
  { label: 'Connect', href: '/connect' },
] as const;

/*
  The footer lists everything the header does, plus the pages that are reachable
  but deliberately not in the top nav — the nav is already full at nine items
  and starts colliding with the wordmark at lg.
*/
export const FOOTER_LINKS = [
  ...NAV,
  { label: 'Visit', href: '/visit' },
  { label: 'Pastoral services', href: '/services' },
] as const;
