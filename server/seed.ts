import { storage } from "./storage";
import { db } from "./db";
import { users, categories, courses, chapters, lessons } from "@shared/schema";
import { count } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  const [userCount] = await db.select({ count: count() }).from(users);
  if (userCount.count > 0) return;

  console.log("Seeding database...");

  const adminPassword = await hashPassword("admin123");
  const instructorPassword = await hashPassword("instructor123");
  const studentPassword = await hashPassword("student123");

  const admin = await storage.createUser({
    username: "admin",
    password: adminPassword,
    name: "Alex Rivera",
    email: "admin@learnengine.com",
    role: "ADMIN",
    bio: "Platform administrator and full-stack developer with 10+ years of experience.",
  });

  const instructor1 = await storage.createUser({
    username: "markchen",
    password: instructorPassword,
    name: "Mark Chen",
    email: "mark@learnengine.com",
    role: "INSTRUCTOR",
    bio: "Senior software engineer specializing in web technologies and cloud architecture.",
    avatar: "/images/instructor-1.png",
  });

  const instructor2 = await storage.createUser({
    username: "sarahdesign",
    password: instructorPassword,
    name: "Sarah Kim",
    email: "sarah@learnengine.com",
    role: "INSTRUCTOR",
    bio: "Lead UX designer with a passion for creating beautiful, accessible interfaces.",
    avatar: "/images/instructor-2.png",
  });

  const student = await storage.createUser({
    username: "student",
    password: studentPassword,
    name: "Jamie Torres",
    email: "jamie@example.com",
    role: "STUDENT",
  });

  const cat1 = await storage.createCategory({ name: "Web Development", slug: "web-development", description: "Frontend, backend, and full-stack web development", icon: "code" });
  const cat2 = await storage.createCategory({ name: "UI/UX Design", slug: "ui-ux-design", description: "User interface and experience design", icon: "palette" });
  const cat3 = await storage.createCategory({ name: "Data Science", slug: "data-science", description: "Data analysis, machine learning, and AI", icon: "bar-chart" });
  const cat4 = await storage.createCategory({ name: "Digital Marketing", slug: "digital-marketing", description: "SEO, social media, and content marketing", icon: "megaphone" });
  const cat5 = await storage.createCategory({ name: "Mobile Development", slug: "mobile-development", description: "iOS, Android, and cross-platform mobile apps", icon: "smartphone" });

  const course1 = await storage.createCourse({
    title: "Modern Web Development Masterclass",
    slug: "modern-web-development-masterclass",
    description: "Learn to build full-stack web applications from scratch using the latest technologies. This comprehensive course covers HTML5, CSS3, JavaScript ES6+, React, Node.js, and deployment strategies.\n\nYou'll work through real-world projects, building a portfolio of applications that demonstrate your skills to potential employers. By the end of this course, you'll be confident building and deploying production-ready web applications.",
    shortDescription: "Master full-stack web development with React, Node.js, and modern tools",
    thumbnail: "/images/course-webdev.png",
    price: 0,
    status: "PUBLISHED",
    categoryId: cat1.id,
    instructorId: instructor1.id,
    level: "BEGINNER",
    language: "English",
    isFree: true,
    learningOutcomes: "Build responsive websites with HTML5 and CSS3\nMaster JavaScript ES6+ and TypeScript\nCreate full-stack apps with React and Node.js\nWork with databases and REST APIs\nDeploy applications to the cloud",
    prerequisites: "Basic computer skills\nA desire to learn",
  });

  const course2 = await storage.createCourse({
    title: "UI/UX Design Fundamentals",
    slug: "ui-ux-design-fundamentals",
    description: "Discover the principles of great user interface and experience design. Learn wireframing, prototyping, user research, and visual design using industry-standard tools like Figma.\n\nThis course takes you from beginner to job-ready designer through hands-on projects and real-world case studies.",
    shortDescription: "Learn design thinking, wireframing, and prototyping with Figma",
    thumbnail: "/images/course-design.png",
    price: 49.99,
    status: "PUBLISHED",
    categoryId: cat2.id,
    instructorId: instructor2.id,
    level: "BEGINNER",
    language: "English",
    isFree: false,
    learningOutcomes: "Understand UX research methods\nCreate wireframes and prototypes in Figma\nApply design systems and visual hierarchy\nConduct usability testing\nBuild a professional design portfolio",
  });

  const course3 = await storage.createCourse({
    title: "Data Science with Python",
    slug: "data-science-with-python",
    description: "Dive into the world of data science using Python. Learn pandas, NumPy, matplotlib, scikit-learn, and more through practical projects with real datasets.\n\nFrom data cleaning to machine learning models, this course covers the complete data science workflow.",
    shortDescription: "Master data analysis and machine learning with Python",
    thumbnail: "/images/course-data.png",
    price: 79.99,
    status: "PUBLISHED",
    categoryId: cat3.id,
    instructorId: instructor1.id,
    level: "INTERMEDIATE",
    language: "English",
    isFree: false,
    learningOutcomes: "Analyze data with pandas and NumPy\nCreate visualizations with matplotlib and seaborn\nBuild machine learning models with scikit-learn\nPerform statistical analysis\nWork with real-world datasets",
    prerequisites: "Basic Python knowledge\nHigh school math",
  });

  const course4 = await storage.createCourse({
    title: "Digital Marketing Strategy",
    slug: "digital-marketing-strategy",
    description: "Master the art of digital marketing. Learn SEO, content marketing, social media strategy, email campaigns, and paid advertising to grow any business online.",
    shortDescription: "Learn SEO, social media, and content marketing strategies",
    thumbnail: "/images/course-marketing.png",
    price: 0,
    status: "PUBLISHED",
    categoryId: cat4.id,
    instructorId: instructor2.id,
    level: "BEGINNER",
    language: "English",
    isFree: true,
    learningOutcomes: "Develop a digital marketing strategy\nOptimize websites for search engines\nCreate engaging social media content\nBuild email marketing campaigns\nMeasure and analyze campaign performance",
  });

  const course5 = await storage.createCourse({
    title: "React Native Mobile Development",
    slug: "react-native-mobile-development",
    description: "Build cross-platform mobile apps with React Native. Learn to create beautiful, performant iOS and Android apps from a single codebase using JavaScript and React patterns you already know.",
    shortDescription: "Build iOS and Android apps with React Native",
    thumbnail: "/images/course-mobile.png",
    price: 59.99,
    status: "PUBLISHED",
    categoryId: cat5.id,
    instructorId: instructor1.id,
    level: "INTERMEDIATE",
    language: "English",
    isFree: false,
    learningOutcomes: "Set up a React Native development environment\nBuild cross-platform mobile UIs\nHandle navigation and state management\nIntegrate with native device features\nPublish apps to App Store and Google Play",
    prerequisites: "JavaScript fundamentals\nBasic React knowledge",
  });

  // Add chapters and lessons for course 1
  const ch1_1 = await storage.createChapter({ courseId: course1.id, title: "Getting Started", position: 0 });
  const ch1_2 = await storage.createChapter({ courseId: course1.id, title: "HTML & CSS Fundamentals", position: 1 });
  const ch1_3 = await storage.createChapter({ courseId: course1.id, title: "JavaScript Deep Dive", position: 2 });
  const ch1_4 = await storage.createChapter({ courseId: course1.id, title: "React Framework", position: 3 });

  await storage.createLesson({ chapterId: ch1_1.id, title: "Welcome to the Course", type: "TEXT", position: 0, content: "Welcome to the Modern Web Development Masterclass! In this course, you'll learn everything you need to know to become a full-stack web developer.\n\nWe'll start with the fundamentals and progressively build up to complex applications. By the end, you'll have built several real-world projects for your portfolio.\n\nLet's get started!", duration: 5, isFree: true, isPreview: true });
  await storage.createLesson({ chapterId: ch1_1.id, title: "Setting Up Your Development Environment", type: "TEXT", position: 1, content: "Before we start coding, let's set up your development environment.\n\n1. Install Visual Studio Code from https://code.visualstudio.com\n2. Install Node.js from https://nodejs.org (LTS version)\n3. Install Git from https://git-scm.com\n4. Create a GitHub account at https://github.com\n\nRecommended VS Code Extensions:\n- ESLint\n- Prettier\n- Auto Rename Tag\n- Live Server\n- GitLens", duration: 10 });
  await storage.createLesson({ chapterId: ch1_1.id, title: "How the Web Works", type: "TEXT", position: 2, content: "Understanding how the web works is fundamental to web development.\n\nThe Client-Server Model:\nWhen you visit a website, your browser (the client) sends a request to a web server. The server processes the request and sends back a response, which your browser then renders.\n\nHTTP Protocol:\nHTTP (Hypertext Transfer Protocol) is the foundation of data communication on the web. Common methods include:\n- GET: Retrieve data\n- POST: Send data\n- PUT: Update data\n- DELETE: Remove data\n\nDNS (Domain Name System):\nDNS translates domain names (like google.com) into IP addresses that computers use to identify each other on the network.", duration: 15 });

  await storage.createLesson({ chapterId: ch1_2.id, title: "HTML Document Structure", type: "TEXT", position: 0, content: "HTML (HyperText Markup Language) is the standard markup language for creating web pages.\n\nBasic Structure:\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>This is my first web page.</p>\n</body>\n</html>\n\nKey HTML5 Semantic Elements:\n- <header> - Page or section header\n- <nav> - Navigation links\n- <main> - Main content area\n- <section> - Thematic grouping\n- <article> - Self-contained content\n- <footer> - Page or section footer", duration: 20 });
  await storage.createLesson({ chapterId: ch1_2.id, title: "CSS Styling & Layout", type: "TEXT", position: 1, content: "CSS (Cascading Style Sheets) controls the visual presentation of HTML elements.\n\nThe Box Model:\nEvery element is a box consisting of:\n- Content: The actual content\n- Padding: Space around the content\n- Border: A border around the padding\n- Margin: Space outside the border\n\nFlexbox Layout:\nFlexbox is a one-dimensional layout method:\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 1rem;\n}\n\nCSS Grid:\nGrid is a two-dimensional layout system:\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}", duration: 25 });
  await storage.createLesson({ chapterId: ch1_2.id, title: "Responsive Design", type: "TEXT", position: 2, content: "Responsive design ensures your website looks great on all devices.\n\nMedia Queries:\n@media (max-width: 768px) {\n  .sidebar { display: none; }\n  .main { width: 100%; }\n}\n\nMobile-First Approach:\nStart designing for mobile screens first, then add complexity for larger screens using min-width media queries.\n\nKey Techniques:\n- Relative units (%, em, rem, vw, vh)\n- Flexible images (max-width: 100%)\n- CSS Grid and Flexbox\n- Viewport meta tag", duration: 20 });

  await storage.createLesson({ chapterId: ch1_3.id, title: "JavaScript Fundamentals", type: "TEXT", position: 0, content: "JavaScript is the programming language of the web.\n\nVariables:\nlet name = 'John';\nconst age = 30;\n\nData Types:\n- String: 'Hello'\n- Number: 42\n- Boolean: true/false\n- Array: [1, 2, 3]\n- Object: { key: 'value' }\n- null, undefined\n\nFunctions:\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconst add = (a, b) => a + b;", duration: 30 });
  await storage.createLesson({ chapterId: ch1_3.id, title: "DOM Manipulation", type: "TEXT", position: 1, content: "The Document Object Model (DOM) allows JavaScript to interact with HTML elements.\n\nSelecting Elements:\nconst element = document.getElementById('myId');\nconst elements = document.querySelectorAll('.myClass');\n\nModifying Elements:\nelement.textContent = 'New text';\nelement.style.color = 'blue';\nelement.classList.add('active');\n\nEvent Handling:\nbutton.addEventListener('click', (event) => {\n  console.log('Button clicked!');\n});", duration: 25 });
  await storage.createLesson({ chapterId: ch1_3.id, title: "Async JavaScript & APIs", type: "TEXT", position: 2, content: "Asynchronous JavaScript allows you to perform operations without blocking the main thread.\n\nPromises:\nfetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n\nAsync/Await:\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}", duration: 30 });

  await storage.createLesson({ chapterId: ch1_4.id, title: "Introduction to React", type: "TEXT", position: 0, content: "React is a JavaScript library for building user interfaces.\n\nComponents:\nfunction Welcome({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\nJSX:\nJSX is a syntax extension that allows you to write HTML-like code in JavaScript.\n\nState:\nconst [count, setCount] = useState(0);\n\nProps:\nComponents receive data through props, which are read-only.", duration: 25, isFree: true, isPreview: true });
  await storage.createLesson({ chapterId: ch1_4.id, title: "React Hooks & State Management", type: "TEXT", position: 1, content: "React Hooks let you use state and other features in functional components.\n\nuseState:\nconst [value, setValue] = useState(initialValue);\n\nuseEffect:\nuseEffect(() => {\n  // Side effect code\n  return () => {\n    // Cleanup\n  };\n}, [dependencies]);\n\nuseContext:\nconst ThemeContext = createContext('light');\nconst theme = useContext(ThemeContext);\n\nCustom Hooks:\nfunction useLocalStorage(key, initialValue) {\n  const [stored, setStored] = useState(() => {\n    const item = localStorage.getItem(key);\n    return item ? JSON.parse(item) : initialValue;\n  });\n  return [stored, setStored];\n}", duration: 30 });

  // Add chapters and lessons for course 2
  const ch2_1 = await storage.createChapter({ courseId: course2.id, title: "Design Thinking", position: 0 });
  const ch2_2 = await storage.createChapter({ courseId: course2.id, title: "Figma Essentials", position: 1 });

  await storage.createLesson({ chapterId: ch2_1.id, title: "What is UX Design?", type: "TEXT", position: 0, content: "User Experience (UX) Design focuses on creating products that provide meaningful and relevant experiences to users.\n\nThe 5 Elements of UX:\n1. Strategy - User needs and business objectives\n2. Scope - Features and content requirements\n3. Structure - Interaction design and information architecture\n4. Skeleton - Interface, navigation, and information design\n5. Surface - Visual design\n\nUX is not just about how something looks, but how it works and how it makes users feel.", duration: 15, isFree: true, isPreview: true });
  await storage.createLesson({ chapterId: ch2_1.id, title: "User Research Methods", type: "TEXT", position: 1, content: "Understanding your users is the foundation of great design.\n\nQualitative Methods:\n- User interviews\n- Contextual inquiry\n- Focus groups\n- Diary studies\n\nQuantitative Methods:\n- Surveys\n- Analytics\n- A/B testing\n- Card sorting\n\nCreating User Personas:\nA persona is a fictional representation of your ideal user based on research data. Include demographics, goals, frustrations, and behaviors.", duration: 20 });
  await storage.createLesson({ chapterId: ch2_2.id, title: "Getting Started with Figma", type: "TEXT", position: 0, content: "Figma is a powerful, browser-based design tool used by professionals worldwide.\n\nKey Features:\n- Vector editing tools\n- Component system\n- Auto Layout\n- Design tokens\n- Prototyping\n- Collaboration\n\nSetting Up:\n1. Create a free account at figma.com\n2. Install the desktop app (optional)\n3. Explore the community for templates\n\nWorkspace Organization:\n- Teams for collaboration\n- Projects for grouping files\n- Pages within files for different stages", duration: 15 });
  await storage.createLesson({ chapterId: ch2_2.id, title: "Components & Design Systems", type: "TEXT", position: 1, content: "Design systems ensure consistency across your products.\n\nAtomic Design Methodology:\n1. Atoms - Basic elements (buttons, inputs, icons)\n2. Molecules - Simple groups (search bar = input + button)\n3. Organisms - Complex sections (navigation bar)\n4. Templates - Page layouts\n5. Pages - Final implementations\n\nFigma Components:\n- Create reusable components with variants\n- Use auto layout for responsive behavior\n- Define design tokens for colors, typography, spacing\n- Build a component library for your team", duration: 25 });

  // Seed some chapters for other courses
  const ch3_1 = await storage.createChapter({ courseId: course3.id, title: "Python for Data Science", position: 0 });
  await storage.createLesson({ chapterId: ch3_1.id, title: "Setting Up Python Environment", type: "TEXT", position: 0, content: "Let's set up your Python data science environment.\n\n1. Install Anaconda distribution\n2. Create a virtual environment\n3. Install key packages: pandas, numpy, matplotlib, seaborn, scikit-learn\n4. Set up Jupyter Notebook\n\nJupyter Notebook is an interactive environment perfect for data exploration and analysis.", duration: 15, isFree: true, isPreview: true });

  const ch4_1 = await storage.createChapter({ courseId: course4.id, title: "Marketing Foundations", position: 0 });
  await storage.createLesson({ chapterId: ch4_1.id, title: "The Digital Marketing Landscape", type: "TEXT", position: 0, content: "Digital marketing encompasses all marketing efforts that use electronic devices or the internet.\n\nKey Channels:\n- Search Engine Optimization (SEO)\n- Content Marketing\n- Social Media Marketing\n- Pay-Per-Click (PPC)\n- Email Marketing\n- Affiliate Marketing\n\nThe Customer Journey:\nAwareness -> Consideration -> Decision -> Retention -> Advocacy", duration: 15, isFree: true, isPreview: true });

  const ch5_1 = await storage.createChapter({ courseId: course5.id, title: "React Native Basics", position: 0 });
  await storage.createLesson({ chapterId: ch5_1.id, title: "Introduction to React Native", type: "TEXT", position: 0, content: "React Native lets you build mobile apps using JavaScript and React.\n\nWhy React Native?\n- Write once, run on iOS and Android\n- Hot reloading for fast development\n- Large ecosystem and community\n- Native performance\n- Shared codebase with web React\n\nGetting Started:\nnpx react-native init MyApp\ncd MyApp\nnpx react-native run-ios\nnpx react-native run-android", duration: 15, isFree: true, isPreview: true });

  console.log("Database seeded successfully!");
}
