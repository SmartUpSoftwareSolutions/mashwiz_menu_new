
import React from 'react';
import { Facebook, Mail } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SocialLogin = () => {
  const { t } = useTranslation();

  // Handle social login
  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    toast(`${provider} login`, {
      description: "Social login would be handled by Supabase integration"
    });
  };

  return (
    <div className="mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          {/* <div className="w-full border-t border-gray-300"></div> */}
        </div>
        <div className="relative flex justify-center text-sm">
          {/* <span className="px-2 bg-restaurant-light text-gray-500">
            {t('orConnectWith')}
          </span> */}
        </div>
      </div>
{/*       
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => handleSocialLogin('Facebook')}
          className="flex items-center justify-center gap-2"
        >
          <Facebook className="h-4 w-4 text-[#1877F2]" />
          Facebook
        </Button>
        
        <Button 
          type="button" 
          variant="outline"
          onClick={() => handleSocialLogin('Email')}
          className="flex items-center justify-center gap-2"
        >
          <Mail className="h-4 w-4 text-gray-600" />
          Email
        </Button>
      </div> */}
    </div>
  );
};

export default SocialLogin;
