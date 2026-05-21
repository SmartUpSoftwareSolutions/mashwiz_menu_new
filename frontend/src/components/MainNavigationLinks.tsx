import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu as MenuIcon, User, Store, ClipboardList, Megaphone } from 'lucide-react';
import { useSurveySettings } from '@/services/surveyService';
import LinkButton from '@/components/LinkButton';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMenuBranches, PublicBranch } from '@/services/branchService';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MainNavigationLinks: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLanguage() || { language: 'en' };
  const navigate = useNavigate();
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    if (!value) {
      return fallback;
    }
    return value !== key ? value : fallback;
  };
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [manualBranchCode, setManualBranchCode] = useState('');
  const [manualBranchName, setManualBranchName] = useState('');
  const [selectedBranchCode, setSelectedBranchCode] = useState('');

  const {
    data: branchOptions = [],
    isLoading: isLoadingBranches,
    isError: hasBranchError,
  } = useMenuBranches();

  const { data: surveySettings } = useSurveySettings();
  const isSurveyEnabled = surveySettings?.is_active ?? true;

  const branches = useMemo<PublicBranch[]>(() => branchOptions ?? [], [branchOptions]);
  
  const handleBranchNavigation = useCallback((branch: { code: string; name: string }) => {
    const branchCode = branch.code.trim();
    if (!branchCode) {
      return;
    }

    const params = new URLSearchParams();
    params.set('branch', branchCode);
    if (branch.name) {
      params.set('branchName', branch.name);
    }

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedBranchCode', branchCode);
        if (branch.name) {
          window.localStorage.setItem('selectedBranchName', branch.name);
        }
      }
    } catch (error) {
      console.warn('Unable to persist branch selection', error);
    }

    setIsBranchDialogOpen(false);
    navigate(`/menu?${params.toString()}`);
  }, [navigate]);

  useEffect(() => {
    if (!isBranchDialogOpen) {
      setManualBranchCode('');
      setManualBranchName('');
      return;
    }

    if (!selectedBranchCode && typeof window !== 'undefined') {
      try {
        const storedCode = window.localStorage.getItem('selectedBranchCode');
        if (storedCode && branches.some((branch) => branch.code === storedCode)) {
          setSelectedBranchCode(storedCode);
        }
      } catch (error) {
        console.warn('Unable to preselect stored branch', error);
      }
    }
  }, [isBranchDialogOpen, branches, selectedBranchCode, handleBranchNavigation]);

  const handleManualBranchSubmit = (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedCode = manualBranchCode.trim();
    if (!trimmedCode) {
      return;
    }

    handleBranchNavigation({
      code: trimmedCode,
      name: manualBranchName.trim() || trimmedCode,
    });
  };

  const handleViewMenuClick: React.MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    setIsBranchDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
        <LinkButton
          href="/menu"
          icon={MenuIcon}
          label={t('viewMenu')}
          asComponent={Link}
          onClick={handleViewMenuClick}
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff',
            width: '100%',
            padding: '0.875rem 1.25rem',
            borderRadius: '1rem',
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            boxShadow: '0 4px 14px rgba(234,88,12,0.35)',
            letterSpacing: '0.01em',
          }}
          hoverStyle={{ filter: 'brightness(1.05)' }}
        />

        <LinkButton
          href="/locations"
          icon={MapPin}
          label={t('ourLocations')}
          asComponent={Link}
          style={{
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            color: '#fff',
            width: '100%',
            padding: '0.875rem 1.25rem',
            borderRadius: '1rem',
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
            letterSpacing: '0.01em',
          }}
          hoverStyle={{ filter: 'brightness(1.05)' }}
        />

        <LinkButton
          href="/register"
          icon={User}
          label={t('registerAsCustomer')}
          asComponent={Link}
          style={{
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            color: '#fff',
            width: '100%',
            padding: '0.875rem 1.25rem',
            borderRadius: '1rem',
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
            letterSpacing: '0.01em',
          }}
          hoverStyle={{ filter: 'brightness(1.05)' }}
        />

        <LinkButton
          href="/promotions"
          icon={Megaphone}
          label={language === 'ar' ? 'العروض' : 'Promotions'}
          asComponent={Link}
          style={{
            background: 'linear-gradient(135deg, #fb923c, #f43f5e)',
            color: '#fff',
            width: '100%',
            padding: '0.875rem 1.25rem',
            borderRadius: '1rem',
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            boxShadow: '0 4px 14px rgba(244,63,94,0.3)',
            letterSpacing: '0.01em',
          }}
          hoverStyle={{ filter: 'brightness(1.05)' }}
        />

        {isSurveyEnabled && (
          <LinkButton
            href="/survey"
            icon={ClipboardList}
            label={t('takeSurvey')}
            asComponent={Link}
            style={{
              background: 'linear-gradient(135deg, #34d399, #059669)',
              color: '#fff',
              width: '100%',
              padding: '0.875rem 1.25rem',
              borderRadius: '1rem',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
              letterSpacing: '0.01em',
            }}
            hoverStyle={{ filter: 'brightness(1.05)' }}
          />
        )}
      </div>

      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-500" />
              {t('selectBranch')}
            </DialogTitle>
            <DialogDescription>{t('selectBranchDescription')}</DialogDescription>
          </DialogHeader>

          {isLoadingBranches && branches.length === 0 ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : branches.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {translate('selectBranch', 'Select a branch')}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                {branches.map((branch) => {
                    const isSelected = selectedBranchCode === branch.code;
                    return (
                      <Button
                        key={branch.code}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedBranchCode(branch.code);
                          handleBranchNavigation(branch);
                        }}
                        className={cn(
                          'w-full justify-start rounded-xl border px-4 py-3 text-left transition-all',
                          'focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                          isSelected
                            ? 'border-orange-500 bg-orange-500 text-white shadow-lg'
                            : 'border-orange-200 bg-white text-gray-900 hover:border-orange-300 hover:bg-orange-50'
                        )}
                      >
                        <p className="text-base font-semibold leading-tight">
                          {language === 'ar' && branch.name_ar ? branch.name_ar : branch.name}
                        </p>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBranchDialogOpen(false)}
                >
                  {t('close')}
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleManualBranchSubmit}
              className="rounded-xl border border-dashed border-orange-200 p-6 space-y-4"
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                {hasBranchError ? t('errorLoadingBranches') : t('noBranchesAvailable')}
              </p>
              <div className="space-y-3 text-left">
                <label className="block text-sm font-medium text-gray-700">
                  {t('branchCodeLabel')}
                </label>
                <Input
                  value={manualBranchCode}
                  placeholder={t('enterBranchCode')}
                  onChange={(event) => setManualBranchCode(event.target.value)}
                  required
                />
                <label className="block text-sm font-medium text-gray-700">
                  {t('branchNameOptional')}
                </label>
                <Input
                  value={manualBranchName}
                  placeholder={t('enterBranchNameOptional')}
                  onChange={(event) => setManualBranchName(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBranchDialogOpen(false)}
                >
                  {t('close')}
                </Button>
                <Button type="submit" disabled={!manualBranchCode.trim()}>
                  {t('continue')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MainNavigationLinks;