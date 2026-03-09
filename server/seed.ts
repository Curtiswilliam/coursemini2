import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { count } from "drizzle-orm";
import { hashPassword } from "./auth";

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
    email: "admin@coursemini.com",
    role: "ADMIN",
    bio: "Platform administrator and full-stack developer with 10+ years of experience.",
  });

  const instructor1 = await storage.createUser({
    username: "markchen",
    password: instructorPassword,
    name: "Mark Chen",
    email: "mark@coursemini.com",
    role: "INSTRUCTOR",
    bio: "Senior software engineer specializing in web technologies and cloud architecture.",
    avatar: "/images/instructor-1.png",
  });

  const instructor2 = await storage.createUser({
    username: "sarahdesign",
    password: instructorPassword,
    name: "Sarah Kim",
    email: "sarah@coursemini.com",
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
    description: "Learn to build full-stack web applications from scratch using the latest technologies. This comprehensive course covers HTML5, CSS3, JavaScript ES6+, React, Node.js, and deployment strategies.",
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
    description: "Discover the principles of great user interface and experience design. Learn wireframing, prototyping, user research, and visual design using industry-standard tools like Figma.",
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
    description: "Dive into the world of data science using Python. Learn pandas, NumPy, matplotlib, scikit-learn, and more through practical projects with real datasets.",
    shortDescription: "Master data analysis and machine learning with Python",
    thumbnail: "/images/course-data.png",
    price: 79.99,
    status: "PUBLISHED",
    categoryId: cat3.id,
    instructorId: instructor1.id,
    level: "INTERMEDIATE",
    language: "English",
    isFree: false,
    learningOutcomes: "Analyze data with pandas and NumPy\nCreate visualizations with matplotlib and seaborn\nBuild machine learning models with scikit-learn",
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
    learningOutcomes: "Develop a digital marketing strategy\nOptimize websites for search engines\nCreate engaging social media content",
  });

  const course5 = await storage.createCourse({
    title: "React Native Mobile Development",
    slug: "react-native-mobile-development",
    description: "Build cross-platform mobile apps with React Native. Learn to create beautiful, performant iOS and Android apps from a single codebase.",
    shortDescription: "Build iOS and Android apps with React Native",
    thumbnail: "/images/course-mobile.png",
    price: 59.99,
    status: "PUBLISHED",
    categoryId: cat5.id,
    instructorId: instructor1.id,
    level: "INTERMEDIATE",
    language: "English",
    isFree: false,
    learningOutcomes: "Set up a React Native development environment\nBuild cross-platform mobile UIs\nHandle navigation and state management",
    prerequisites: "JavaScript fundamentals\nBasic React knowledge",
  });

  // Course 1: Web Dev - Subject > Module > Lesson hierarchy
  const subj1_1 = await storage.createSubject({ courseId: course1.id, title: "Foundations", position: 0, description: "Core web development concepts" });
  const subj1_2 = await storage.createSubject({ courseId: course1.id, title: "Frontend Development", position: 1, description: "Building user interfaces" });
  const subj1_3 = await storage.createSubject({ courseId: course1.id, title: "JavaScript & React", position: 2, description: "Programming and frameworks" });

  const mod1_1_1 = await storage.createModule({ subjectId: subj1_1.id, title: "Getting Started", position: 0 });
  const mod1_1_2 = await storage.createModule({ subjectId: subj1_1.id, title: "How the Web Works", position: 1 });
  const mod1_2_1 = await storage.createModule({ subjectId: subj1_2.id, title: "HTML Essentials", position: 0 });
  const mod1_2_2 = await storage.createModule({ subjectId: subj1_2.id, title: "CSS & Layout", position: 1 });
  const mod1_3_1 = await storage.createModule({ subjectId: subj1_3.id, title: "JavaScript Fundamentals", position: 0 });
  const mod1_3_2 = await storage.createModule({ subjectId: subj1_3.id, title: "React Framework", position: 1 });

  await storage.createLesson({ moduleId: mod1_1_1.id, title: "Welcome to the Course", type: "TEXT", position: 0, content: "<h2>Welcome to the Modern Web Development Masterclass!</h2><p>In this course, you'll learn everything you need to know to become a full-stack web developer.</p><p>We'll start with the fundamentals and progressively build up to complex applications. By the end, you'll have built several real-world projects for your portfolio.</p><p><strong>Let's get started!</strong></p>", duration: 5, isFree: true, isPreview: true });
  await storage.createLesson({ moduleId: mod1_1_1.id, title: "Setting Up Your Environment", type: "TEXT", position: 1, content: "<h2>Development Environment Setup</h2><p>Before we start coding, let's set up your development environment.</p><h3>Required Tools</h3><ol><li>Install <strong>Visual Studio Code</strong> from code.visualstudio.com</li><li>Install <strong>Node.js</strong> from nodejs.org (LTS version)</li><li>Install <strong>Git</strong> from git-scm.com</li><li>Create a <strong>GitHub</strong> account at github.com</li></ol><h3>Recommended VS Code Extensions</h3><ul><li>ESLint</li><li>Prettier</li><li>Auto Rename Tag</li><li>Live Server</li></ul>", duration: 10 });
  await storage.createLesson({ moduleId: mod1_1_2.id, title: "How the Web Works", type: "TEXT", position: 0, content: "<h2>Understanding the Web</h2><p>Understanding how the web works is fundamental to web development.</p><h3>The Client-Server Model</h3><p>When you visit a website, your browser (the client) sends a request to a web server. The server processes the request and sends back a response.</p><h3>HTTP Protocol</h3><p>HTTP is the foundation of data communication on the web. Common methods include:</p><ul><li><strong>GET</strong> - Retrieve data</li><li><strong>POST</strong> - Send data</li><li><strong>PUT</strong> - Update data</li><li><strong>DELETE</strong> - Remove data</li></ul>", duration: 15 });

  await storage.createLesson({ moduleId: mod1_2_1.id, title: "HTML Document Structure", type: "TEXT", position: 0, content: "<h2>HTML Basics</h2><p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p><h3>Key HTML5 Semantic Elements</h3><ul><li><code>&lt;header&gt;</code> - Page or section header</li><li><code>&lt;nav&gt;</code> - Navigation links</li><li><code>&lt;main&gt;</code> - Main content area</li><li><code>&lt;section&gt;</code> - Thematic grouping</li><li><code>&lt;article&gt;</code> - Self-contained content</li><li><code>&lt;footer&gt;</code> - Page or section footer</li></ul>", duration: 20 });
  await storage.createLesson({ moduleId: mod1_2_2.id, title: "CSS Styling & Layout", type: "TEXT", position: 0, content: "<h2>CSS Fundamentals</h2><p>CSS controls the visual presentation of HTML elements.</p><h3>The Box Model</h3><p>Every element consists of: <strong>Content → Padding → Border → Margin</strong></p><h3>Flexbox Layout</h3><p>Flexbox is a one-dimensional layout method for arranging items in rows or columns.</p><h3>CSS Grid</h3><p>Grid is a two-dimensional layout system for complex page layouts.</p>", duration: 25 });
  await storage.createLesson({ moduleId: mod1_2_2.id, title: "Responsive Design", type: "TEXT", position: 1, content: "<h2>Making Sites Responsive</h2><p>Responsive design ensures your website looks great on all devices.</p><h3>Key Techniques</h3><ul><li>Relative units (%, em, rem, vw, vh)</li><li>Flexible images (max-width: 100%)</li><li>CSS Grid and Flexbox</li><li>Mobile-first approach</li></ul>", duration: 20 });

  await storage.createLesson({ moduleId: mod1_3_1.id, title: "JavaScript Basics", type: "TEXT", position: 0, content: "<h2>JavaScript Fundamentals</h2><p>JavaScript is the programming language of the web.</p><h3>Variables & Data Types</h3><p>JavaScript has several data types: <strong>String, Number, Boolean, Array, Object</strong></p><h3>Functions</h3><p>Functions are reusable blocks of code. Use <code>function</code> declarations or arrow functions <code>=></code></p>", duration: 30 });
  await storage.createLesson({ moduleId: mod1_3_1.id, title: "Async JavaScript & APIs", type: "TEXT", position: 1, content: "<h2>Asynchronous Programming</h2><p>Async JavaScript allows operations without blocking the main thread.</p><h3>Promises</h3><p>Promises represent the eventual result of an asynchronous operation.</p><h3>Async/Await</h3><p>A cleaner syntax for working with promises using <code>async</code> and <code>await</code> keywords.</p>", duration: 30 });
  await storage.createLesson({ moduleId: mod1_3_2.id, title: "Introduction to React", type: "TEXT", position: 0, content: "<h2>Getting Started with React</h2><p>React is a JavaScript library for building user interfaces.</p><h3>Core Concepts</h3><ul><li><strong>Components</strong> - Reusable building blocks</li><li><strong>JSX</strong> - HTML-like syntax in JavaScript</li><li><strong>Props</strong> - Passing data to components</li><li><strong>State</strong> - Managing component data</li></ul>", duration: 25, isFree: true, isPreview: true });
  await storage.createLesson({ moduleId: mod1_3_2.id, title: "React Hooks & State", type: "TEXT", position: 1, content: "<h2>React Hooks</h2><p>Hooks let you use state and other features in functional components.</p><h3>Essential Hooks</h3><ul><li><strong>useState</strong> - Manage component state</li><li><strong>useEffect</strong> - Handle side effects</li><li><strong>useContext</strong> - Access context values</li><li><strong>useRef</strong> - Reference DOM elements</li></ul>", duration: 30 });

  // Course 2: UI/UX Design
  const subj2_1 = await storage.createSubject({ courseId: course2.id, title: "Design Thinking", position: 0 });
  const subj2_2 = await storage.createSubject({ courseId: course2.id, title: "Figma Essentials", position: 1 });

  const mod2_1_1 = await storage.createModule({ subjectId: subj2_1.id, title: "UX Foundations", position: 0 });
  const mod2_2_1 = await storage.createModule({ subjectId: subj2_2.id, title: "Getting Started with Figma", position: 0 });

  await storage.createLesson({ moduleId: mod2_1_1.id, title: "What is UX Design?", type: "TEXT", position: 0, content: "<h2>Understanding UX Design</h2><p>User Experience Design focuses on creating products that provide meaningful experiences.</p><h3>The 5 Elements of UX</h3><ol><li><strong>Strategy</strong> - User needs and business objectives</li><li><strong>Scope</strong> - Features and content requirements</li><li><strong>Structure</strong> - Interaction design</li><li><strong>Skeleton</strong> - Interface design</li><li><strong>Surface</strong> - Visual design</li></ol>", duration: 15, isFree: true, isPreview: true });
  await storage.createLesson({ moduleId: mod2_1_1.id, title: "User Research Methods", type: "TEXT", position: 1, content: "<h2>User Research</h2><p>Understanding your users is the foundation of great design.</p><h3>Qualitative Methods</h3><ul><li>User interviews</li><li>Contextual inquiry</li><li>Focus groups</li></ul><h3>Quantitative Methods</h3><ul><li>Surveys</li><li>Analytics</li><li>A/B testing</li></ul>", duration: 20 });
  await storage.createLesson({ moduleId: mod2_2_1.id, title: "Figma Interface Tour", type: "TEXT", position: 0, content: "<h2>Getting Started with Figma</h2><p>Figma is a powerful, browser-based design tool used by professionals worldwide.</p><h3>Key Features</h3><ul><li>Vector editing tools</li><li>Component system</li><li>Auto Layout</li><li>Prototyping</li><li>Real-time collaboration</li></ul>", duration: 15 });
  await storage.createLesson({ moduleId: mod2_2_1.id, title: "Components & Design Systems", type: "TEXT", position: 1, content: "<h2>Design Systems</h2><p>Design systems ensure consistency across your products.</p><h3>Atomic Design</h3><ol><li><strong>Atoms</strong> - Basic elements (buttons, inputs)</li><li><strong>Molecules</strong> - Simple groups</li><li><strong>Organisms</strong> - Complex sections</li><li><strong>Templates</strong> - Page layouts</li><li><strong>Pages</strong> - Final implementations</li></ol>", duration: 25 });

  // Course 3-5: Minimal seed
  const subj3_1 = await storage.createSubject({ courseId: course3.id, title: "Python for Data Science", position: 0 });
  const mod3_1_1 = await storage.createModule({ subjectId: subj3_1.id, title: "Getting Started", position: 0 });
  await storage.createLesson({ moduleId: mod3_1_1.id, title: "Setting Up Python Environment", type: "TEXT", position: 0, content: "<h2>Python Data Science Setup</h2><p>Let's set up your Python data science environment.</p><ol><li>Install Anaconda distribution</li><li>Create a virtual environment</li><li>Install key packages: pandas, numpy, matplotlib</li><li>Set up Jupyter Notebook</li></ol>", duration: 15, isFree: true, isPreview: true });

  const subj4_1 = await storage.createSubject({ courseId: course4.id, title: "Marketing Foundations", position: 0 });
  const mod4_1_1 = await storage.createModule({ subjectId: subj4_1.id, title: "Digital Marketing Landscape", position: 0 });
  await storage.createLesson({ moduleId: mod4_1_1.id, title: "The Digital Marketing Landscape", type: "TEXT", position: 0, content: "<h2>Digital Marketing Overview</h2><p>Digital marketing encompasses all marketing efforts that use electronic devices or the internet.</p><h3>Key Channels</h3><ul><li>Search Engine Optimization (SEO)</li><li>Content Marketing</li><li>Social Media Marketing</li><li>Email Marketing</li></ul>", duration: 15, isFree: true, isPreview: true });

  const subj5_1 = await storage.createSubject({ courseId: course5.id, title: "React Native Basics", position: 0 });
  const mod5_1_1 = await storage.createModule({ subjectId: subj5_1.id, title: "Getting Started", position: 0 });
  await storage.createLesson({ moduleId: mod5_1_1.id, title: "Introduction to React Native", type: "TEXT", position: 0, content: "<h2>React Native</h2><p>React Native lets you build mobile apps using JavaScript and React.</p><h3>Why React Native?</h3><ul><li>Write once, run on iOS and Android</li><li>Hot reloading for fast development</li><li>Native performance</li><li>Large ecosystem</li></ul>", duration: 15, isFree: true, isPreview: true });

  console.log("Database seeded successfully!");
}
