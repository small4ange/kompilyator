// Types
export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  quiz: Quiz[];
  completed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  chapters: Chapter[];
  progress?: number;
  enrolled?: boolean;
}

// Mock data
export const MOCK_COURSES: Course[] = [
  {
    id: "1",
    title: "Introduction to Web Development",
    description: "Learn the basics of HTML, CSS, and JavaScript to build modern websites.",
    imageUrl: "https://img.heroui.chat/image/ai?w=800&h=400&u=webdev",
    chapters: [
      {
        id: "1-1",
        title: "HTML Fundamentals",
        content: `
          <h1>HTML Fundamentals</h1>
          <p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p>
          
          <h2>Basic Structure</h2>
          <p>Every HTML document has a basic structure that includes the following elements:</p>
          <ul>
            <li>DOCTYPE declaration</li>
            <li>HTML element</li>
            <li>Head element</li>
            <li>Body element</li>
          </ul>
          
          <h2>Common HTML Elements</h2>
          <p>Here are some common HTML elements you'll use frequently:</p>
          <ul>
            <li>Headings (h1-h6)</li>
            <li>Paragraphs (p)</li>
            <li>Links (a)</li>
            <li>Images (img)</li>
            <li>Lists (ul, ol, li)</li>
            <li>Divs and spans (div, span)</li>
          </ul>
        `,
        quiz: [
          {
            id: "q1-1",
            question: "What does HTML stand for?",
            options: [
              "Hyper Text Markup Language",
              "High Tech Modern Language",
              "Hyperlinks and Text Markup Language",
              "Home Tool Markup Language"
            ],
            correctOption: 0
          },
          {
            id: "q1-2",
            question: "Which element is used to define the main content of an HTML document?",
            options: ["<main>", "<body>", "<content>", "<section>"],
            correctOption: 1
          }
        ]
      },
      {
        id: "1-2",
        title: "CSS Basics",
        content: `
          <h1>CSS Basics</h1>
          <p>CSS (Cascading Style Sheets) is used to style and layout web pages.</p>
          
          <h2>CSS Syntax</h2>
          <p>CSS consists of selectors and declarations:</p>
          <ul>
            <li>Selectors target HTML elements</li>
            <li>Declarations specify how the elements should be styled</li>
          </ul>
          
          <h2>CSS Properties</h2>
          <p>Here are some common CSS properties:</p>
          <ul>
            <li>color: Sets text color</li>
            <li>background-color: Sets background color</li>
            <li>font-size: Sets text size</li>
            <li>margin: Sets space outside elements</li>
            <li>padding: Sets space inside elements</li>
          </ul>
        `,
        quiz: [
          {
            id: "q2-1",
            question: "What does CSS stand for?",
            options: [
              "Creative Style Sheets",
              "Computer Style Sheets",
              "Cascading Style Sheets",
              "Colorful Style Sheets"
            ],
            correctOption: 2
          },
          {
            id: "q2-2",
            question: "Which property is used to change the background color?",
            options: ["bgcolor", "color", "background-color", "background"],
            correctOption: 2
          }
        ]
      }
    ]
  },
  {
    id: "2",
    title: "JavaScript Fundamentals",
    description: "Master the core concepts of JavaScript programming language.",
    imageUrl: "https://img.heroui.chat/image/ai?w=800&h=400&u=javascript",
    chapters: [
      {
        id: "2-1",
        title: "Variables and Data Types",
        content: `
          <h1>Variables and Data Types</h1>
          <p>JavaScript variables are containers for storing data values.</p>
          
          <h2>Declaring Variables</h2>
          <p>In JavaScript, you can declare variables using:</p>
          <ul>
            <li>var - function scoped (older way)</li>
            <li>let - block scoped (modern)</li>
            <li>const - block scoped, cannot be reassigned (modern)</li>
          </ul>
          
          <h2>Data Types</h2>
          <p>JavaScript has several data types:</p>
          <ul>
            <li>String - text values</li>
            <li>Number - numeric values</li>
            <li>Boolean - true/false values</li>
            <li>Object - complex data structures</li>
            <li>Array - ordered collections</li>
            <li>null - intentional absence of value</li>
            <li>undefined - unassigned value</li>
          </ul>
        `,
        quiz: [
          {
            id: "q3-1",
            question: "Which keyword is used to declare a constant variable in JavaScript?",
            options: ["var", "let", "const", "static"],
            correctOption: 2
          },
          {
            id: "q3-2",
            question: "What is the result of typeof null in JavaScript?",
            options: ["null", "undefined", "object", "number"],
            correctOption: 2
          }
        ]
      }
    ]
  }
];

// Helper function to get a course by ID
export const getCourseById = (id: string): Course | undefined => {
  return MOCK_COURSES.find(course => course.id === id);
};

// Helper function to get a chapter by ID
export const getChapterById = (courseId: string, chapterId: string): Chapter | undefined => {
  const course = getCourseById(courseId);
  return course?.chapters.find(chapter => chapter.id === chapterId);
};

// Helper function to update courses (for admin functionality)
let courses = [...MOCK_COURSES];

export const getAllCourses = (): Course[] => {
  return courses;
};

export const addCourse = (course: Omit<Course, "id">): Course => {
  const newCourse = {
    ...course,
    id: `${courses.length + 1}`,
  };
  courses = [...courses, newCourse];
  return newCourse;
};

export const updateCourse = (courseId: string, updatedCourse: Partial<Course>): Course | undefined => {
  const index = courses.findIndex(c => c.id === courseId);
  if (index !== -1) {
    courses[index] = { ...courses[index], ...updatedCourse };
    return courses[index];
  }
  return undefined;
};

export const deleteCourse = (courseId: string): boolean => {
  const initialLength = courses.length;
  courses = courses.filter(c => c.id !== courseId);
  return courses.length !== initialLength;
};

// User progress tracking
const userProgress: Record<string, Record<string, { completed: boolean }>> = {};

export const markChapterCompleted = (userId: string, courseId: string, chapterId: string): void => {
  if (!userProgress[userId]) {
    userProgress[userId] = {};
  }
  if (!userProgress[userId][courseId]) {
    userProgress[userId][courseId] = { completed: false };
  }
  userProgress[userId][`${courseId}-${chapterId}`] = { completed: true };
};

export const isChapterCompleted = (userId: string, courseId: string, chapterId: string): boolean => {
  return !!userProgress[userId]?.[`${courseId}-${chapterId}`]?.completed;
};

export const getCourseProgress = (userId: string, courseId: string): number => {
  const course = getCourseById(courseId);
  if (!course) return 0;
  
  const totalChapters = course.chapters.length;
  if (totalChapters === 0) return 0;
  
  let completedChapters = 0;
  course.chapters.forEach(chapter => {
    if (isChapterCompleted(userId, courseId, chapter.id)) {
      completedChapters++;
    }
  });
  
  return Math.round((completedChapters / totalChapters) * 100);
};

export const getUserCourses = (userId: string): Course[] => {
  return courses.map(course => ({
    ...course,
    progress: getCourseProgress(userId, course.id),
    enrolled: Object.keys(userProgress[userId] || {}).some(key => key.startsWith(course.id)),
    chapters: course.chapters.map(chapter => ({
      ...chapter,
      completed: isChapterCompleted(userId, course.id, chapter.id)
    }))
  }));
};
