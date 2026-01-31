import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DotGridProps {
  className?: string;
  dotColor?: string;
  dotSize?: number;
  gap?: number;
  fadeEdges?: boolean;
}

export function DotGrid({ 
  className,
  dotColor = 'hsl(var(--primary) / 0.15)',
  dotSize = 1,
  gap = 20,
  fadeEdges = true,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const cols = Math.ceil(rect.width / gap);
      const rows = Math.ceil(rect.height / gap);
      const mouseRadius = 80;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * gap;
          const y = j * gap;
          
          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          let scale = 1;
          let opacity = 0.15;
          
          if (distance < mouseRadius) {
            const factor = 1 - distance / mouseRadius;
            scale = 1 + factor * 2;
            opacity = 0.15 + factor * 0.35;
          }

          // Edge fade effect
          if (fadeEdges) {
            const edgeFade = Math.min(
              x / 50,
              y / 50,
              (rect.width - x) / 50,
              (rect.height - y) / 50,
              1
            );
            opacity *= Math.max(0.2, edgeFade);
          }

          ctx.beginPath();
          ctx.arc(x, y, dotSize * scale, 0, Math.PI * 2);
          ctx.fillStyle = dotColor.replace('0.15', opacity.toString());
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dotColor, dotSize, gap, fadeEdges]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 pointer-events-auto', className)}
    />
  );
}
