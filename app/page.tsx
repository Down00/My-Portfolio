'use client';

import Image from 'next/image';
import { useState, FormEvent, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { z } from 'zod';

// Initialize EmailJS with your public key
emailjs.init("tRCZlxOHbx7duIBin");

// Constants
const SUBMIT_COOLDOWN = 60000; // 1 minute cooldown
const MAX_ATTEMPTS = 5; // Max attempts per session
const EMAIL_CONFIG = {
  serviceId: 'service_s0u8bp8',
  templateId: 'template_cdwvv1b',
  publicKey: 'tRCZlxOHbx7duIBin',
  toEmail: 'russelnitullano08@gmail.com'
};

interface Project {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  github: string;
  demo?: string;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Enhanced form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email')
    .max(100, 'Email must be less than 100 characters'),
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(100, 'Subject must be less than 100 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .refine(msg => !msg.includes('<script>'), 'Message contains invalid characters'),
});

export default function Home() {
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: number]: boolean }>({});
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData | 'submit', string>>>({});
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [submitAttempts, setSubmitAttempts] = useState<number>(0);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => Math.max(0, prev - 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const projects: Project[] = [
    {
      title: 'Big Black Coffee App',
      description: 'A mobile application Project for Coffee Shop using React Native.',
      image: '/bbclogo.png',
      technologies: ['React Native', 'Firebase'],
      github: 'https://github.com/Down00/CoffeShop_mini_pos',
      //demo: 'https://attendance.kaiznitullano.com',
    },
    {
      title: 'JobIntHelper App',
      description: 'A mobile application Project for Job Aplicants to improve their communication skills and to expand their knowledge in different fields using React Native.',
      image: '/jobint.jpg',
      technologies: ['React Native', 'Firebase'],
      github: 'https://github.com/Down00/JobIntHelper',
      //demo: 'https://shop.kaiznitullano.com',
    },
    {
      title: 'Secure Vault App',
      description: 'A poweful and user friendly file management application that helps you organize, manage, and secure your files efficiently.',
      image: '/securevault.png',
      technologies: ['Java + Kotlin', 'Android Studio'],
      github: 'https://github.com/Down00/File-manager',
      //demo: 'https://tasks.kaiznitullano.com',
    },
  ];

  const initialProjectCount = 3;
  const hasMoreProjects = projects.length > initialProjectCount;
  const visibleProjects = showAllProjects ? projects : projects.slice(0, initialProjectCount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    // Check rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      const remainingTime = Math.ceil((SUBMIT_COOLDOWN - (now - lastSubmitTime)) / 1000);
      setFormErrors(prev => ({
        ...prev,
        submit: `Please wait ${remainingTime} seconds before submitting again`
      }));
      return false;
    }

    // Check max attempts
    if (submitAttempts >= MAX_ATTEMPTS) {
      setFormErrors(prev => ({
        ...prev,
        submit: 'Maximum submission attempts reached. Please try again later.'
      }));
      return false;
    }

    // Validate form data
    try {
      formSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!await validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitAttempts(prev => prev + 1);

    try {
      // Create form element for EmailJS
      const form = e.target as HTMLFormElement;
      
      // Add hidden inputs for additional data
      const hiddenInputs = {
        to_name: 'Russel',
        to_email: EMAIL_CONFIG.toEmail,
        reply_to: formData.email,
        email_to: EMAIL_CONFIG.toEmail // Ensure this is set
      };

      // Temporarily add hidden fields to form
      const tempInputs: HTMLInputElement[] = [];
      Object.entries(hiddenInputs).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
        tempInputs.push(input);
      });

      console.log('Sending email with form data:', {
        ...formData,
        ...hiddenInputs
      });

      // Send using form element
      const response = await emailjs.sendForm(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.templateId,
        form,
        EMAIL_CONFIG.publicKey
      );

      console.log('EmailJS Response:', response);

      // Clean up temporary inputs
      tempInputs.forEach(input => input.remove());

      if (response.status !== 200) {
        throw new Error('Failed to send email');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setLastSubmitTime(Date.now());
      setCooldownTime(SUBMIT_COOLDOWN);
      
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);

      const successMessage = document.querySelector('.animate-fade-in');
      successMessage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send message';
      
      setFormErrors(prev => ({
        ...prev,
        submit: `${errorMessage}. Please try again later.`
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDescription = (index: number) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const scrollToNextSection = (currentId: string) => {
    const sections = ['hero', 'about', 'projects', 'contact'];
    const currentIndex = sections.indexOf(currentId);
    if (currentIndex < sections.length - 1) {
      const nextSection = document.getElementById(sections[currentIndex + 1]);
      nextSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderFormField = (
    field: keyof FormData,
    label: string,
    type: string = 'text',
    placeholder: string
  ) => (
    <div className="space-y-2">
      <label htmlFor={field} className="block text-sm font-medium text-slate-300">
        {label}
        <span className="text-red-400 ml-1">*</span>
      </label>
      {type === 'textarea' ? (
        <textarea
          id={field}
          name={field}
          value={formData[field]}
          onChange={handleInputChange}
          required
          rows={4}
          className={`w-full px-4 py-3 rounded-lg bg-slate-800/50 border transition-all resize-none ${
            formErrors[field]
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
          }`}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          id={field}
          name={field}
          value={formData[field]}
          onChange={handleInputChange}
          required
          className={`w-full px-4 py-3 rounded-lg bg-slate-800/50 border transition-all ${
            formErrors[field]
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
          }`}
          placeholder={placeholder}
        />
      )}
      {formErrors[field] && (
        <p className="text-red-400 text-xs mt-1">{formErrors[field]}</p>
      )}
    </div>
  );

  return (
    <main className="relative">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(139,92,246,0.1),transparent_50%)] animate-pulse"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_90%_80%,rgba(99,102,241,0.1),transparent_50%)] animate-pulse delay-1000"></div>

      {/* Hero Section */}
      <section id="hero" className="relative h-screen">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="section-container relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-7xl mx-auto px-4">
            <div className="flex-1 text-center md:text-left space-y-8">
              <div className="space-y-4">
                <div className="inline-block animate-float">
                  <span className="px-4 py-2 rounded-full border border-violet-400/20 text-violet-400 bg-violet-400/10 text-sm">
                    Mobile App Developer
                  </span>
                </div>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold">
                  <span className="block mb-2">Hi, I'm</span>
                  <span className="gradient-text">Kaiz Nitullano</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl">
                  Crafting innovative mobile app development experiences with clean code and modern design
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <a href="#projects" className="btn-primary group rounded-md px-4 py-2">
                  <span className="text-white flex items-center gap-2">
                    View My Work
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
                <a href="#contact" className="btn-glass group rounded-md px-4 py-2">
                  <span className="flex items-center gap-2">
                    Let's Connect
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </span>
                </a>
              </div>

              <div className="flex gap-6 justify-center md:justify-start text-slate-400">
                <a href="https://github.com/Down00" target="_blank" rel="noopener noreferrer" 
                   className="hover:text-violet-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/nitullano-russel-l-5a07a0291/" target="_blank" rel="noopener noreferrer"
                   className="hover:text-violet-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="relative flex-1 max-w-lg">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
              <div className="relative aspect-square rounded-full overflow-hidden border-4 border-slate-800/50 shadow-2xl">
                <Image
                  src="/profile.jpg"
                  alt="Kaiz Nitullano"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  priority
                />
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-violet-500/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-300"></div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => scrollToNextSection('hero')}
          className="scroll-indicator rounded-md"
          aria-label="Scroll to next section"
        >
          <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </section>

      {/* About Section */}
      <section id="about" className="relative min-h-screen">
        <div className="section-container">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row gap-12 items-center mt-12">
              {/* Left side - Timeline */}
              <div className="lg:w-1/2 space-y-8">
                <div className="relative pl-8 border-l-2 border-violet-500/30">
                  {/* Timeline dots */}
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-violet-500"></div>
                  <div className="absolute left-[-9px] top-1/3 w-4 h-4 rounded-full bg-violet-500"></div>
                  <div className="absolute left-[-9px] top-2/3 w-4 h-4 rounded-full bg-violet-500"></div>
                  
                  {/* Timeline content */}
                  <div className="space-y-12">
                    <div className="transform hover:-translate-x-2 transition-transform">
                      <h3 className="text-xl font-bold mb-2">The Beginning</h3>
                      <p className="text-slate-400">Started my journey in tech with a fascination for creating things that live on the internet.</p>
                    </div>
                    <div className="transform hover:-translate-x-2 transition-transform">
                      <h3 className="text-xl font-bold mb-2">The Evolution</h3>
                      <p className="text-slate-400">Developed expertise in mobile applications development and best practices through hands-on experience.</p>
                    </div>
                    <div className="transform hover:-translate-x-2 transition-transform">
                      <h3 className="text-xl font-bold mb-2">The Present</h3>
                      <p className="text-slate-400">Currently crafting Mobile and Web applications that combine creativity with technical excellence.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Skills */}
              <div className="lg:w-1/2">
                <div className="grid grid-cols-3 gap-4 relative">
                  {/* Floating skill bubbles */}
                  {['React Native','Java + Kotlin','TypeScript', 'Next.js', 'TailwindCSS', 'Firebase', 'Supabase', 'Git'].map((skill, index) => (
                    <div
                      key={skill}
                      className="group aspect-square relative"
                      style={{
                        transform: `rotate(${index * 40}deg)`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-lg transform transition-transform group-hover:scale-110">
                        <div className="absolute inset-0 flex items-center justify-center -rotate-[40deg]">
                          <span className="font-medium text-sm">{skill}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="relative min-h-screen">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="section-container">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-5">
              <h2 className="text-4xl md:text-5xl font-bold gradient-text">Featured Projects</h2>
              <div className="mt-1 h-1 w-20 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full"></div>
              <p className="mt-10 text-slate-300">Heres some of my recent work.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {visibleProjects.map((project, index) => (
                <div key={index} className="group h-full">
                  <div className="glass-card overflow-hidden rounded-lg hover:translate-y-[-4px] transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-video relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-0 group-hover:opacity-60 transition-opacity z-10"></div>
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold mb-2 text-violet-400 group-hover:text-violet-300 transition-colors line-clamp-1">{project.title}</h3>
                      <div className="relative flex-grow flex flex-col">
                        <p className={`text-sm text-slate-400 mb-1 ${expandedDescriptions[index] ? '' : 'line-clamp-2'}`}>
                          {project.description}
                        </p>
                        {project.description.length > 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescription(index);
                            }}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors focus:outline-none self-start rounded-md px-2 py-0.5"
                          >
                            {expandedDescriptions[index] ? 'Show Less' : 'See More'}
                          </button>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-2 py-0.5 text-xs rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {project.github && (
                            <a
                              href={project.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-glass text-xs px-3 py-1.5 rounded-md group/btn"
                            >
                              <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                Code
                                <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </span>
                            </a>
                          )}
                          {project.demo && (
                            <a
                              href={project.demo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary text-xs px-3 py-1.5 rounded-md group/btn"
                            >
                              <span className="text-white flex items-center gap-1.5">
                                Live Demo
                                <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreProjects && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllProjects(!showAllProjects)}
                  className="btn-glass text-sm px-4 py-2 rounded-md group/btn inline-flex items-center gap-2"
                >
                  {showAllProjects ? 'Show Less' : 'View More'}
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showAllProjects ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => scrollToNextSection('projects')}
          className="scroll-indicator rounded-md"
          aria-label="Scroll to next section"
        >
          <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative min-h-screen">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/2 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="section-container">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-13">
              <h2 className="text-4xl md:text-5xl font-bold gradient-text">Get In Touch</h2>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full"></div>
              <p className="mt-2 mb-3 text-slate-400">Let's create something amazing together</p>
            </div>

            <div className="glass-card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="from_name" value={formData.name} />
                <input type="hidden" name="from_email" value={formData.email} />
                <input type="hidden" name="subject" value={formData.subject} />
                <input type="hidden" name="message" value={formData.message} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderFormField('name', 'Name', 'text', 'Kaiz')}
                  {renderFormField('email', 'Email', 'email', 'kaiz@example.com')}
                </div>
                {renderFormField('subject', 'Subject', 'text', 'Project Inquiry')}
                {renderFormField('message', 'Message', 'textarea', 'Tell me about your project...')}
                
                <button 
                  type="submit" 
                  disabled={isSubmitting || cooldownTime > 0}
                  className={`btn-primary w-full group rounded-md px-4 py-2 relative overflow-hidden ${
                    (isSubmitting || cooldownTime > 0) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="text-white flex items-center justify-center gap-2 relative z-10">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="animate-pulse">Sending...</span>
                      </>
                    ) : cooldownTime > 0 ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Wait {Math.ceil(cooldownTime / 1000)}s
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                  {!isSubmitting && !cooldownTime && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/10 to-violet-600/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  )}
                </button>

                {formErrors.submit && (
                  <div className="flex items-center gap-2 text-red-400 text-sm justify-center mt-4 animate-fade-in">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-left">{formErrors.submit}</span>
                  </div>
                )}

                {submitStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-400 text-sm justify-center mt-4 animate-fade-in">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Message sent successfully! I'll get back to you soon.</span>
                  </div>
                )}
                
                {submitStatus === 'error' && !formErrors.submit && (
                  <div className="flex items-center gap-2 text-red-400 text-sm justify-center mt-4 animate-fade-in">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Failed to send message. Please try again or contact me directly.</span>
                  </div>
                )}

                {cooldownTime > 0 && (
                  <div className="text-sm text-slate-400 text-center mt-2 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cooldown: {Math.ceil(cooldownTime / 1000)}s
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="glass-card p-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4 gradient-text">Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-slate-300">Kaiz Nitullano</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:russelnitullano08@gmail.com" className="text-slate-300 hover:text-violet-400 transition-colors">
                      russelnitullano08@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-slate-300">Taguig, Philippines</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:+639154589847" className="text-slate-300 hover:text-violet-400 transition-colors">
                      +63 9636303440
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-4 gradient-text">Social Links</h3>
                <div className="space-y-3">
                  <a href="https://github.com/Down00" target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-3 text-slate-300 hover:text-violet-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                  <a href="https://www.linkedin.com/in/nitullano-russel-l-5a07a0291/" target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-3 text-slate-300 hover:text-violet-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
