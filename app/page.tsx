
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";



// Import the Course type from the API to ensure consistency
import type { Course as ApiCourse } from '@/lib/api';

// Use the API's Course type with a type alias
type Course = ApiCourse;

function CourseCard({ course }: { course: Course }) {
  const [attendance, setAttendance] = useState<{
    present: number;
    absent: number;
    totel: number;
    persantage: number;
    course?: {
      name: string;
      code: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Import the getCourseAttendance function from our API library
        const { getCourseAttendance } = await import('@/lib/api');
        
        // Fetch attendance data using our API library
        // Convert string ID to number for the API call
        const data = await getCourseAttendance(parseInt(course.id, 10));
        setAttendance(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error fetching attendance");
      }
      
      setLoading(false);
    };
    
    fetchAttendance();
    // We only want to run this effect when the course.id changes
  }, [course.id]);

  let percent = 0;
  let present = 0;
  let absent = 0;
  let total = 0;
  let courseName = course.name;
  let courseCode = course.code;
  let skippableClasses = 0;
  
  if (attendance) {
    present = attendance.present ?? 0;
    absent = attendance.absent ?? 0;
    total = attendance.totel ?? 0;
    percent = attendance.persantage ? Math.round(attendance.persantage) : (total > 0 ? Math.round((present / total) * 100) : 0);
    
    // Calculate how many classes can be skipped while maintaining 75% attendance
    if (total > 0) {
      // When a student skips a class, it increases the total classes (denominator)
      // and doesn't increase present classes (numerator)
      // Formula: present / (total + skippable) >= 0.75
      // Solving for skippable: present / (total + skippable) = 0.75
      // present = 0.75 * (total + skippable)
      // present / 0.75 = total + skippable
      // skippable = present / 0.75 - total
      
      // We use Math.floor to be conservative (always round down)
      const maxSkippable = Math.floor((present / 0.75) - total);
      skippableClasses = Math.max(0, maxSkippable);
    }
    
    if (attendance.course) {
      courseName = attendance.course.name || courseName;
      courseCode = attendance.course.code || courseCode;
    }
  }

  return (
    <div className="rounded-md bg-white border border-gray-200 p-4 flex flex-col gap-2 hover:cursor-pointer card-hover" style={{
      borderLeft: `4px solid ${percent >= 75 ? 'var(--neopop-success)' : percent >= 50 ? 'var(--neopop-warning)' : 'var(--neopop-danger)'}`
    }}>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-800 capitalize font-[family-name:var(--font-playfair)] italic">{courseName.toLowerCase()}</span>
        <span className="ml-auto text-gray-500 text-xs font-[family-name:var(--font-instrument-sans)]">{courseCode}</span>
      </div>
      
      <div className="mt-2">
        {loading ? (
          <div className="py-3">
            <div className="shimmer h-2.5 w-full rounded-full mb-2"></div>
            <div className="flex justify-between">
              <div className="shimmer h-5 w-12 rounded-md"></div>
              <div className="flex gap-2">
                <div className="shimmer h-4 w-16 rounded-full"></div>
                <div className="shimmer h-4 w-16 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-[var(--neopop-danger)] text-xs p-2 rounded-lg font-[family-name:var(--font-instrument-sans)] bg-red-50">{error}</div>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            <div className="w-full bg-gray-100 rounded-full h-2.5 progress-bar overflow-hidden">
              <div 
                className="h-2.5 rounded-full progress-fill" 
                style={{ 
                  width: `${percent}%`, 
                  '--percent': `${percent}%`,
                  background: percent >= 75 
                    ? 'linear-gradient(90deg, #15803d 0%, #22c55e 100%)' 
                    : percent >= 50 
                      ? 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)' 
                      : 'linear-gradient(90deg, #b91c1c 0%, #e02d3c 100%)'
                } as React.CSSProperties}
              ></div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span
                  className="text-2xl font-bold font-[family-name:var(--font-playfair)]"
                  style={{ 
                    color: percent >= 75 
                      ? 'var(--neopop-success)' 
                      : percent >= 50 
                        ? 'var(--neopop-warning)' 
                        : 'var(--neopop-danger)'
                  }}
                >
                  {percent}%
                </span>
                <div className="flex items-center gap-2 font-[family-name:var(--font-instrument-sans)]">
                  <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neopop-success)' }}></span>
                    {present}
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neopop-danger)' }}></span>
                    {absent}
                  </span>
                </div>
              </div>
              
              {/* Skippable Classes Info - Concise Version */}
              {percent >= 75 && skippableClasses > 0 && (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="text-[var(--neopop-success)] font-medium">Can skip {skippableClasses} {skippableClasses === 1 ? 'class' : 'classes'}</span>
                </div>
              )}
              
              {percent < 75 && (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="text-[var(--neopop-danger)] font-medium">Attendance below 75%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [userProfile, setUserProfile] = useState<{first_name: string; last_name: string} | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<{
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.replace("/login");
    }
  }, [router]);
  
  // Handle PWA installation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if the app is already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      //@ts-expect-error
        window.navigator.standalone === true;
      
      // Listen for the beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Store the event so it can be triggered later
        //@ts-expect-error
        setInstallPrompt(e);
        // Show the install button
        setIsInstallable(true);
        console.log('App can be installed!');
      });
      
      // Hide the install button if app is already installed
      if (isStandalone) {
        setIsInstallable(false);
      }
      
      // Listen for successful installation
      window.addEventListener('appinstalled', () => {
        // Hide the install button
        setIsInstallable(false);
        setInstallPrompt(null);
        console.log('PWA was installed');
      });
    }
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoadingProfile(true);
      
      try {
        // Import API functions from our library
        const { getMyProfile, isAuthenticated } = await import('@/lib/api');
        
        // Check if user is authenticated
        if (!isAuthenticated()) {
          router.replace("/login");
          return;
        }
        
        // Fetch user profile
        const profileData = await getMyProfile();
        setUserProfile(profileData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // Fetch courses after login
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      setCoursesError("");
      
      try {
        // Import API functions from our library
        const { getCourses, isAuthenticated } = await import('@/lib/api');
        
        // Check if user is authenticated
        if (!isAuthenticated()) {
          router.replace("/login");
          return;
        }
        
        // Fetch courses using our API library
        const data = await getCourses();
        setCourses(data);
      } catch (e: unknown) {
        setCoursesError(e instanceof Error ? e.message : "Error fetching courses");
      }
      
      setLoadingCourses(false);
    };

    // Check authentication and fetch courses
    fetchCourses();
  }, [router]);

  // Function to handle PWA installation
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the installation prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    // Reset the deferred prompt variable
    setInstallPrompt(null);
    
    // Hide the install button regardless of user choice
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 bg-gray-50 text-black">
      <header className="w-full max-w-4xl mx-auto py-8 flex flex-col gap-2 items-center relative">
        {isInstallable && (
          <button
            onClick={handleInstallClick}
            className="absolute right-0 top-0 bg-[var(--neopop-accent)] text-white text-xs px-3 py-2 rounded-md font-medium flex items-center gap-1 hover:bg-indigo-700 transition-colors animate-fadeIn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Install App
          </button>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 font-[family-name:var(--font-playfair)] italic">Attendance</h1>
        <div className="h-1 w-16 bg-[var(--neopop-accent)] rounded-full my-2"></div>
        <span className="text-base text-gray-500 font-[family-name:var(--font-instrument-sans)] tracking-wide">
          {loadingProfile ? (
            <span className="inline-block w-32 h-5 shimmer rounded-md"></span>
          ) : userProfile ? (
            <>Welcome, <span className="text-gray-700 font-medium">{userProfile.first_name} {userProfile.last_name}</span></>
          ) : (
            <>Welcome, <span className="text-gray-700 font-medium">Student</span></>
          )}
        </span>
      </header>

      {/* Course List */}
      <main className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <section className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-gray-700 font-[family-name:var(--font-instrument-sans)]">
              Your Courses
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--neopop-success)]"></span>
                Good
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--neopop-warning)]"></span>
                Average
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--neopop-danger)]"></span>
                Low
              </span>
            </div>
          </div>
          
          {loadingCourses ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg bg-white shadow-sm p-5 h-40">
                  <div className="shimmer h-6 w-3/4 rounded-md mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="shimmer h-5 w-1/3 rounded-full"></div>
                    <div className="shimmer h-5 w-1/3 rounded-full"></div>
                  </div>
                  <div className="shimmer h-2 w-full rounded-full mb-3"></div>
                  <div className="flex justify-between">
                    <div className="shimmer h-6 w-12 rounded-md"></div>
                    <div className="flex gap-2">
                      <div className="shimmer h-5 w-8 rounded-full"></div>
                      <div className="shimmer h-5 w-8 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : coursesError ? (
            <div className="text-[var(--neopop-danger)] bg-red-50 p-4 rounded-lg font-[family-name:var(--font-instrument-sans)]">
              {coursesError}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {courses.map((course, index) => (
                <div key={course.id} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center font-[family-name:var(--font-instrument-sans)] text-gray-400 bg-white rounded-lg shadow-sm">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <p>No courses found</p>
            </div>
          )}
        </section>
      </main>
      
      <footer className="w-full max-w-4xl mx-auto py-6 text-center text-gray-400 text-xs mt-auto font-[family-name:var(--font-instrument-sans)] border-t border-gray-200">
      &copy; {new Date().getFullYear()} Better Ezygo Dashboard <span className="text-[var(--neopop-accent)]">Made with ❤️ by Joel K George</span>
      </footer>
    </div>
  );
}

  