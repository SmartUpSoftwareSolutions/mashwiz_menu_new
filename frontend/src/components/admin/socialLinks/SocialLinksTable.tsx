import React, { useState, useMemo, useCallback, useEffect, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Pencil, 
  Trash2, 
  Share2, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  Palette,
  Check,
  X,
  Copy,
  ExternalLink,
  Search
} from 'lucide-react';
import { SocialLink } from '@/services/socialLinkServices';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

interface SocialLinksTableProps {
  socialLinks: SocialLink[];
  onEdit: (link: SocialLink) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

// Enhanced color palette with better organization
const COLOR_PALETTE = {
  primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  secondary: ['#DDA0DD', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9'],
  neutral: ['#2C3E50', '#34495E', '#95A5A6', '#BDC3C7', '#ECF0F1'],
  social: ['#3B5998', '#E4405F', '#25D366', '#FF0000', '#1DA1F2'],
  accent: ['#E74C3C', '#9B59B6', '#F39C12', '#1ABC9C', '#16A085']
};

// Enhanced Color Picker Component with Portal
const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  onSave: () => void;
  label: string;
  isLoading?: boolean;
}> = ({ value, onChange, onSave, label, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  // Calculate popup position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 300;
      const popupHeight = 480;
      const padding = 8;

      // Calculate position - prefer showing above if near bottom, otherwise below
      let top = rect.bottom + padding;
      let left = rect.right - popupWidth;

      // Adjust if popup would go off-screen right
      if (left < padding) {
        left = padding;
      }

      // Adjust if popup would go off-screen bottom - show above instead
      if (top + popupHeight > window.innerHeight - padding) {
        top = rect.top - popupHeight - padding;
      }

      // If still off-screen top, center it vertically
      if (top < padding) {
        top = Math.max(padding, (window.innerHeight - popupHeight) / 2);
      }

      setPopupPosition({ top, left });
    }
  }, [isOpen]);

  // Close popup when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    onSave();
    setIsOpen(false);
  };

  const handleCustomColorApply = () => {
    if (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      onChange(customColor);
      onSave();
      setIsOpen(false);
    } else {
      toast.error('Please enter a valid hex color (e.g., #FF0000)');
    }
  };

  const popupContent = isOpen && createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] min-w-[300px] max-w-[320px] rounded-2xl border border-orange-100 bg-white p-4 shadow-2xl"
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
        animation: 'fadeInScale 0.15s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Color Palette</h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 text-slate-400 hover:bg-orange-50 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Current color preview */}
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-orange-50/50 p-3">
        <div
          className="h-10 w-10 rounded-lg border-2 border-orange-200 shadow-inner"
          style={{ backgroundColor: customColor || '#ffffff' }}
        />
        <div>
          <p className="text-xs font-medium text-slate-700">Current Color</p>
          <p className="font-mono text-sm text-orange-600">{customColor || '#ffffff'}</p>
        </div>
      </div>

      {/* Color categories */}
      <div className="mb-4 max-h-[220px] overflow-y-auto pr-1">
        {Object.entries(COLOR_PALETTE).map(([category, colors]) => (
          <div key={category} className="mb-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-orange-500">
              {category}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`h-8 w-8 rounded-lg border-2 transition-all duration-150 hover:scale-110 hover:shadow-md ${
                    value === color
                      ? 'border-orange-600 ring-2 ring-orange-300 ring-offset-1'
                      : 'border-transparent hover:border-orange-200'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Custom color input */}
      <div className="border-t border-orange-100 pt-3">
        <label className="mb-2 block text-xs font-semibold text-slate-800">
          Custom Color
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#RRGGBB"
              className="rounded-lg border-orange-100 bg-white pr-10 font-mono text-sm"
              maxLength={7}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomColorApply();
                }
              }}
            />
            <div
              className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded border border-orange-200"
              style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customColor) ? customColor : '#ffffff' }}
            />
          </div>
          <Button
            size="sm"
            onClick={handleCustomColorApply}
            disabled={!customColor || !/^#[0-9A-Fa-f]{6}$/.test(customColor)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">Format: #RRGGBB (e.g., #FF0000)</p>
      </div>
      
      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="flex-1 border-orange-100 text-slate-600 hover:bg-orange-50"
        >
          <X className="mr-1 h-3 w-3" />
          Close
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success('Color copied to clipboard!');
          }}
          className="flex-1 border-orange-100 text-slate-600 hover:bg-orange-50"
        >
          <Copy className="mr-1 h-3 w-3" />
          Copy
        </Button>
      </div>
    </div>,
    document.body
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-xl border border-orange-100 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 ${isOpen ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200' : ''}`}
            aria-label={label}
          >
            <div 
              className="h-4 w-4 rounded-md border border-orange-200 shadow-sm"
              style={{ backgroundColor: value || '#ffffff' }}
            />
            <Palette className="h-3.5 w-3.5 text-orange-500" />
            {isLoading && (
              <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-orange-500" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
      {popupContent}
    </TooltipProvider>
  );
};

const MemoizedColorPicker = memo(ColorPicker);
MemoizedColorPicker.displayName = 'ColorPicker';

// Enhanced Social Links Table Component
const SocialLinksTableComponent: React.FC<SocialLinksTableProps> = ({
  socialLinks,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const [itemOrderInputs, setItemOrderInputs] = useState<Record<string, string>>({});
  const [colorInputs, setColorInputs] = useState<Record<string, { bgColor: string; textColor: string; borderColor: string }>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: 'platform' | 'url' | 'linksOrder' | 'bgColor' | 'textColor' | 'borderColor';
    direction: 'ascending' | 'descending';
  }>({
    key: 'linksOrder',
    direction: 'ascending',
  });

  // Enhanced platform icon mapping
  const getPlatformIcon = useCallback((platform: string) => {
    const iconMap = {
      facebook: <Facebook className="h-5 w-5 text-blue-600" />,
      instagram: <Instagram className="h-5 w-5 text-pink-600" />,
      whatsapp: <MessageCircle className="h-5 w-5 text-green-500" />,
      google_review: <Star className="h-5 w-5 text-yellow-500" />,
      twitter: <Share2 className="h-5 w-5 text-blue-400" />,
      linkedin: <Share2 className="h-5 w-5 text-blue-700" />,
      youtube: <Share2 className="h-5 w-5 text-red-600" />,
      tiktok: <Share2 className="h-5 w-5 text-black" />,
      pinterest: <Share2 className="h-5 w-5 text-red-500" />,
      snapchat: <Share2 className="h-5 w-5 text-yellow-400" />,
    };
    
    return iconMap[platform.toLowerCase()] || <Share2 className="h-5 w-5 text-gray-500" />;
  }, []);

  // Enhanced URL validation
  const isValidUrl = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle input change for order field with validation
  const handleItemOrderChange = useCallback((id: string, value: string) => {
    // Only allow numbers and empty string
    if (value === '' || /^\d+$/.test(value)) {
      setItemOrderInputs((prev) => ({ ...prev, [id]: value }));
    }
  }, []);

  // Handle input change for color fields with validation
  const handleColorChange = useCallback((id: string, field: 'bgColor' | 'textColor' | 'borderColor', value: string) => {
    setColorInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  // Get current color value with fallback
  const getCurrentColor = useCallback((id: string, field: 'bgColor' | 'textColor' | 'borderColor') => {
    const link = socialLinks.find(l => l.id === id);
    return colorInputs[id]?.[field] || link?.[field] || '#ffffff';
  }, [socialLinks, colorInputs]);

  // Enhanced order saving with better error handling
  const handleItemOrderSave = useCallback(async (id: string) => {
    const rawInput = itemOrderInputs[id]?.trim();
    
    if (!rawInput) {
      // Clear the order if empty
      const originalLink = socialLinks.find(l => l.id === id);
      if (originalLink?.linksOrder) {
        setItemOrderInputs(prev => ({ ...prev, [id]: originalLink.linksOrder?.toString() || '' }));
      }
      return;
    }

    const itemOrder = parseInt(rawInput, 10);
    
    if (isNaN(itemOrder) || itemOrder < 0) {
      toast.error('Please enter a valid positive number for link order');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`${id}-order`]: true }));

    try {
      await api.patch(`/api/social-links/${id}`, { links_order: itemOrder });
      toast.success('Link order updated successfully');
      setItemOrderInputs(prev => ({ ...prev, [id]: itemOrder.toString() }));
    } catch (error: any) {
      toast.error('Failed to update link order: ' + error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`${id}-order`]: false }));
    }
  }, [itemOrderInputs, socialLinks]);

  // Enhanced color saving with better validation
  const handleColorSave = useCallback(async (id: string, field: 'bgColor' | 'textColor' | 'borderColor') => {
    const value = getCurrentColor(id, field).trim();

    if (!value) {
      toast.error(`Please enter a color for ${field}`);
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
      toast.error(`Please enter a valid hex color for ${field} (e.g., #FF0000)`);
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`${id}-${field}`]: true }));

    try {
      await api.patch(`/api/social-links/${id}`, { [field]: value });
      toast.success(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} updated successfully`);
    } catch (error: any) {
      toast.error(`Failed to update ${field}: ` + error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`${id}-${field}`]: false }));
    }
  }, [getCurrentColor]);

  // Enhanced sorting with better type safety
  const requestSort = useCallback((key: typeof sortConfig.key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  }, []);

  // Get sort icon for column headers
  const getSortIcon = useCallback((key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  }, [sortConfig]);

  // Enhanced filtering and sorting
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = socialLinks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(link => 
        link.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      switch (sortConfig.key) {
        case 'linksOrder':
          aValue = a.linksOrder ?? 0;
          bValue = b.linksOrder ?? 0;
          break;
        case 'platform':
          aValue = (a.platform || '').toLowerCase();
          bValue = (b.platform || '').toLowerCase();
          break;
        case 'url':
          aValue = (a.url || '').toLowerCase();
          bValue = (b.url || '').toLowerCase();
          break;
        case 'bgColor':
          aValue = (a.bgColor || '').toLowerCase();
          bValue = (b.bgColor || '').toLowerCase();
          break;
        case 'textColor':
          aValue = (a.textColor || '').toLowerCase();
          bValue = (b.textColor || '').toLowerCase();
          break;
        case 'borderColor':
          aValue = (a.borderColor || '').toLowerCase();
          bValue = (b.borderColor || '').toLowerCase();
          break;
        default:
          aValue = a.linksOrder ?? 0;
          bValue = b.linksOrder ?? 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [socialLinks, sortConfig, searchTerm]);

  // Copy URL to clipboard
  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  }, []);

  const totalLinks = socialLinks.length;
  const filteredCount = filteredAndSortedLinks.length;
  const hasSearch = searchTerm.trim().length > 0;
  const showEmptyState = !isLoading && totalLinks === 0;
  const showFilteredEmptyState = !isLoading && totalLinks > 0 && filteredCount === 0;
  const columnCount = 8;

  useEffect(() => {
    setColorInputs((prev) => {
      const next = { ...prev };
      const linkIds = new Set(socialLinks.map((link) => link.id));

      Object.keys(next).forEach((id) => {
        if (!linkIds.has(id)) {
          delete next[id];
        }
      });

      socialLinks.forEach((link) => {
        if (!next[link.id]) {
          next[link.id] = {
            bgColor: link.bgColor ?? '#ffffff',
            textColor: link.textColor ?? '#1f2937',
            borderColor: link.borderColor ?? '#e2e8f0',
          };
        }
      });

      return next;
    });
  }, [socialLinks]);

  useEffect(() => {
    setItemOrderInputs((prev) => {
      const next: Record<string, string> = {};
      socialLinks.forEach((link) => {
        if (prev[link.id] !== undefined) {
          next[link.id] = prev[link.id];
        }
      });
      return next;
    });
  }, [socialLinks]);

  const handleOpenLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const skeletonRows = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={`social-skeleton-${index}`}>
          <TableCell>
            <div className="flex justify-center">
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-64 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-28 rounded-xl" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-28 rounded-xl" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-28 rounded-xl" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      )),
    []
  );

  const renderTableRows = () => {
    if (isLoading) {
      return skeletonRows;
    }

    if (showEmptyState) {
      return (
        <TableRow>
          <TableCell colSpan={columnCount} className="py-12 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Share2 className="h-10 w-10 text-orange-300" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  No social links yet
                </p>
                <p className="text-xs text-slate-500">
                  Add your first platform to start directing guests.
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (showFilteredEmptyState) {
      return (
        <TableRow>
          <TableCell colSpan={columnCount} className="py-10 text-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Search className="h-8 w-8 text-orange-300" />
              <p className="text-sm font-medium text-slate-700">
                Nothing matches “{searchTerm}”
              </p>
              <p className="text-xs text-slate-500">
                Try a different keyword or clear the search filter.
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredAndSortedLinks.map((link) => {
      const platformLabel = link.platform.replace(/_/g, ' ');
      const currentBgColor = getCurrentColor(link.id, 'bgColor');
      const currentTextColor = getCurrentColor(link.id, 'textColor');
      const currentBorderColor = getCurrentColor(link.id, 'borderColor');

      return (
        <TableRow key={link.id} className="hover:bg-orange-50/35 transition-colors">
          <TableCell className="py-4">
            <div className="flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 via-orange-50 to-white shadow-inner">
                {getPlatformIcon(link.platform)}
              </div>
            </div>
          </TableCell>
          <TableCell className="font-medium text-slate-800">
            <div className="flex items-center gap-2">
              <span className="capitalize">{platformLabel}</span>
              <Badge
                variant="outline"
                className="border-orange-200 bg-orange-50 px-2 text-[11px] uppercase tracking-wide text-orange-600"
              >
                {link.platform}
              </Badge>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`truncate text-sm transition-colors ${
                  isValidUrl(link.url) ? 'text-orange-600 hover:text-orange-700' : 'text-red-500'
                }`}
                title={link.url}
              >
                {link.url}
              </a>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyUrl(link.url)}
                        className="h-7 w-7 rounded-full p-0 text-orange-600 hover:bg-orange-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p>Copy URL</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenLink(link.url)}
                        className="h-7 w-7 rounded-full p-0 text-orange-600 hover:bg-orange-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p>Open in new tab</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={itemOrderInputs[link.id] ?? link.linksOrder?.toString() ?? ''}
                onChange={(event) => handleItemOrderChange(link.id, event.target.value)}
                onBlur={() => handleItemOrderSave(link.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleItemOrderSave(link.id);
                  }
                }}
                className="h-8 w-16 rounded-lg border border-orange-100 bg-white/90 text-center text-sm"
                disabled={loadingStates[`${link.id}-order`]}
                aria-label={`Set order for ${link.platform} link`}
              />
              {loadingStates[`${link.id}-order`] && (
                <div className="flex h-4 w-4 items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-orange-500" />
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full border border-orange-100 shadow-sm"
                style={{ backgroundColor: currentBgColor }}
              />
              <MemoizedColorPicker
                value={currentBgColor}
                onChange={(color) => handleColorChange(link.id, 'bgColor', color)}
                onSave={() => handleColorSave(link.id, 'bgColor')}
                label={`Set background color for ${link.platform} link`}
                isLoading={loadingStates[`${link.id}-bgColor`]}
              />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-100 text-xs font-semibold"
                style={{ color: currentTextColor }}
              >
                Aa
              </span>
              <MemoizedColorPicker
                value={currentTextColor}
                onChange={(color) => handleColorChange(link.id, 'textColor', color)}
                onSave={() => handleColorSave(link.id, 'textColor')}
                label={`Set text color for ${link.platform} link`}
                isLoading={loadingStates[`${link.id}-textColor`]}
              />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full border-2 border-orange-100"
                style={{ borderColor: currentBorderColor }}
              />
              <MemoizedColorPicker
                value={currentBorderColor}
                onChange={(color) => handleColorChange(link.id, 'borderColor', color)}
                onSave={() => handleColorSave(link.id, 'borderColor')}
                label={`Set border color for ${link.platform} link`}
                isLoading={loadingStates[`${link.id}-borderColor`]}
              />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(link)}
                      className="h-8 w-8 rounded-full border-orange-100 text-orange-600 hover:border-orange-200 hover:bg-orange-50"
                      aria-label={`Edit ${link.platform} link`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Edit link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(link.id)}
                      className="h-8 w-8 rounded-full border-orange-100 text-red-500 hover:border-red-200 hover:bg-red-50"
                      aria-label={`Delete ${link.platform} link`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Delete link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">Social Links</h2>
                <Badge
                  variant="outline"
                  className="border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-orange-600"
                >
                  Manage
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                Manage your platforms, ordering, and brand colors for shared buttons.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600"
          >
            Total: {totalLinks}
          </Badge>
          {hasSearch && (
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600"
            >
              Filtered
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white/85 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-300" />
            <Input
              type="text"
              placeholder="Search platforms or URLs..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 rounded-xl border border-orange-100 bg-white/85 pl-10 text-sm focus:border-orange-300 focus:ring-orange-200"
            />
            {hasSearch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1.5 top-1/2 h-7 -translate-y-1/2 rounded-full border border-orange-100 px-3 text-xs text-orange-600 hover:border-orange-200 hover:bg-orange-50"
              >
                Clear
              </Button>
            )}
          </div>
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600"
          >
            Showing {Math.min(filteredCount, totalLinks)} of {totalLinks}
          </Badge>
        </div>

        <Separator className="my-4 bg-orange-100" />

        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-sm">
          <ScrollArea className="w-full">
            <div className="min-w-[960px]">
              <Table>
                <TableHeader className="bg-orange-50/40">
                  <TableRow className="text-[11px] uppercase tracking-wide text-slate-500">
                    <TableHead className="w-[90px]">Icon</TableHead>
                    <TableHead
                      onClick={() => requestSort('platform')}
                      className="cursor-pointer select-none px-4 py-3 hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-1">
                        Platform {getSortIcon('platform')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort('url')}
                      className="cursor-pointer select-none px-4 py-3 hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-1">
                        URL {getSortIcon('url')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort('linksOrder')}
                      className="w-[120px] cursor-pointer select-none px-4 py-3 hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-1">
                        Order {getSortIcon('linksOrder')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort('bgColor')}
                      className="w-[180px] cursor-pointer select-none px-4 py-3 hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-1">
                        Background {getSortIcon('bgColor')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort('textColor')}
                      className="w-[180px] cursor-pointer select-none px-4 py-3 hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-1">
                        Text {getSortIcon('textColor')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort('borderColor')}
                      className="w-[180px] cursor-pointer select-none px-4 py-3 hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-1">
                        Border {getSortIcon('borderColor')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[160px] px-4 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderTableRows()}</TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export const SocialLinksTable = memo(SocialLinksTableComponent);
SocialLinksTable.displayName = 'SocialLinksTable';