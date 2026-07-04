import { Note } from "./types";

const TODAY = new Date().toISOString().slice(0, 10);

export const seedNotes: Note[] = [
  // ── Behavioral / General (10) ──────────────────────────
  {
    id: "seed-b01",
    title: "Tell me about yourself",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "SITUATION:\n(Where were you? What were you studying or working on?)\n\nTASK:\n(What were you responsible for?)\n\nACTION:\n(What specific steps did you take?)\n\nRESULT:\n(What was the outcome? What did you learn?)\n\n---\nTip: Keep it under 2 minutes. End with why you're excited about this role.",
  },
  {
    id: "seed-b02",
    title: "Tell me about a time you faced a technical problem — how did you diagnose it?",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "SITUATION:\n(What was the bug or issue? What system was it in?)\n\nTASK:\n(What was the impact? Who was affected?)\n\nACTION:\n(How did you narrow it down? What tools or logs did you check?)\n\nRESULT:\n(How did you fix it? What did you put in place to prevent it again?)\n\n---\nTip: They want to see your systematic thinking, not just that you fixed it.",
  },
  {
    id: "seed-b03",
    title: "Describe a project you're proud of",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "SITUATION:\n(What was the project? Who was it for?)\n\nTASK:\n(What was your specific role and responsibility?)\n\nACTION:\n(What choices did you make? What trade-offs did you navigate?)\n\nRESULT:\n(What was the impact? What made it successful?)\n\n---\nTip: Pick something with measurable impact or a meaningful technical challenge.",
  },
  {
    id: "seed-b04",
    title: "Tell me about a time you had to learn a new technology quickly",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "SITUATION:\n(What technology? Why did you need to learn it?)\n\nTASK:\n(What was the deadline or pressure?)\n\nACTION:\n(How did you approach learning? What resources did you use?)\n\nRESULT:\n(How quickly did you become productive? What did you build?)\n\n---\nTip: Show you're resourceful and comfortable with the unknown.",
  },
  {
    id: "seed-b05",
    title: "How do you handle conflicting priorities or deadlines?",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "SITUATION:\n(What were the competing tasks?)\n\nTASK:\n(What was at stake if either was missed?)\n\nACTION:\n(How did you prioritize? Did you communicate with anyone?)\n\nRESULT:\n(How did it turn out? What would you do differently?)\n\n---\nTip: Emphasize communication and transparency over just 'working harder'.",
  },
  {
    id: "seed-b06",
    title: "Describe a disagreement with a teammate and how you resolved it",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "SITUATION:\n(What was the disagreement about?)\n\nTASK:\n(Why did it matter to the project?)\n\nACTION:\n(How did you approach the conversation? Did you find common ground?)\n\nRESULT:\n(What was the resolution? How did it affect the relationship?)\n\n---\nTip: Focus on empathy and outcomes, not on who was right.",
  },
  {
    id: "seed-b07",
    title: "Tell me about a time you failed and what you learned",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "SITUATION:\n(What happened?)\n\nTASK:\n(What were you trying to achieve?)\n\nACTION:\n(What went wrong? What was your role in it?)\n\nRESULT:\n(What did you learn? How did it change your approach going forward?)\n\n---\nTip: Own the failure genuinely. The lesson is what matters most.",
  },
  {
    id: "seed-b08",
    title: "Why do you want to work here?",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "Prepare three reasons:\n1. Company mission or product alignment\n2. Technical stack or team culture that excites you\n3. Growth opportunity — what you'll learn\n\n---\nTip: Be specific. Reference something real from their website or job post. Generic answers are forgettable.",
  },
  {
    id: "seed-b09",
    title: "Where do you see yourself in 5 years?",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "Think about:\n1. Skills you want to develop (technical and leadership)\n2. The kind of problems you want to solve\n3. How this role connects to that path\n\n---\nTip: Show ambition that aligns with what the company offers. Avoid answers that suggest you'll leave quickly.",
  },
  {
    id: "seed-b10",
    title: "What are your strengths and weaknesses?",
    category: "Behavioral",
    createdAt: TODAY,
    content:
      "STRENGTHS:\n- Pick 2 that are relevant to the role\n- Back each with a brief example\n\nWEAKNESSES:\n- Pick one real area for growth\n- Show what you're actively doing about it\n\n---\nTip: Avoid clichés like 'I'm a perfectionist'. Honesty with self-awareness stands out.",
  },

  // ── Web Dev Fundamentals (10) ──────────────────────────
  {
    id: "seed-w01",
    title: "Explain what a REST API is (like you would to a non-technical person)",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- A way for two software systems to talk to each other over the internet\n- Uses standard HTTP methods (GET, POST, PUT, DELETE) like a common language\n- Data is exchanged in a predictable format (usually JSON)\n\n---\nTip: Use an analogy — like a waiter taking your order to the kitchen and bringing back your food.",
  },
  {
    id: "seed-w02",
    title: "What is the difference between frontend and backend?",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Frontend: what the user sees and interacts with (UI, layout, animations)\n- Backend: server-side logic, database, authentication, business rules\n- They communicate via HTTP requests (API calls)\n\n---\nTip: The frontend is the restaurant dining room; the backend is the kitchen.",
  },
  {
    id: "seed-w03",
    title: "What is the difference between HTTP and HTTPS?",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- HTTP sends data in plain text; HTTPS encrypts it with TLS/SSL\n- HTTPS uses port 443; HTTP uses port 80\n- Browsers show a padlock icon for HTTPS\n- Google ranks HTTPS sites higher in search results\n\n---\nTip: Emphasize that HTTPS protects user data in transit — passwords, cookies, etc.",
  },
  {
    id: "seed-w04",
    title: "What happens when you type a URL in the browser?",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key steps to cover:\n1. DNS lookup (browser cache → OS → DNS server → IP address)\n2. TCP connection (three-way handshake)\n3. TLS handshake (if HTTPS)\n4. HTTP request sent to the server\n5. Server processes request, sends response\n6. Browser renders HTML, loads CSS/JS/images\n\n---\nTip: Don't just list steps — briefly explain why each matters.",
  },
  {
    id: "seed-w05",
    title: "What is the difference between SQL and NoSQL databases?",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- SQL: structured tables with fixed schemas, uses JOINs, good for complex queries\n- NoSQL: flexible documents/key-value, scales horizontally, good for unstructured data\n- Examples: MySQL/PostgreSQL vs MongoDB/Firebase\n\n---\nTip: Neither is universally better — talk about trade-offs and when you'd choose each.",
  },
  {
    id: "seed-w06",
    title: "What is an ORM and why use one?",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- ORM (Object-Relational Mapping) lets you interact with a database using code objects instead of raw SQL\n- Reduces boilerplate and SQL injection risk\n- Examples: Eloquent (Laravel), Prisma (Node), SQLAlchemy (Python)\n- Trade-off: less control over optimized queries\n\n---\nTip: Mention Eloquent specifically since it's relevant to Laravel roles.",
  },
  {
    id: "seed-w07",
    title: "What is the difference between authentication and authorization?",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Authentication: verifying WHO you are (login, tokens, passwords)\n- Authorization: verifying WHAT you can access (roles, permissions)\n- They happen in sequence: authenticate first, then authorize\n\n---\nTip: Use a real example — logging in is authN, an admin-only page is authZ.",
  },
  {
    id: "seed-w08",
    title: "What is CORS and why does it matter?",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Cross-Origin Resource Sharing — a browser security mechanism\n- Browsers block requests from one origin (domain) to another by default\n- CORS headers tell the browser which origins are allowed\n- Preflight requests check permissions before the actual request\n\n---\nTip: Mention a real scenario — calling an API from a different frontend domain.",
  },
  {
    id: "seed-w09",
    title: "Explain git basics: merge vs rebase, resolving conflicts",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Git tracks changes in code over time\n- Merge: creates a merge commit, preserves branch history\n- Rebase: replays commits on top of another branch, cleaner linear history\n- Conflicts: happen when two branches change the same lines\n- Resolution: edit the file, keep what's correct, stage and commit\n\n---\nTip: Show you understand when to use each — merge for shared branches, rebase for local cleanup.",
  },
  {
    id: "seed-w10",
    title: "Explain the MVC architecture pattern",
    category: "Web Fundamentals",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Model: data and business logic (database, validation rules)\n- View: presentation layer (HTML, templates, UI)\n- Controller: handles input, connects Model and View\n- Request flow: Controller receives request → fetches data from Model → passes to View\n\n---\nTip: Laravel follows MVC — reference it directly if applying for PHP/Laravel roles.",
  },

  // ── React / Frontend Specific (5) ──────────────────────
  {
    id: "seed-r01",
    title: "What are React hooks and why use them?",
    category: "React",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Hooks let you use state and lifecycle features in function components\n- useState: manages local component state\n- useEffect: runs side effects (API calls, subscriptions)\n- Custom hooks: extract reusable logic\n\n---\nTip: Compare briefly with class components — hooks are simpler and more composable.",
  },
  {
    id: "seed-r02",
    title: "What is the difference between state and props?",
    category: "React",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Props: passed from parent to child, read-only, configures the component\n- State: managed internally, mutable via setState/useState\n- Data flows downward: parent → child via props\n\n---\nTip: Mention that props are immutable for the child — this enforces unidirectional data flow.",
  },
  {
    id: "seed-r03",
    title: "What causes unnecessary re-renders and how to prevent them?",
    category: "React",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Parent re-renders always re-render children (even if props unchanged)\n- Prevent with: React.memo, useMemo, useCallback\n- Lifting state too high causes cascade re-renders\n- Inline functions/objects in JSX create new references each render\n\n---\nTip: Don't just list solutions — explain WHY each one helps.",
  },
  {
    id: "seed-r04",
    title: "What are controlled vs uncontrolled components?",
    category: "React",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Controlled: React state is the source of truth for form inputs (value + onChange)\n- Uncontrolled: DOM holds the state (useRef to access value)\n- Controlled gives more control; uncontrolled is simpler for quick forms\n\n---\nTip: Most real apps use controlled components for validation and dynamic behavior.",
  },
  {
    id: "seed-r05",
    title: "What is the virtual DOM and why does React use it?",
    category: "React",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Virtual DOM is a lightweight JS copy of the real DOM\n- When state changes, React diffs old vs new virtual DOM\n- Only the changed parts get patched to the real DOM (reconciliation)\n- This is faster than directly manipulating the real DOM every time\n\n---\nTip: Mention it's about efficiency, not magic — React still touches the real DOM, just less often.",
  },

  // ── PHP / Laravel / Backend Specific (5) ────────────────
  {
    id: "seed-l01",
    title: "Explain Laravel's request lifecycle",
    category: "PHP/Laravel",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Request enters via public/index.php\n- Boots through bootstrap/app.php (creates the Application)\n- Passes through the HTTP kernel (middleware runs)\n- Route matched → Controller invoked → Response returned\n- Response passes back through middleware → sent to client\n\n---\nTip: Mention service providers — they're the backbone of Laravel's bootstrapping.",
  },
  {
    id: "seed-l02",
    title: "What are migrations and why use them?",
    category: "PHP/Laravel",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Migrations are version-controlled database schemas\n- You define table structure in PHP, not raw SQL\n- Rollback support — undo changes cleanly\n- Team collaboration: everyone stays in sync\n\n---\nTip: Mention artisan migrate:fresh vs migrate:rollback as a practical workflow.",
  },
  {
    id: "seed-l03",
    title: "Explain Eloquent relationships (one-to-many, many-to-many)",
    category: "PHP/Laravel",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- One-to-many: a User has many Posts (hasMany / belongsTo)\n- Many-to-many: a Post belongs to many Tags (belongsToMany with pivot table)\n- One-to-one: a User has one Profile\n- Eloquent handles JOINs behind the scenes\n\n---\nTip: Draw from a real project example if you can.",
  },
  {
    id: "seed-l04",
    title: "How do you secure a login system?",
    category: "PHP/Laravel",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Password hashing: bcrypt/argon2, never store plain text\n- Input sanitization: validate and sanitize all inputs\n- Prepared statements: prevent SQL injection\n- CSRF tokens: protect against cross-site request forgery\n- Rate limiting: prevent brute force attacks\n\n---\nTip: Laravel handles most of this out of the box — mention Auth facade and guards.",
  },
  {
    id: "seed-l05",
    title: "What is middleware and give an example use case",
    category: "PHP/Laravel",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Middleware intercepts HTTP requests before they reach the controller\n- Used for: authentication checks, logging, CORS headers, rate limiting\n- In Laravel: defined in app/Http/Kernel, applied in routes or controllers\n\n---\nTip: Give a concrete example — like RedirectIfAuthenticated middleware sending logged-in users to dashboard.",
  },

  // ── Troubleshooting / Problem-Solving (5) ──────────────
  {
    id: "seed-t01",
    title: "Walk through your general debugging process",
    category: "Troubleshooting",
    createdAt: TODAY,
    content:
      "Key steps to cover:\n1. Reproduce the issue reliably\n2. Read error messages carefully (don't skip them)\n3. Isolate the problem (binary search the code)\n4. Check logs, use debugger or console output\n5. Form a hypothesis, test it\n6. Fix, verify, and write a test to prevent regression\n\n---\nTip: Show a methodical approach, not just 'I try random things until it works'.",
  },
  {
    id: "seed-t02",
    title: "How would you handle a production bug you can't reproduce locally?",
    category: "Troubleshooting",
    createdAt: TODAY,
    content:
      "Key approaches to cover:\n- Check production logs for error traces\n- Look for environment differences (env vars, dependencies, data)\n- Add targeted logging or tracing in production (safely)\n- Try to replicate production conditions locally (Docker, staging)\n- Communicate with the team — fresh eyes help\n\n---\nTip: Emphasize caution — never push untested fixes to production under pressure.",
  },
  {
    id: "seed-t03",
    title: "How do you approach learning an unfamiliar codebase?",
    category: "Troubleshooting",
    createdAt: TODAY,
    content:
      "Key approaches to cover:\n- Start with the README, package.json, and config files\n- Understand the directory structure and entry points\n- Follow one request flow end-to-end (route → controller → view)\n- Look at tests — they reveal expected behavior\n- Don't try to understand everything at once\n\n---\nTip: Mention a real experience where you ramped up on a new project.",
  },
  {
    id: "seed-t04",
    title: "Describe your testing approach (manual vs automated)",
    category: "Troubleshooting",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Manual testing: exploratory, edge cases, UI walkthroughs\n- Automated testing: unit tests, integration tests, E2E\n- When each is appropriate\n- Tools you've used (Jest, PHPUnit, Cypress, etc.)\n\n---\nTip: Be honest about your experience level — interviewers value honesty over pretending to be an expert.",
  },
  {
    id: "seed-t05",
    title: "How do you decide when to ask for help vs keep debugging?",
    category: "Troubleshooting",
    createdAt: TODAY,
    content:
      "Key considerations to cover:\n- Set a time limit (e.g., 30-60 minutes stuck)\n- Have you tried: searching docs, Stack Overflow, AI tools?\n- Is this blocking someone else's work?\n- Could a teammate point you in the right direction faster?\n\n---\nTip: Asking for help is a skill. Show you can be self-directed AND know when collaboration is more efficient.",
  },

  // ── IT Support / Networking Basics (5) ─────────────────
  {
    id: "seed-n01",
    title: "Explain the OSI model simply",
    category: "Networking",
    createdAt: TODAY,
    content:
      "Key layers to cover (pick the ones you can explain confidently):\n1. Physical (cables, signals)\n2. Data Link (MAC addresses, switches)\n3. Network (IP addresses, routing)\n4. Transport (TCP/UDP, ports)\n5. Session (connections)\n6. Presentation (encryption, encoding)\n7. Application (HTTP, DNS, SMTP)\n\n---\nTip: Don't memorize all 7 — focus on layers 3-7 where most practical troubleshooting happens.",
  },
  {
    id: "seed-n02",
    title: "DNS basics — what happens during a lookup?",
    category: "Networking",
    createdAt: TODAY,
    content:
      "Key steps to cover:\n1. Browser cache → OS cache → hosts file\n2. Recursive resolver (ISP or public DNS like 8.8.8.8)\n3. Root nameserver → TLD server → authoritative nameserver\n4. IP address returned → browser connects\n\n---\nTip: Mention DNS TTL and caching — it explains why DNS changes aren't instant.",
  },
  {
    id: "seed-n03",
    title: "Common causes of 'the internet is slow' and how you'd troubleshoot",
    category: "Networking",
    createdAt: TODAY,
    content:
      "Key causes to consider:\n- DNS issues (slow resolution)\n- Bandwidth saturation (too many devices/downloads)\n- Wi-Fi interference or weak signal\n- Router/modem issues (needs reboot)\n- ISP throttling or outage\n\nTroubleshooting approach:\n1. Test with speed test + ping\n2. Check other devices on the same network\n3. Try wired vs wireless\n4. Check DNS resolution time\n\n---\nTip: Show a layered approach — don't just say 'restart the router'.",
  },
  {
    id: "seed-n04",
    title: "What is the difference between a switch and a router?",
    category: "Networking",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- Switch: connects devices within the same network (LAN), uses MAC addresses\n- Router: connects different networks together (LAN to internet), uses IP addresses\n- Switches work at Layer 2; routers work at Layer 3\n- Home routers usually combine both functions\n\n---\nTip: Use the office analogy — a switch is like an internal phone system, a router is like the connection to the outside world.",
  },
  {
    id: "seed-n05",
    title: "What is a VPN and why use one?",
    category: "Networking",
    createdAt: TODAY,
    content:
      "Key concepts to cover:\n- VPN creates an encrypted tunnel between your device and a VPN server\n- Masks your real IP address from websites you visit\n- Use cases: remote work security, public Wi-Fi protection, privacy\n- Does NOT make you fully anonymous — the VPN provider can still see traffic\n\n---\nTip: Mention both personal and corporate use — VPNs are standard for remote development teams.",
  },
];
