
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebThemes, WebTheme, applyTheme } from '@/services/themeService';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette } from 'lucide-react';

interface ThemeSelectorProps {
  form: any;
  currentThemeId?: string | null;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ form, currentThemeId }) => {
  const { data: themes, isLoading } = useWebThemes();

  const handleThemeChange = (themeId: string) => {
    const selectedTheme = themes?.find(theme => theme.theme_id === themeId);
    if (selectedTheme) {
      // Apply theme immediately for preview
      applyTheme(selectedTheme);
    }
    form.setValue('theme_id', themeId);
  };

  const renderThemePreview = (theme: WebTheme) => (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <div 
          className="w-3 h-3 rounded-full border" 
          style={{ backgroundColor: theme.primary_color }}
        />
        <div 
          className="w-3 h-3 rounded-full border" 
          style={{ backgroundColor: theme.secondary_color }}
        />
        <div 
          className="w-3 h-3 rounded-full border" 
          style={{ backgroundColor: theme.background_color }}
        />
      </div>
      <span>{theme.theme_name}</span>
      {theme.is_default && (
        <span className="text-xs bg-gray-100 px-1 rounded">Default</span>
      )}
    </div>
  );

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <FormField
      control={form.control}
      name="theme_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Website Theme
          </FormLabel>
          <FormControl>
            <Select
              value={field.value || currentThemeId || ''}
              onValueChange={handleThemeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {themes?.map((theme) => (
                  <SelectItem key={theme.theme_id} value={theme.theme_id}>
                    {renderThemePreview(theme)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ThemeSelector;
