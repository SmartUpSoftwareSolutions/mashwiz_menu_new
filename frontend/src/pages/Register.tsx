
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import LinkTreeContainer from '@/components/LinkTreeContainer';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RegisterHeader from '@/components/register/RegisterHeader';
import RegisterForm from '@/components/register/RegisterForm';
import SocialLogin from '@/components/register/SocialLogin';

const Register = () => {
  const { t } = useTranslation();

  return (
    <LinkTreeContainer title={t('registerTitle')}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <RegisterHeader />
      <RegisterForm />
      <SocialLogin />
    </LinkTreeContainer>
  );
};

export default Register;
