
// import React, { useMemo } from 'react';
// import { Facebook, Instagram, MessageCircle, Star, Globe, Pencil, Trash2 } from 'lucide-react';
// import LinkButton from '@/components/LinkButton';
// import { useTranslation } from '@/hooks/useTranslation';
// import { Button } from '@/components/ui/button';
// import { SocialLink } from '@/services/socialLinkServices';

// interface SocialLinksProps {
//   socialLinks: SocialLink[];
//   onEdit?: (link: SocialLink) => void;
//   onDelete?: (id: string) => void;
//   isLoading?: boolean;
// }

// const SocialLinks: React.FC<SocialLinksProps> = ({ socialLinks, onEdit, onDelete, isLoading }) => {
//   const { t } = useTranslation();

//   // Sort by linksOrder (ascending) only
//   const sortedSocialLinks = useMemo(() => {
//     return [...socialLinks].sort((a, b) => (a.linksOrder ?? 0) - (b.linksOrder ?? 0));
//   }, [socialLinks]);

//   // Helper: map key to icon
//   const getIcon = (key: string) => {
//     switch (key.toLowerCase()) {
//       case 'facebook':
//         return Facebook;
//       case 'instagram':
//         return Instagram;
//       case 'whatsapp':
//         return MessageCircle;
//       case 'google_review':
//         return Star;
//       default:
//         return Globe;
//     }
//   };

//   // Helper: map key to label
//   const getLabel = (key: string) => {
//     switch (key.toLowerCase()) {
//       case 'facebook':
//         return t('followOnFacebook');
//       case 'instagram':
//         return t('followOnInstagram');
//       case 'whatsapp':
//         return t('chatOnWhatsApp');
//       case 'google_review':
//         return t('leaveGoogleReview');
//       default:
//         return `Visit ${key.charAt(0).toUpperCase()}${key.slice(1)}`;
//     }
//   };

//   // Platform-specific styling for LinkButton
//   const getButtonStyle = (platform: string) => {
//     switch (platform.toLowerCase()) {
//       case 'facebook':
//         return 'bg-[#1877F2] text-white hover:bg-[#1877F2]/90';
//       case 'instagram':
//         return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white';
//       case 'whatsapp':
//         return 'bg-[#25D366] text-white hover:bg-[#25D366]/90';
//       case 'google_review':
//         return 'bg-white text-[#4285F4] border-2 border-[#4285F4] hover:bg-[#4285F4]/10';
//       default:
//         return 'bg-[#000000] text-white hover:bg-[#000000]/90';
//     }
//   };

//   if (isLoading) {
//     return <div className="text-center py-4">Loading...</div>;
//   }

//   if (sortedSocialLinks.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <Globe className="mx-auto h-12 w-12 text-gray-400" />
//         <h3 className="mt-2 text-lg font-medium">No social links found</h3>
//         <p className="mt-1 text-gray-500">Get started by adding a new social link.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {/* Links List */}
//       {sortedSocialLinks.map(({ id, platform, url, linksOrder }) => (
//         <div key={id} className="flex items-center space-x-4">
//           <LinkButton
//             href={url || '#'}
//             icon={getIcon(platform)}
//             label={getLabel(platform)}
//             className={getButtonStyle(platform)}
//           />
//           {onEdit && (
//             <Button variant="outline" size="icon" onClick={() => onEdit({
//               id, platform, url, linksOrder,
//               links_order: undefined
//             })}>
//               <Pencil className="h-4 w-4" />
//             </Button>
//           )}
//           {onDelete && (
//             <Button variant="outline" size="icon" onClick={() => onDelete(id)}>
//               <Trash2 className="h-4 w-4" />
//             </Button>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default SocialLinks;

import React, { useMemo } from 'react';
import { Facebook, Instagram, MessageCircle, Star, Globe, Pencil, Trash2 } from 'lucide-react';
import LinkButton from '@/components/LinkButton';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { SocialLink } from '@/services/socialLinkServices';

interface SocialLinksProps {
  socialLinks: SocialLink[];
  onEdit?: (link: SocialLink) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ socialLinks, onEdit, onDelete, isLoading }) => {
  const { t } = useTranslation();

  const sortedSocialLinks = useMemo(() => {
    return [...socialLinks].sort((a, b) => (a.linksOrder ?? 0) - (b.linksOrder ?? 0));
  }, [socialLinks]);

  const getIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'whatsapp': return MessageCircle;
      case 'google_review': return Star;
      default: return Globe;
    }
  };

  const getLabel = (key: string) => {
    switch (key.toLowerCase()) {
      case 'facebook': return t('followOnFacebook');
      case 'instagram': return t('followOnInstagram');
      case 'whatsapp': return t('chatOnWhatsApp');
      case 'google_review': return t('leaveGoogleReview');
      default: return `Visit ${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-lg font-semibold">Loading...</div>;
  }

  if (sortedSocialLinks.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-xl font-semibold">No social links found</h3>
        <p className="mt-2 text-gray-500">Get started by adding a new social link.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      {sortedSocialLinks.map(({ id, platform, url, linksOrder, bgColor, textColor, hoverBgColor, borderColor }) => (
        <div key={id} className="flex items-center w-full gap-2">
          <LinkButton
            href={url || '#'}
            icon={getIcon(platform)}
            label={getLabel(platform)}
            style={{
              backgroundColor: bgColor || '#111827',
              color: textColor || '#fff',
              border: borderColor ? `2px solid ${borderColor}` : undefined,
              width: '100%',
              padding: '0.875rem 1.25rem',
              borderRadius: '1rem',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              letterSpacing: '0.01em',
            }}
            hoverStyle={{ filter: 'brightness(1.1)' }}
          />
          {onEdit && (
            <Button variant="outline" size="icon" onClick={() => onEdit({
              id, platform, url, linksOrder, bgColor, textColor, hoverBgColor, borderColor,
              links_order: undefined
            })}>
              <Pencil className="h-5 w-5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="icon" onClick={() => onDelete(id)}>
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default SocialLinks;
