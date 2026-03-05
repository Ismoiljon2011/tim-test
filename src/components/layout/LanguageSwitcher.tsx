import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// SVG flag components for cross-platform compatibility (emoji flags don't work on Windows)
function UzFlag({ className = "w-5 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <path fill="#1eb53a" d="M0 320h640v160H0z"/>
      <path fill="#0099b5" d="M0 0h640v160H0z"/>
      <path fill="#ce1126" d="M0 153.6h640v6.4H0zM0 320h640v6.4H0z"/>
      <path fill="#fff" d="M0 160h640v160H0z"/>
      <circle fill="#fff" cx="134.4" cy="76.8" r="57.6"/>
      <circle fill="#0099b5" cx="153.6" cy="76.8" r="57.6"/>
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const row = Math.floor(i / 4);
        const col = i % 4;
        const cx = 224 + col * 24;
        const cy = 32 + row * 28;
        return <circle key={i} fill="#fff" cx={cx} cy={cy} r="6.4"/>;
      })}
    </svg>
  );
}

function GbFlag({ className = "w-5 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <path fill="#012169" d="M0 0h640v480H0z"/>
      <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
      <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
      <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
      <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
    </svg>
  );
}

function RuFlag({ className = "w-5 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <path fill="#fff" d="M0 0h640v160H0z"/>
      <path fill="#0039a6" d="M0 160h640v160H0z"/>
      <path fill="#d52b1e" d="M0 320h640v160H0z"/>
    </svg>
  );
}

const flags: Record<Language, { Flag: React.FC<{ className?: string }>; label: string }> = {
  uz: { Flag: UzFlag, label: "O'zbekcha" },
  en: { Flag: GbFlag, label: 'English' },
  ru: { Flag: RuFlag, label: 'Русский' },
};

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const CurrentFlag = flags[language].Flag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full px-2 gap-1.5">
          <CurrentFlag className="w-5 h-4 rounded-sm overflow-hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(flags) as Language[]).map((lang) => {
          const { Flag, label } = flags[lang];
          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex items-center gap-2 ${language === lang ? 'bg-muted' : ''}`}
            >
              <Flag className="w-5 h-4 rounded-sm overflow-hidden" />
              <span>{label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
