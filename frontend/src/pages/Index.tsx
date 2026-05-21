import React, { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/hooks/useLanguage';
import { useIndexSocialLinks } from '@/hooks/useIndexSocialLinks';
import MainNavigationLinks from '@/components/MainNavigationLinks';
import SocialLinks from '@/components/SocialLinks';
import { useQuery } from '@tanstack/react-query';
import { fetchRestaurantInfo } from '@/services/restaurantInfoService';
import { Skeleton } from '@/components/ui/skeleton';
import { SocialLink } from '@/services/socialLinkServices';

const Index = () => {
  const defaultLogoPath = '/mashwiz.jpg';
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage() || { language: 'en', setLanguage: () => {} };

  const { socialLinks, loading: loadingSocialLinks } = useIndexSocialLinks();

  const { data: restaurantInfo, isLoading: loadingRestaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: fetchRestaurantInfo,
  });

  const loading = loadingSocialLinks || loadingRestaurantInfo;
  const logoPath = restaurantInfo?.logo_url || defaultLogoPath;

  const [sortConfig] = useState<{ direction: 'ascending' | 'descending' }>({
    direction: 'ascending',
  });

  const sortedSocialLinks = useMemo(() => {
    return [...socialLinks].sort((a: SocialLink, b: SocialLink) => {
      const aOrder = a.linksOrder ?? 0;
      const bOrder = b.linksOrder ?? 0;
      if (aOrder < bOrder) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aOrder > bOrder) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [socialLinks, sortConfig]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-end px-5 pt-5">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:border-orange-300 hover:text-orange-600 transition-colors"
        >
          <span className="text-sm">{language === 'en' ? '🇪🇬' : '🇬🇧'}</span>
          {language === 'en' ? 'AR' : 'EN'}
        </button>
      </div>

      {/* Hero section */}
      <div className="flex flex-col items-center pt-6 pb-8 px-6">
        {/* Logo */}
        <div className="mb-5">
          {loadingRestaurantInfo ? (
            <Skeleton className="h-32 w-32 rounded-2xl" />
          ) : (
            <img
              src={logoPath}
              alt={restaurantInfo?.name || 'Restaurant'}
              className="h-32 w-32 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultLogoPath;
              }}
            />
          )}
        </div>

        {/* Restaurant name */}
        {loadingRestaurantInfo ? (
          <Skeleton className="h-7 w-48 rounded-full mb-2" />
        ) : restaurantInfo?.name ? (
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight text-center">
            {restaurantInfo.name}
          </h1>
        ) : null}

        <div className="mb-3" />

        {/* Slogan */}
        {loadingRestaurantInfo ? (
          <Skeleton className="h-5 w-56 rounded-full" />
        ) : restaurantInfo?.slogan ? (
          <p className="text-sm text-gray-500 text-center italic max-w-xs">
            {restaurantInfo.slogan}
          </p>
        ) : null}
      </div>

      {/* Links section */}
      <div className="flex-1 px-5 pb-10">
        <div className="mx-auto max-w-sm">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <MainNavigationLinks />
              {sortedSocialLinks.length > 0 && (
                <>
                  <div className="my-2" />
                  <SocialLinks socialLinks={sortedSocialLinks} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {restaurantInfo?.name || 'Restaurant'}
      </div>
    </div>
  );
};

export default Index;
