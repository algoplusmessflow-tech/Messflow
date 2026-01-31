import { useTheme } from 'next-themes';
import messFlowLogoLight from '@/assets/mess-flow-logo-new.png';
import messFlowLogoDark from '@/assets/mess-flow-logo-dark.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ className = "h-12 w-auto", showText = true, textClassName = "text-lg font-bold text-foreground mt-1" }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? messFlowLogoDark : messFlowLogoLight;

  return (
    <div className="flex flex-col items-center">
      <img src={logo} alt="Mess Flow Logo" className={className} />
      {showText && <span className={textClassName}>Mess Flow</span>}
    </div>
  );
}

export function LogoHorizontal({ className = "h-8 w-auto", showText = true, textClassName = "font-bold text-foreground text-sm" }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? messFlowLogoDark : messFlowLogoLight;

  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="Mess Flow Logo" className={className} />
      {showText && <span className={textClassName}>Mess Flow</span>}
    </div>
  );
}