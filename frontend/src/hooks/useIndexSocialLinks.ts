import { useState, useEffect } from 'react';
import { SocialLink, fetchSocialLinks } from '@/services/socialLinkServices';

export const useIndexSocialLinks = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSocialLinks()
      .then((links) => setSocialLinks(links))
      .catch(() => setSocialLinks([]))
      .finally(() => setLoading(false));
  }, []);

  return { socialLinks, loading };
};
