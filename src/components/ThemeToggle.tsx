import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Settings, 
  Clock,
  Droplets,
  TreePine,
  Sunset,
  Building2
} from 'lucide-react';
import { useTheme, customThemes } from '../contexts/ThemeContext';

const themeIcons = {
  default: Monitor,
  corporate: Building2,
  ocean: Droplets,
  forest: TreePine,
  sunset: Sunset
};

const themeLabels = {
  default: 'ธีมเริ่มต้น',
  corporate: 'องค์กร',
  ocean: 'มหาสมุทร',
  forest: 'ป่าไผ่',
  sunset: 'พระอาทิตย์ตก'
};

export function ThemeToggle() {
  const { theme, customTheme, resolvedTheme, config, setTheme, setCustomTheme, updateConfig, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleAutoTimeChange = (field: 'darkStart' | 'lightStart', value: string) => {
    updateConfig({
      autoSwitchTime: {
        ...config.autoSwitchTime,
        [field]: value
      }
    });
  };

  const getCurrentThemeIcon = () => {
    if (theme === 'auto') {
      return resolvedTheme === 'dark' ? Moon : Sun;
    }
    return theme === 'dark' ? Moon : Sun;
  };

  const CurrentThemeIcon = getCurrentThemeIcon();
  const CustomThemeIcon = themeIcons[customTheme];

  return (
    <div className="flex items-center gap-2">
      {/* Quick Theme Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70"
        aria-label="สลับโหมดธีม"
        title={`ปัจจุบัน: ${theme === 'auto' ? 'อัตโนมัติ' : theme === 'dark' ? 'มืด' : 'สว่าง'}`}
      >
        <CurrentThemeIcon className="h-4 w-4" />
        <span className="sr-only">สลับโหมดธีม</span>
      </Button>

      {/* Advanced Theme Settings */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70"
            aria-label="ตั้งค่าธีม"
          >
            <CustomThemeIcon className="h-4 w-4 mr-2" />
            <Palette className="h-3 w-3" />
            <span className="sr-only">ตั้งค่าธีม</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ตั้งค่าธีม
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Theme Mode */}
            <div className="space-y-3">
              <Label className="text-base font-medium">โหมดธีม</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-xs">สว่าง</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-xs">มืด</span>
                </Button>
                <Button
                  variant={theme === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('auto')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="text-xs">อัตโนมัติ</span>
                </Button>
              </div>
            </div>

            {/* Custom Theme Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">รูปแบบสี</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(themeIcons).map(([themeKey, IconComponent]) => (
                  <Button
                    key={themeKey}
                    variant={customTheme === themeKey ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCustomTheme(themeKey as any)}
                    className="flex items-center gap-2 justify-start h-auto py-3"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs">{themeLabels[themeKey as keyof typeof themeLabels]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto Mode Settings */}
            {theme === 'auto' && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    ปรับอัตโนมัติตามเวลา
                  </Label>
                  <Switch
                    checked={config.autoMode}
                    onCheckedChange={(checked) => updateConfig({ autoMode: checked })}
                  />
                </div>

                {config.autoMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">เริ่มโหมดมืด</Label>
                      <Input
                        type="time"
                        value={config.autoSwitchTime.darkStart}
                        onChange={(e) => handleAutoTimeChange('darkStart', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">เริ่มโหมดสว่าง</Label>
                      <Input
                        type="time"
                        value={config.autoSwitchTime.lightStart}
                        onChange={(e) => handleAutoTimeChange('lightStart', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Preview */}
            <div className="space-y-3">
              <Label className="text-base font-medium">ตัวอย่าง</Label>
              <div className={`p-4 rounded-lg transition-all duration-300 ${customThemes[customTheme][resolvedTheme].card} ${customThemes[customTheme][resolvedTheme].text}`}>
                <div className={`text-lg font-semibold bg-gradient-to-r ${customThemes[customTheme][resolvedTheme].primary} bg-clip-text text-transparent mb-2`}>
                  ระบบบริหารการเข้างาน
                </div>
                <div className="text-sm opacity-75">
                  ธีม: {themeLabels[customTheme]} • โหมด: {resolvedTheme === 'dark' ? 'มืด' : 'สว่าง'}
                </div>
                <div className={`mt-3 px-3 py-2 rounded-lg ${customThemes[customTheme][resolvedTheme].accent} text-white text-sm`}>
                  ตัวอย่างปุ่ม
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsOpen(false)}>
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
