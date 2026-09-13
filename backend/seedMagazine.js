import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Magazine from './src/models/magazine.model.js';

const seedData = {
  title: "THE MECHAPEF TIMES",
  volumeNumber: "Vol. 1",
  issueNumber: "Issue 42",
  shortDescription: "The official mechanical engineering student newsletter covering tech, events, and campus life.",
  status: "Published",
  
  heroStory: {
    heading: "The Dawn of Automation: Are We Ready?",
    subHeading: "A deep dive into how robotic automation is reshaping core mechanical engineering jobs.",
    description: "In the past decade, we have seen unprecedented shifts in manufacturing. The assembly lines of tomorrow rely not on manual labor but on intelligent, self-learning robots. While some fear job displacement, industry experts argue that this shift will create highly specialized roles for mechanical engineers who understand both hardware and AI integration. We explore what this means for students graduating this year.",
    imageURL: ""
  },
  
  featuredStories: [
    {
      category: "TECHNOLOGY",
      date: "July 2, 2026",
      layoutType: "top-down",
      heading: "New 3D Printing Lab Opens on Campus",
      shortDescription: "The long-awaited rapid prototyping lab is finally open to all engineering students, featuring state-of-the-art metal resin printers.",
      imageURL: ""
    },
    {
      category: "EVENTS",
      date: "July 1, 2026",
      layoutType: "left-right",
      heading: "MechaPEF Annual Tech Fest Announced",
      shortDescription: "Mark your calendars! The biggest mechanical tech fest is returning this September with new robotics competitions.",
      imageURL: ""
    }
  ],
  
  inDepthAnalysis: {
    heading: "Sustainable Materials: The Future of Automotive Design",
    author: "Dr. A. Sharma",
    description: "As the automotive industry pivots towards electric vehicles, the materials used in manufacturing are undergoing a silent revolution. Traditional steel is being replaced by carbon composites and bioplastics. This analysis covers the recent breakthroughs in biodegradable polymers and how they match the tensile strength of legacy materials while cutting the carbon footprint by over 60%.",
    imageURL: ""
  },
  
  mixedArticles: [
    {
      category: "INTERVIEW",
      date: "June 28, 2026",
      layoutType: "left-right",
      heading: "Alumni Spotlight: Building Rockets at ISRO",
      description: "We sat down with 2018 batch alumni Rahul Verma to discuss his journey from the college CAD labs to designing propulsion systems at the Indian Space Research Organisation. Rahul shares his advice for juniors aspiring to join the aerospace sector.",
      imageURL: ""
    },
    {
      category: "WORKSHOP",
      date: "June 25, 2026",
      layoutType: "top-down",
      heading: "Mastering ANSYS: A Beginner's Guide",
      description: "Our recent two-day workshop on finite element analysis saw record attendance. Students learned how to simulate thermal stress on engine components. Here is a quick recap of the most important takeaways from the session.",
      imageURL: ""
    },
    {
      category: "OPINION",
      date: "June 20, 2026",
      layoutType: "left-right",
      heading: "Why Soft Skills Matter More Than Ever",
      description: "Technical prowess is no longer enough. In a highly collaborative industry, the ability to communicate complex engineering problems effectively is what separates good engineers from great leaders.",
      imageURL: ""
    }
  ],
  
  opinionColumns: [
    {
      author: "Sneha Gupta",
      heading: "The Myth of the 'Perfect' Design",
      content: "Engineers often fall into the trap of over-optimizing. Sometimes, 'good enough' deployed today is better than 'perfect' deployed next year. We need to embrace iterative design in our college projects."
    },
    {
      author: "Vikram Singh",
      heading: "Why Thermodynamics is Still King",
      content: "Despite the hype around AI and ML, core physical principles govern reality. If you don't understand heat transfer, your smart robot will melt. Stick to the basics before jumping into the code."
    },
    {
      author: "Priya Menon",
      heading: "Women in Mechanical Engineering",
      content: "The ratio is improving, but we still have a long way to go. It's time to break the stereotype that mechanical engineering is purely 'heavy lifting' and showcase the precision and design aspects."
    },
    {
      author: "Editorial Board",
      heading: "A Note to Freshers",
      content: "Welcome to the department! It will be tough, you will face rejections, and the math will get crazy. But the feeling of seeing a machine you designed come to life is worth every sleepless night."
    }
  ],
  
  newsCards: [
    {
      category: "UPDATE",
      heading: "Library extends hours for mid-sems",
      imageURL: ""
    },
    {
      category: "ACHIEVEMENT",
      heading: "RoboWars Team wins National Silver",
      imageURL: ""
    },
    {
      category: "NOTICE",
      heading: "Deadline for Project Submissions",
      imageURL: ""
    }
  ],
  
  sidebarArticles: [
    {
      heading: "Upcoming Guest Lecture",
      smallDescription: "Join us this Friday for a talk by Tata Motors Chief Engineer."
    },
    {
      heading: "New CAD Software Licenses",
      smallDescription: "The college has procured 50 new SolidWorks licenses for student use."
    },
    {
      heading: "Placement Stats 2025-26",
      smallDescription: "Average package sees a 15% jump in core sectors."
    }
  ],
  
  advertisement: {
    isEnabled: true,
    redirectLink: "https://example.com",
    bannerImageURL: ""
  },
  
  categories: ["TECHNOLOGY", "EVENTS", "INTERVIEWS", "OPINIONS", "ACADEMICS"]
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    

    await Magazine.deleteMany({});
    await Magazine.create(seedData);
    
    console.log("Magazine seeded successfully with dummy text!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seed();
