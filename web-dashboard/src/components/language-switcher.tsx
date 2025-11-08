'use client';

import { useI18n, type Language } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="language" className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Language / Langue
      </Label>
      <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
        <SelectTrigger id="language" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <span>{option.flag}</span>
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-gray-500">
        {language === 'fr'
          ? 'Changer la langue pour toute l\'application'
          : 'Change the language for the entire application'}
      </p>
    </div>
  );
}
