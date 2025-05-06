"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course as ApiCourse } from '@/lib/api';
import { motion, AnimatePresence } from "framer-motion";

// Use the API's Course type with a type alias
// and attendance data structure
type Course = ApiCourse & {
  attendance?: {
    present: number;
    absent: number;
    totel: number;
    persantage: number;
  }
};

// Font definitions for consistent styling
const fonts = {
  sans: 'font-[family-name:var(--font-instrument-sans)]',
  serif: 'font-[family-name:var(--font-playfair)]',
  title: 'text-4xl font-bold',
  subtitle: 'text-2xl font-semibold',
  body: 'text-base',
  caption: 'text-sm',
  stat: 'text-5xl font-bold'
};

// Function to get a fun comparison based on attendance percentage
const getFunComparison = (percentage: number) => {
  if (percentage >= 95) {
    return "like a superhero who never misses a call to action!";
  } else if (percentage >= 90) {
    return "impressive! Even the WiFi gets jealous of your connection.";
  } else if (percentage >= 80) {
    return "solid! Like a dependable friend who's always there.";
  } else if (percentage >= 70) {
    return "decent, like showing up to most of the family dinners.";
  } else if (percentage >= 60) {
    return "like a part-time job - present enough to get by.";
  } else {
    return "a bit like a ghost story - more rumor than reality.";
  }
};

export default function WrappedPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [perfectCourses, setPerfectCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (!token) {
          // Redirect to login page with wrapped as the redirect path
          router.replace('/login?redirect=/wrapped');
          return false;
        }
        return true;
      }
      return false;
    };

    async function fetchAllCourses() {
      setLoading(true);
      
      // First check if user is authenticated
      if (!checkAuth()) {
        return; // Stop execution if not authenticated
      }
      
      try {
        // Import all required API functions
        const { 
          getCourses, 
          getCourseAttendance, 
          setDefaultSemester, 
          setDefaultAcademicYear 
        } = await import('@/lib/api');
        
        // First set default semester and academic year to "0"
        await setDefaultSemester("0");
        await setDefaultAcademicYear("0");
        
        // Then fetch courses
        const fetchedCourses = await getCourses();
        
        // Fetch attendance for each course
        const coursesWithAttendance = await Promise.all(
          fetchedCourses.map(async (course: ApiCourse) => {
            try {
              const attendance = await getCourseAttendance(parseInt(course.id, 10));
              return { ...course, attendance } as Course;
            } catch {
              return { ...course } as Course;
            }
          })
        );
        
        // Filter out subjects with 0 classes (not added in the API)
        const validCourses = coursesWithAttendance.filter(course => {
          // Safely check if attendance exists and has valid properties
          const present = course.attendance?.present ?? 0;
          const absent = course.attendance?.absent ?? 0;
          const totalClasses = present + absent;
          return totalClasses > 0;
        });
        
        // Find courses with 100% attendance
        const coursesWithPerfectAttendance = validCourses.filter(course => 
          course.attendance?.persantage === 100
        );
        
        setCourses(validCourses);
        setPerfectCourses(coursesWithPerfectAttendance);
      } catch (e: unknown) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchAllCourses();
  }, [router]);

  // Calculate stats
  const totalPresent = courses.reduce((sum, c) => sum + (c.attendance?.present ?? 0), 0);
  const totalAbsent = courses.reduce((sum, c) => sum + (c.attendance?.absent ?? 0), 0);
  const totalClasses = totalPresent + totalAbsent;
  
  // Fix TypeScript errors by adding null checks
  const bestCourse = courses.reduce((best, course) => {
    if (!best || (course.attendance?.persantage ?? 0) > (best.attendance?.persantage ?? 0)) {
      return course;
    }
    return best;
  }, undefined as Course | undefined);
  
  const worstCourse = courses.reduce((worst, course) => {
    if (!worst || (course.attendance?.persantage ?? 0) < (worst.attendance?.persantage ?? 0)) {
      return course;
    }
    return worst;
  }, undefined as Course | undefined);
  
  // Calculate average attendance across all courses
  const averageAttendance = courses.length > 0 
    ? Math.round(courses.reduce((sum, course) => sum + (course.attendance?.persantage ?? 0), 0) / courses.length) 
    : 0;


  // Function to create a summary image
  const createSummaryImage = () => {
    // Create a canvas element - using Instagram story dimensions (9:16 ratio)
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Could not create image. Your browser may not support this feature.');
      return null;
    }

    // Pool of gradients and footer text color for contrast
    const gradientPool = [
      {
        name: 'Sunset',
        create: (ctx: CanvasRenderingContext2D, w: number) => {
          const radius = w * 0.9;
          const grad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, radius);
          grad.addColorStop(0, '#c2410c'); // deep burnt orange
          grad.addColorStop(0.5, '#e76f1c'); // lighter, but still dark
          grad.addColorStop(1, 'rgba(194,65,12,0)');
          return grad;
        },
        footerColor: '#fff',
      },
      {
        name: 'Aqua',
        create: (ctx: CanvasRenderingContext2D, w: number) => {
          const radius = w * 0.9;
          const grad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, radius);
          grad.addColorStop(0, '#134e4a'); // deep teal
          grad.addColorStop(0.5, '#197e6a'); // lighter, but still dark
          grad.addColorStop(1, 'rgba(19,78,74,0)');
          return grad;
        },
        footerColor: '#fff',
      },
      {
        name: 'Lavender',
        create: (ctx: CanvasRenderingContext2D, w: number) => {
          const radius = w * 0.9;
        const grad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, radius);
        grad.addColorStop(0, 'hsl(238, 98.90%, 63.50%)'); // Lavender with opacity
        grad.addColorStop(0.5, 'hsl(238, 97.00%, 73.90%)'); // Lavender with opacity
        grad.addColorStop(1, 'rgba(230, 230, 250, 0)'); // Transparent
        return grad;
        },
        footerColor: '#fff',
      },
      {
        name: 'Peach',
        create: (ctx: CanvasRenderingContext2D, w: number) => {
          const radius = w * 0.9;
          const grad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, radius);
          grad.addColorStop(0, '#ad3a00'); // dark peach
          grad.addColorStop(0.5, '#e47f3c'); // lighter, but still peachy
          grad.addColorStop(1, 'rgba(173,58,0,0)');
          return grad;
        },
        footerColor: '#fff',
      },
      {
        name: 'Midnight',
        create: (ctx: CanvasRenderingContext2D, w: number) => {
          const radius = w * 0.9;
          const grad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, radius);
          grad.addColorStop(0, '#18181b'); // deep gray-black
          grad.addColorStop(0.5, '#52525b'); // lighter, but still dark
          grad.addColorStop(1, 'rgba(24,24,27,0)');
          return grad;
        },
        footerColor: '#fff',
      }
    ];
    // Randomly pick one gradient from the pool
    const selectedGradient = gradientPool[Math.floor(Math.random() * gradientPool.length)];
    // Fill background with white first
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1080, 1920);
    // Fill only the top 1/4th with the radial gradient
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 1080, 1920);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = selectedGradient.create(ctx, 1080);
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.restore();

    // Add a matching radial gradient at the bottom right corner
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 1080, 1920);
    ctx.closePath();
    ctx.clip();
    // Use the same color stops as the selectedGradient
    // We'll reconstruct the gradient using the same stops
    // Get the color stops from the selectedGradient
    const bottomRadius = 1080 * 0.9;
    const bottomGrad = ctx.createRadialGradient(1080, 1920, 0, 1080, 1920, bottomRadius);
    if (selectedGradient.name === 'Sunset') {
      bottomGrad.addColorStop(0, '#c2410c');
      bottomGrad.addColorStop(0.5, '#e76f1c');
      bottomGrad.addColorStop(1, 'rgba(194,65,12,0)');
    } else if (selectedGradient.name === 'Aqua') {
      bottomGrad.addColorStop(0, '#134e4a');
      bottomGrad.addColorStop(0.5, '#197e6a');
      bottomGrad.addColorStop(1, 'rgba(19,78,74,0)');
    } else if (selectedGradient.name === 'Lavender') {
      bottomGrad.addColorStop(0, 'hsl(238, 98.90%, 63.50%)');
      bottomGrad.addColorStop(0.5, 'hsl(238, 97.00%, 73.90%)');
      bottomGrad.addColorStop(1, 'rgba(230, 230, 250, 0)');
    } else if (selectedGradient.name === 'Peach') {
      bottomGrad.addColorStop(0, '#ad3a00');
      bottomGrad.addColorStop(0.5, '#e47f3c');
      bottomGrad.addColorStop(1, 'rgba(173,58,0,0)');
    } else if (selectedGradient.name === 'Midnight') {
      bottomGrad.addColorStop(0, '#18181b');
      bottomGrad.addColorStop(0.5, '#52525b');
      bottomGrad.addColorStop(1, 'rgba(24,24,27,0)');
    }
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 1920 - bottomRadius, 1080, bottomRadius);
    ctx.restore();

    // Add a simple noise texture instead of SVG for better compatibility
    try {
      // Create a noise pattern directly
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = 128;
      noiseCanvas.height = 128;
      const noiseCtx = noiseCanvas.getContext('2d');
      
      if (noiseCtx) {
        // Fill with transparent black
        noiseCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        noiseCtx.fillRect(0, 0, noiseCanvas.width, noiseCanvas.height);
        
        // Create noise pattern
        const imageData = noiseCtx.getImageData(0, 0, noiseCanvas.width, noiseCanvas.height);
        const data = imageData.data;
        
        // Add noise pixels
        for (let i = 0; i < data.length; i += 4) {
          // Random noise value
          const noise = Math.floor(Math.random() * 255);
          // Apply noise with low opacity
          data[i] = noise;     // R
          data[i + 1] = noise; // G
          data[i + 2] = noise; // B
          data[i + 3] = 15;    // A - low opacity for subtle texture
        }
        
        noiseCtx.putImageData(imageData, 0, 0);
        
        // Apply the noise pattern
        const pattern = ctx.createPattern(noiseCanvas, 'repeat');
        if (pattern) {
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, 1080, 1920);
          ctx.restore();
        }
      }
    } catch (e) {
      console.error('Error creating noise texture:', e);
      // Continue without noise if there's an error
    }

    const ringCenter = { x: canvas.width / 2, y: 0 };
    const ringRadii = [canvas.width * 0.1, canvas.width * 0.2, canvas.width * 0.3, canvas.width * 0.4];

    // Existing top-center white rings
    ringRadii.forEach((radius, index) => {
      ctx.beginPath();
      ctx.arc(ringCenter.x, ringCenter.y, radius, 0, Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 - (index * 0.005)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Add dark-shaded rings on the right side
    const rightRingCenter = { x: 0, y: canvas.height };
    const rightRingRadii = [canvas.width * 0.2, canvas.width * 0.4, canvas.width * 0.6, canvas.width * 0.8];
    rightRingRadii.forEach((radius, index) => {
      ctx.beginPath();
      ctx.arc(rightRingCenter.x, rightRingCenter.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + index * 0.01})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // Additional overlay effect
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // Add text
    ctx.textAlign = 'center';
    ctx.font = 'bold italic 36px "Playfair Display", serif';
    ctx.letterSpacing = '-0.02em';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Better', canvas.width / 2 -6, 50);
    ctx.font = '500 36px  "Instrument Sans", sans-serif';
    ctx.letterSpacing = '-0.02em';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ezygo.', canvas.width / 2, 70);
    
    ctx.textAlign = 'center';

    // Title - using Playfair Display - positioned higher for Instagram story format
    ctx.font = 'italic 72px "Playfair Display", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Life at MEC wrapped', canvas.width / 2, 300);

    ctx.font = 'bold 36px "Instrument Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('2025', canvas.width / 2, 360);

    // Attendance percentage - large and prominent
    ctx.font = '900 200px "Playfair Display", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${averageAttendance.toFixed(0)}%`, canvas.width / 2, 650);

    // Label for attendance
    ctx.font = '32px "Instrument Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Average Attendance', canvas.width / 2, 720);

    // Simple divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 150, 800);
    ctx.lineTo(canvas.width / 2 + 150, 800);
    ctx.stroke();

    // Calculate attendance statistics first
    let worstCourseName = 'N/A';
    let worstCoursePercentage = 100;
    const perfectCourses: string[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;

    if (courses.length > 0) {
      // Calculate total classes, present, and absent
      courses.forEach(course => {
        if (course.attendance) {
          const present = course.attendance.present || 0;
          const absent = course.attendance.absent || 0;
          totalPresent += present;
          totalAbsent += absent;
        }
      });

      // Find worst attendance course
      const worstCourse = courses.reduce((prev, current) => {
        const prevAttendance = prev.attendance ? prev.attendance.persantage || 0 : 0;
        const currentAttendance = current.attendance ? current.attendance.persantage || 0 : 0;
        // Skip courses with 0% attendance as they might be courses not yet started
        if (currentAttendance === 0) return prev;
        return (prevAttendance < currentAttendance) ? prev : current;
      });

      worstCourseName = worstCourse.name || 'N/A';
      worstCoursePercentage = worstCourse.attendance?.persantage || 0;

      // Find perfect attendance courses
      courses.forEach(course => {
        const attendance = course.attendance?.persantage || 0;
        if (attendance >= 100) {
          perfectCourses.push(course.name);
        }
      });
    }

    // Function to draw a rounded rectangle card
    const drawCard = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      // Card background with subtle gradient
      const cardGradient = ctx.createLinearGradient(x, y, x, y + height);
      cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
      ctx.fillStyle = cardGradient;
      ctx.fill();

      // Subtle border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Add row with present and absent class cards - positioned higher
    const smallCardWidth = (canvas.width - 100) / 2; // Two cards with spacing
    const smallCardHeight = 150;
    const leftCardX = 40;
    const rightCardX = canvas.width - 40 - smallCardWidth;
    const smallCardY = 850;

    // Present classes card
    drawCard(leftCardX, smallCardY, smallCardWidth, smallCardHeight, 20);

    ctx.font = 'italic bold 28px "Playfair Display", serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('Present', leftCardX + smallCardWidth/2, smallCardY + 50);

    ctx.font = 'bold 60px "Playfair Display", serif';
    ctx.fillText(`${totalPresent}`, leftCardX + smallCardWidth/2, smallCardY + 110);

    // Absent classes card
    drawCard(rightCardX, smallCardY, smallCardWidth, smallCardHeight, 20);

    ctx.font = 'italic bold 28px "Playfair Display", serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('Absent', rightCardX + smallCardWidth/2, smallCardY + 50);

    ctx.font = 'bold 60px "Playfair Display", serif';
    ctx.fillText(`${totalAbsent}`, rightCardX + smallCardWidth/2, smallCardY + 110);


    // Perfect attendance card (if applicable) - positioned first
    let cardY = 1050;
    const cardWidth = Math.min(900, canvas.width - 80);
    const cardX = (canvas.width - cardWidth) / 2;
    const maxWidth = 700;

    if (perfectCourses.length > 0) {
      // Consistent padding for better visibility
      const cardPadding = 64; // Large padding (consistent across both cards)

      // Calculate card height based on content + padding
      const maxCoursesToShow = Math.min(perfectCourses.length, 3); // Limit to 3 courses
      const itemHeight = 40; // Height for 28px text items (spacing included)
      const headingHeight = 48; // Height for 40px heading + spacing
      const metaHeight = perfectCourses.length > 3 ? 40 : 0; // Space for '+ more' text
      const perfectCardHeight = (cardPadding * 2) + headingHeight + (maxCoursesToShow * itemHeight) + metaHeight;

      // Draw a simple white card
      drawCard(cardX, cardY, cardWidth, perfectCardHeight, 20);

      // Set up text position with double padding at top for breathing room
      const textX = cardX + cardPadding;
      let currentY = cardY + cardPadding * 1.25; // Slightly more than 1x padding at top

      // Save current text alignment
      const originalTextAlign = ctx.textAlign;
      ctx.textAlign = 'left';

      // Heading: 40px Playfair Display, 8pt grid
      ctx.font = '700 40px "Playfair Display", serif';
      ctx.fillStyle = '#101010';
      ctx.fillText('I had perfect attendance for', textX, currentY);
      currentY += 64; // 40px font + 24px spacing (more breathing room)

      // List: 28px Instrument Sans for better readability
      ctx.font = '600 28px "Instrument Sans", sans-serif';
      ctx.fillStyle = '#666666';
      const rowSpacing = 40; // 28px font + 12px spacing
      const coursesToShow = Math.min(perfectCourses.length, 3); // Limit to 3 courses
      const displayPerfect = perfectCourses.slice(0, coursesToShow).map(course => course.toLowerCase());
      displayPerfect.forEach((course, index) => {
        let displayCourse = course;
        if (ctx.measureText(course).width > maxWidth - cardPadding * 2 - 28) {
          let truncated = course;
          while (ctx.measureText(truncated + '...').width > maxWidth - cardPadding * 2 - 28 && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          displayCourse = truncated + '...';
        }
        ctx.fillText(`${index + 1}.`, textX, currentY);
        ctx.fillText(displayCourse, textX + 32, currentY);
        currentY += rowSpacing;
      });

      // Meta/small: 28px Instrument Sans, muted
      if (perfectCourses.length > 3) {
        ctx.font = '600 italic 28px "Instrument Sans", sans-serif';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(`+ ${perfectCourses.length - 3} more`, textX, currentY + 8);
      }

      // Restore original text alignment
      ctx.textAlign = originalTextAlign;

      // Update cardY for the next card
      cardY = cardY + perfectCardHeight + 50;
    }

    // Worst attendance course card - positioned after perfect attendance
    // Calculate exact height needed without extra space
    const cardPadding = 64; // Consistent padding with perfect attendance card
    const titleOffset = cardPadding * 1.25; // Top offset to title (same as perfect attendance)
    const titleToName = 64; // Space from title to course name
    const courseNameHeight = 28; // Height of the course name text
    // Calculate exact height: top padding + title position + title-to-name gap + course name height + bottom padding
    const worstCardHeight = titleOffset + 40 + titleToName + courseNameHeight ;

    drawCard(cardX, cardY, cardWidth, worstCardHeight, 20);

    // Set up text positions
    const textX = cardX + cardPadding;
    let currentY = cardY + cardPadding * 1.25; // Same top padding as perfect attendance

    // Save current text alignment
    const originalTextAlign = ctx.textAlign;
    ctx.textAlign = 'left';

    // Heading: 40px Playfair Display, serif
    ctx.font = '700 40px "Playfair Display", serif';
    ctx.fillStyle = '#101010';
    ctx.fillText('I was close to condonation for', textX, currentY);
    currentY += 64; // 40px + 24px spacing (same as perfect attendance)

    // Course name (may need to be truncated if too long)
    ctx.font = '600 28px "Instrument Sans", sans-serif'; // Match perfect attendance size
    ctx.fillStyle = '#666666';
    let displayName = worstCourseName;
    // Truncate if necessary
    if (ctx.measureText(worstCourseName).width > maxWidth - cardPadding * 2) {
      let truncated = worstCourseName;
      while (ctx.measureText(truncated + '...').width > maxWidth - cardPadding * 2 && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      displayName = truncated + '...';
    }
    ctx.fillText(displayName.toLowerCase(), textX, currentY);
    currentY += 40; // 20px font + 20px spacing

    // Course percentage - positioned to the right side for contrast
    if (worstCoursePercentage <= 78) {
      ctx.textAlign = 'right';
      ctx.font = 'italic 28px "Instrument Sans", sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(`${worstCoursePercentage.toFixed(0)}%`, cardX + cardWidth - cardPadding, currentY - 40); // Position based on currentY
    }

    // Restore original text alignment
    ctx.textAlign = originalTextAlign;

    // Restore original text alignment
    ctx.textAlign = originalTextAlign;

    // Total courses studied section

    // Instagram-style footer
    ctx.font = 'italic 28px "Instrument Sans", sans-serif';
    ctx.fillStyle = selectedGradient.footerColor;
    ctx.textAlign = 'right';
    ctx.fillText('Want to make a wrapped for your attendance?', canvas.width - 64, canvas.height - 130);

    // Add more space before the URL
    ctx.font = 'bold 28px "Instrument Sans", sans-serif';
    ctx.fillStyle = selectedGradient.footerColor;
    ctx.textAlign = 'right';
    ctx.fillText('Head on to betterezygo.vercel.app/wrapped', canvas.width - 64, canvas.height - 80);

    // Add swipe-up indicator like Instagram stories

    return canvas.toDataURL('image/png');
  };

  const captureAndShareSummary = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Generate the image
    const imageUrl = createSummaryImage();
    if (!imageUrl) return;

      // Default: download
      const link = document.createElement('a');
      link.download = 'my-mec-wrapped-2025.png';
      link.href = imageUrl;
      link.click();
    
  };

  // Prepare slides for Apple Music Replay style with minimalist design
  // Consolidate into fewer, more impactful slides
  const slides = [
    // Intro slide - first impression
    {
      bg: "from-[var(--neopop-accent)] to-[var(--neopop-accent-dark)]",
      content: (
        <>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center z-50"
          >
            <motion.div 
              className="w-40 h-40 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-8 overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, boxShadow: [
                "0 0 0 rgba(255, 255, 255, 0)",
                "0 0 20px rgba(255, 255, 255, 0.2)",
                "0 0 0 rgba(255, 255, 255, 0)"
              ] }}
              transition={{ 
                duration: 2, 
                delay: 0.3,
                boxShadow: {
                  repeat: Infinity,
                  duration: 2
                }
              }}
            >
              <motion.div 
                className="text-5xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                🧑🏻‍💻
              </motion.div>
            </motion.div>
            
            <motion.h1 
              className={`text-5xl font-bold text-white mb-4 ${fonts.serif} tracking-tight `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Your Attendance Wrapped
            </motion.h1>
            
            <motion.div 
              className={`text-white/70 ${fonts.body} ${fonts.sans}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              Tap to begin
            </motion.div>
          </motion.div>
        </>
      ),
    },
    {
      bg: "from-[var(--neopop-success)] to-[var(--neopop-accent-light)]",
      content: (
        <>
          <motion.div 
            className="w-full flex flex-col items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-white/60 text-sm uppercase tracking-widest mb-2 apple-music-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Classes Attended
            </motion.div>
            
            <div className="relative mb-6">
              <motion.div 
                className="w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: [
                    "0 0 0 rgba(255, 255, 255, 0)",
                    "0 0 30px rgba(255, 255, 255, 0.15)",
                    "0 0 0 rgba(255, 255, 255, 0)"
                  ]
                }}
                transition={{ 
                  duration: 0.6,
                  boxShadow: {
                    repeat: Infinity,
                    duration: 2
                  }
                }}
              />
              
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                }}
                transition={{ 
                  type: "spring",
                  damping: 15,
                  delay: 0.3,
                  duration: 0.8
                }}
              >
                <span className="text-7xl font-bold apple-music-number text-white">{totalPresent}</span>
              </motion.div>
            </div>
            
            <motion.div 
              className="text-white text-xl font-semibold mb-8 apple-music-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              You showed up and made it count
            </motion.div>
            
            <motion.div 
              className="w-16 h-1 bg-white/30 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 64 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            />
          </motion.div>
        </>
      ),
    },
    {
      bg: "from-[var(--neopop-danger)] to-[var(--neopop-warning)]",
      content: (
        <>
          <motion.div 
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-white/60 text-sm uppercase tracking-widest mb-2 apple-music-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Classes Missed
            </motion.div>
            
            <div className="relative mb-6">
              <motion.div 
                className="w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: [
                    "0 0 0 rgba(255, 255, 255, 0)",
                    "0 0 30px rgba(255, 255, 255, 0.15)",
                    "0 0 0 rgba(255, 255, 255, 0)"
                  ]
                }}
                transition={{ 
                  duration: 0.6,
                  boxShadow: {
                    repeat: Infinity,
                    duration: 2
                  }
                }}
              />
              
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                }}
                transition={{ 
                  type: "spring",
                  damping: 15,
                  delay: 0.3,
                  duration: 0.8
                }}
              >
                <span className="text-7xl font-bold apple-music-number text-white">{totalAbsent}</span>
              </motion.div>
            </div>
            
            <motion.div 
              className="text-white text-xl font-semibold mb-6 apple-music-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Everyone needs a break sometimes
            </motion.div>
            
            <motion.div 
              className="px-6 py-3 bg-white/10 rounded-full text-white/90 text-sm apple-music-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {Math.round((totalAbsent / (totalPresent + totalAbsent)) * 100)}% of your total classes
            </motion.div>
          </motion.div>
        </>
      ),
    },
    {
      bg: "from-[var(--neopop-accent-light)] to-[var(--neopop-accent)]",
      content: (
        <>
          <motion.div 
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-white/60 text-sm uppercase tracking-widest mb-2 apple-music-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Total Classes
            </motion.div>
            
            <div className="relative mb-6">
              <motion.div 
                className="w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: [
                    "0 0 0 rgba(255, 255, 255, 0)",
                    "0 0 30px rgba(255, 255, 255, 0.15)",
                    "0 0 0 rgba(255, 255, 255, 0)"
                  ]
                }}
                transition={{ 
                  duration: 0.6,
                  boxShadow: {
                    repeat: Infinity,
                    duration: 2
                  }
                }}
              />
              
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                }}
                transition={{ 
                  type: "spring",
                  damping: 15,
                  delay: 0.3,
                  duration: 0.8
                }}
              >
                <span className="text-7xl font-bold apple-music-number text-white">{totalClasses}</span>
              </motion.div>
            </div>
            
            <motion.div 
              className="text-white text-xl font-semibold mb-6 apple-music-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Your academic journey in 2025
            </motion.div>
            
            <motion.div 
              className="flex flex-row gap-3 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="h-1 w-12 bg-[var(--neopop-success)] rounded-full"></div>
              <div className="h-1 w-12 bg-[var(--neopop-danger)] rounded-full"></div>
              <div className="h-1 w-12 bg-white/30 rounded-full"></div>
            </motion.div>
          </motion.div>
        </>
      ),
    },
    // Combined course performance slide - shows both best and worst courses


  
    {
      bg: "from-[var(--neopop-success)] to-[var(--neopop-warning)]",
      content: (
        <>
          <motion.div 
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={`text-white/60 text-sm uppercase tracking-widest mb-2 ${fonts.serif}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Top Course
            </motion.div>
            
            {bestCourse && (
              <>
                <motion.div 
                  className="w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 overflow-hidden"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    boxShadow: [
                      "0 0 0 rgba(255, 255, 255, 0)",
                      "0 0 30px rgba(255, 255, 255, 0.15)",
                      "0 0 0 rgba(255, 255, 255, 0)"
                    ]
                  }}                  transition={{ 
                    duration: 0.6,
                    boxShadow: {
                      repeat: Infinity,
                      duration: 2
                    }
                  }}
                >
                  <motion.div 
                    className={`text-4xl font-bold ${fonts.serif} text-white`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    {bestCourse.attendance?.persantage ?? 0}%
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  className={`text-white text-2xl font-semibold mb-3 ${fonts.sans} text-center max-w-xs`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {bestCourse.name}
                </motion.div>
                
                <motion.div 
                  className={`text-white/70 text-lg ${fonts.sans} mb-3`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  {bestCourse.attendance?.present} of {bestCourse.attendance?.totel} classes
                </motion.div>
                
                <motion.div 
                  className={`text-white/80 ${fonts.serif} italic text-center max-w-xs mb-6 text-base`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  You&apos;re {getFunComparison(bestCourse.attendance?.persantage ?? 0)}
                </motion.div>
                
                <motion.div 
                  className="w-40 h-2 bg-white/10 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: 160 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <motion.div 
                    className="h-full bg-white/70 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(bestCourse.attendance?.present || 0) / (bestCourse.attendance?.totel || 1) * 100}%` }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </motion.div>
              </>
            )}
          </motion.div>
        </>
      ),
    },
    {
      bg: "from-[var(--neopop-accent)] to-[var(--neopop-accent-dark)]",
      content: (
        <>
          <motion.div 
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={`text-white/60 text-sm uppercase tracking-widest mb-2 ${fonts.serif}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Needs Improvement
            </motion.div>
            
            {worstCourse && (
              <>
                <motion.div 
                  className="w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 overflow-hidden"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    boxShadow: [
                      "0 0 0 rgba(255, 255, 255, 0)",
                      "0 0 30px rgba(255, 255, 255, 0.15)",
                      "0 0 0 rgba(255, 255, 255, 0)"
                    ]
                  }}                  transition={{ 
                    duration: 0.6,
                    boxShadow: {
                      repeat: Infinity,
                      duration: 2
                    }
                  }}
                >
                  <motion.div 
                    className={`text-4xl font-bold ${fonts.serif} text-white`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    {worstCourse.attendance?.persantage ?? 0}%
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  className={`text-white text-2xl font-semibold mb-3 ${fonts.sans} text-center max-w-xs`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {worstCourse.name}
                </motion.div>
                
                <motion.div 
                  className={`text-white/70 text-lg ${fonts.sans} mb-3`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  {worstCourse.attendance?.present} of {worstCourse.attendance?.totel} classes
                </motion.div>
                
                <motion.div 
                  className={`text-white/80 ${fonts.serif} italic text-center max-w-xs mb-6 text-base`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  Your attendance is {getFunComparison(worstCourse.attendance?.persantage ?? 0)}
                </motion.div>
                
                <motion.div 
                  className="w-40 h-2 bg-white/10 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: 160 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <motion.div 
                    className="h-full bg-white/70 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(worstCourse.attendance?.present || 0) / (worstCourse.attendance?.totel || 1) * 100}%` }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </motion.div>
              </>
            )}
          </motion.div>
        </>
      ),
    },
  {
    bg: "from-[var(--neopop-accent)] to-[var(--neopop-accent-dark)]",
    content: (
      <>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-xl font-[family-name:var(--font-instrument-sans)] text-white/80"
        >
          Your overall attendance
        </motion.div>
        <motion.div 
          initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 70 }}
          className="text-9xl font-black text-white mb-6 font-[family-name:var(--font-playfair)]"
        >
          {totalClasses ? Math.round((totalPresent/totalClasses)*100) : 0}%
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-6 text-2xl text-white font-[family-name:var(--font-instrument-sans)] font-bold"
        >
          That&apos;s a wrap for this year!
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-4 text-white/80 font-[family-name:var(--font-instrument-sans)]"
        >
          Share your results with friends
        </motion.div>
      </>
    ),
  },

  {
    bg: "from-[var(--neopop-accent)] to-[var(--neopop-accent-dark)]",
    content: (
      <>
        <motion.div 
          className="w-full flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          id="summary-slide"
        >

         
          
        
          
          <motion.div 
            className={`text-white/90 ${fonts.sans} text-center max-w-xs mb-4 text-base`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span>Total Classes:</span>
                <span className="font-bold">{totalClasses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Classes Attended:</span>
                <span className="font-bold text-[var(--neopop-success)]">{totalPresent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Attendance:</span>
                <span className="font-bold">{averageAttendance}%</span>
              </div>
              {bestCourse && (
                <div className="flex justify-between items-center">
                  <span>Best Course:</span>
                  <span className="font-bold text-[var(--neopop-success)]">{bestCourse.code}</span>
                </div>
              )}
              {perfectCourses.length > 0 && (
                <div className="flex justify-between items-center">
                  <span>Perfect Attendance:</span>
                  <span className="font-bold">{perfectCourses.length} courses</span>
                </div>
              )}
            </div>
          </motion.div>
          
         
          <motion.div className="flex flex-col gap-3 mt-2 items-center">
 
      <button
        className="px-6 py-3 bg-gradient-to-r from-[var(--neopop-success)] to-[var(--neopop-accent)] rounded-full text-white font-medium text-sm flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all duration-300 z-50 shadow-md"
        onClick={e => captureAndShareSummary(e)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download Wrapped
      </button>
   

</motion.div>
        </motion.div>
      </>
    ),
  },
].filter(Boolean);

  // Define color themes for each slide that will blend together
  const slideThemes = [
    { primary: 'var(--neopop-accent)', secondary: 'var(--neopop-accent-dark)', accent: 'var(--neopop-accent-light)' },
    { primary: 'var(--neopop-success)', secondary: 'var(--neopop-accent-light)', accent: 'white' },
    { primary: 'var(--neopop-danger)', secondary: 'var(--neopop-warning)', accent: 'var(--neopop-accent)' },
    { primary: 'var(--neopop-accent-light)', secondary: 'var(--neopop-accent)', accent: 'var(--neopop-success)' },
    { primary: 'var(--neopop-success)', secondary: 'var(--neopop-accent-light)', accent: 'var(--neopop-warning)' },
    { primary: 'var(--neopop-danger)', secondary: 'var(--neopop-accent)', accent: 'var(--neopop-success)' },
    { primary: 'var(--neopop-accent)', secondary: 'var(--neopop-accent-dark)', accent: 'var(--neopop-warning)' },
  ];
  
  // Calculate the current theme and next theme for smooth transitions
  const currentTheme = slideThemes[slide % slideThemes.length];
  // Show loading animation while data is being fetched
  if (loading) {
    return (
    <div className="h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col relative overflow-hidden">
        {/* Background gradient */}
        <div className="fixed inset-0 z-0" style={{ background: 'linear-gradient(180deg, #000000 0%, #111111 100%)', opacity: 0.95 }} />
        
        {/* Loading animation */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <motion.div 
            className="w-40 h-40 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-8 overflow-hidden"
            animate={{ 
              scale: [0.9, 1, 0.9],
              boxShadow: [
                "0 0 0 rgba(255, 255, 255, 0)",
                "0 0 30px rgba(255, 255, 255, 0.2)",
                "0 0 0 rgba(255, 255, 255, 0)"
              ]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 2,
              boxShadow: {
                repeat: Infinity,
                duration: 2
              }
            }}
          >
            <motion.div 
              className="text-4xl"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            >
              ✨
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl font-bold text-white mb-4 apple-music-text tracking-tight"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Making Your Wrapped
          </motion.h1>
          
          <motion.div className="flex space-x-2 mt-4">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={`dot-${i}`}
                className="w-2 h-2 rounded-full bg-white"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  delay: i * 0.3,
                  ease: "easeInOut" 
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen w-full flex flex-col items-center justify-center apple-music-bg relative overflow-hidden">
      {/* Apple Music style background with subtle gradient - always visible */}
      <div 
        className="fixed inset-0 z-0" 
        style={{
          background: `linear-gradient(180deg, #000000 0%, #111111 100%)`,
          opacity: 0.95,
        }}
      />
      
      {loading ? (
        // Loading animation with Apple Music Replay style
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <motion.div 
            className="w-40 h-40 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-8 overflow-hidden"
            animate={{ 
              scale: [0.9, 1, 0.9],
              boxShadow: [
                "0 0 0 rgba(255, 255, 255, 0)",
                "0 0 30px rgba(255, 255, 255, 0.2)",
                "0 0 0 rgba(255, 255, 255, 0)"
              ]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 2,
              boxShadow: {
                repeat: Infinity,
                duration: 2
              }
            }}
          >
            <motion.div 
              className="text-4xl"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            >
              ✨
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl font-bold text-white mb-4 apple-music-text tracking-tight"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Making Your Wrapped
          </motion.h1>
          
          <motion.div 
            className="flex space-x-2 mt-4"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={`dot-${i}`}
                className="w-2 h-2 rounded-full bg-white"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  delay: i * 0.3,
                  ease: "easeInOut" 
                }}
              />
            ))}
          </motion.div>
        </div>
      ) : (
        <></>
      )}
      
      {/* Subtle animated gradient overlay */}
          <div 
            className="absolute inset-0 z-0 opacity-30" 
            style={{
              background: `radial-gradient(circle at 50% 50%, ${currentTheme.primary}22, transparent 70%)`,
              transition: 'background 1.5s ease-in-out',
              filter: 'blur(50px)',
            }}
          ></div>
      
      {/* Apple Music style progress indicator */}
          <div className="fixed top-6 left-0 w-full px-6 z-20 flex justify-center">
            <div className="w-full max-w-[500px] flex gap-1.5">
              {slides.map((_, idx: number) => (
                <motion.div 
                  key={idx} 
                  className={`h-1 flex-1 rounded-full overflow-hidden ${idx === slide ? 'bg-white' : 'bg-white/20'}`}
                  animate={{ 
                    backgroundColor: idx <= slide ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.2)',
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>
      
      {/* Apple Music Replay logo */}
      <motion.div 
        className="fixed top-12 left-0 w-full text-center z-[100]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-white/80 text-sm font-[family-name:var(--font-instrument-sans)] tracking-widest uppercase">Your Life in</h3>
        <h2 className="text-white text-xl font-bold font-[family-name:var(--font-instrument-sans)]">MEC WRAPPED · 2025</h2>
      </motion.div>
      
      {/* Slide Area - Full Screen */}
      <div className="flex-1 w-full flex items-center justify-center z-50">
        <AnimatePresence mode="sync">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, position: 'absolute' }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center px-6 cursor-pointer select-none relative overflow-hidden`}
            onClick={() => setSlide(slide < slides.length - 1 ? slide + 1 : 0)}
          >
            {/* Dynamic interactive background that uses the slide themes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              {/* Animated fluid gradient overlay - uses current theme */}
              <motion.div 
                className="absolute inset-0 opacity-60" 
                animate={{
                  background: [
                    `radial-gradient(circle at ${50 + Math.sin(Date.now() * 0.001) * 10}% ${50 + Math.cos(Date.now() * 0.001) * 10}%, ${currentTheme.accent}, ${currentTheme.primary})`,
                    `radial-gradient(circle at ${50 - Math.sin(Date.now() * 0.001) * 10}% ${50 - Math.cos(Date.now() * 0.001) * 10}%, ${currentTheme.accent}, ${currentTheme.secondary})`
                  ]
                }}
                transition={{ 
                  duration: 8, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  mixBlendMode: 'soft-light',
                }}
              />
              
              {/* Animated mesh gradient - transitions smoothly between themes */}
              <motion.div 
                className="absolute inset-0 opacity-40" 
                animate={{
                  backgroundImage: `
                    radial-gradient(at ${10 + slide * 10}% 20%, ${currentTheme.primary}cc 0px, transparent 50%),
                    radial-gradient(at ${80 - slide * 5}% 10%, ${currentTheme.secondary}cc 0px, transparent 50%),
                    radial-gradient(at 10% ${70 + slide * 5}%, ${currentTheme.accent}cc 0px, transparent 50%),
                    radial-gradient(at ${90 - slide * 8}% ${80 - slide * 3}%, ${currentTheme.primary}cc 0px, transparent 50%)
                  `
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{
                  mixBlendMode: 'color-dodge',
                }}
              />
              
              {/* Interactive particles - themed and persistent across slides */}
              {[...Array(15)].map((_, i) => (
                <motion.div 
                  key={i}
                  className={`absolute rounded-full blur-xl`}
                  style={{
                    width: `${20 + i * 5}px`,
                    height: `${20 + i * 5}px`,
                    top: `${(i * 8) % 100}%`,
                    left: `${(i * 13) % 100}%`,
                    opacity: 0.05 + (i % 10) * 0.01,
                    background: i % 3 === 0 ? currentTheme.primary : i % 3 === 1 ? currentTheme.secondary : currentTheme.accent,
                    transition: 'background 1.5s ease-in-out',
                  }}
                  animate={{
                    x: Array(6).fill(0).map(() => (Math.random() - 0.5) * 100),
                    y: Array(6).fill(0).map(() => (Math.random() - 0.5) * 100),
                    scale: [1, 1 + Math.random() * 0.5, 1 - Math.random() * 0.3, 1 + Math.random() * 0.2, 1],
                    opacity: [0.1 + (i % 10) * 0.02, 0.2 + (i % 10) * 0.03, 0.1 + (i % 10) * 0.01],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 10 + i * 2, 
                    ease: "easeInOut", 
                    delay: i * 0.2,
                    repeatType: "reverse"
                  }}
                />
              ))}
              
              {/* Large fluid blobs - themed */}
              <motion.div 
                className="absolute w-[120%] h-[120%] left-[-10%] top-[-10%] opacity-20"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${currentTheme.primary} 0%, transparent 60%)`,
                  filter: 'blur(60px)',
                  transition: 'background 1.5s ease-in-out',
                }}
                animate={{
                  scale: [1, 1.1, 0.95, 1.05, 1],
                  rotate: [0, 5, -3, 2, 0],
                  x: [0, 20, -15, 10, 0],
                  y: [0, -15, 10, -5, 0],
                }}
                transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
              />
              
              {/* Secondary fluid blob - with accent color */}
              <motion.div 
                className="absolute w-[100%] h-[100%] right-[-20%] bottom-[-20%] opacity-10"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${currentTheme.accent} 0%, transparent 70%)`,
                  filter: 'blur(60px)',
                  transition: 'background 1.5s ease-in-out',
                }}
                animate={{
                  scale: [1, 0.95, 1.05, 0.98, 1],
                  opacity: [0.1, 0.15, 0.1],
                }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
              />
              
              {/* Animated noise texture with better blend mode */}
              <div 
                className="absolute inset-0 opacity-10" 
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  animation: 'noisePan 12s infinite linear',
                  mixBlendMode: 'soft-light',
                }}
              />
              
              {/* Animated lines - with theme colors */}
              <div className="absolute inset-0 overflow-hidden opacity-5">
                {[...Array(4)].map((_, i) => (
                  <motion.div 
                    key={`line-${i}`}
                    className="absolute h-[1px]"
                    style={{
                      width: `${40 + i * 15}%`,
                      top: `${(i * 25) % 100}%`,
                      left: `${i % 2 === 0 ? 0 : 'auto'}`,
                      right: `${i % 2 === 0 ? 'auto' : 0}`,
                      opacity: 0.1 + (i % 5) * 0.02,
                      background: 'rgba(255, 255, 255, 0.3)',
                    }}
                    animate={{
                      scaleY: [1, 1.5, 1],
                      opacity: [0.05, 0.15, 0.05],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4 + i, 
                      ease: "easeInOut", 
                      delay: i * 0.5,
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Content */}
            {slides[slide]?.content}
            
            {/* Back button on last slide */}
            {slide === slides.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();  // Stop the click from bubbling up to the slide
                }}
                className="z-20 relative"  // Ensure button is above other elements
              >
                <button
                  className="mt-12 px-8 py-3 bg-white text-[var(--neopop-accent)] rounded-full font-bold shadow-lg hover:bg-[var(--neopop-accent-light)] hover:text-white transition-colors neopop-button"
                  onClick={(e) => {
                    e.stopPropagation();  // Extra protection against bubbling
                    router.push("/");  // Navigate to dashboard
                  }}
                >
                  Back to Dashboard
                </button>
              </motion.div>
            )}
            
            {/* Tap hint on first slide */}
            {slide === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute bottom-8 text-white/70 text-sm font-[family-name:var(--font-instrument-sans)]"
              >
                Tap anywhere to continue
              </motion.div>
            )}
            

          </motion.div>
        </AnimatePresence>
      </div>
      
      </div>
      
      {/* Add CSS for the marquee animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
          width: fit-content;
        }
      `}</style>
    </>
  );
}
