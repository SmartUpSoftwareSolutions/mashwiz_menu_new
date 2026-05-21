import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useActivePromotions } from '@/services/promotionsService';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const Promotions: React.FC = () => {
  const { language } = useLanguage() || { language: 'en' };
  const { data: promotions = [], isLoading } = useActivePromotions();

  return (
    <div className={cn('min-h-screen bg-white', language === 'ar' ? 'text-right' : 'text-left')}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition-colors"
          >
            <ArrowLeft className={cn('h-4 w-4', language === 'ar' ? 'rotate-180' : '')} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {language === 'ar' ? 'العروض' : 'Promotions'}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-gray-500 text-base">
              {language === 'ar' ? 'لا توجد عروض حالياً' : 'No active promotions right now'}
            </p>
          </div>
        ) : (
          <>
            {/* Main slider */}
            <Carousel opts={{ align: 'start', loop: promotions.length > 1, direction: language === 'ar' ? 'rtl' : 'ltr' }} className="w-full">
              <CarouselContent>
                {promotions.map((promo) => (
                  <CarouselItem key={promo.id}>
                    <div className="relative overflow-hidden rounded-2xl shadow-md">
                      <img
                        src={promo.image_url}
                        alt={promo.title || 'promotion'}
                        className="w-full aspect-[16/9] object-cover"
                      />
                      {/* Overlay with amount */}
                      {(promo.amount || promo.title) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                          {promo.title && (
                            <p className="text-white font-bold text-lg leading-tight drop-shadow">
                              {promo.title}
                            </p>
                          )}
                          {promo.amount && (
                            <span className="mt-1 inline-block self-start rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
                              {promo.amount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {promotions.length > 1 && (
                <>
                  <CarouselPrevious className={language === 'ar' ? 'right-2' : 'left-2'} />
                  <CarouselNext className={language === 'ar' ? 'left-2' : 'right-2'} />
                </>
              )}
            </Carousel>

            {/* Dots indicator */}
            {promotions.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {promotions.map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                ))}
              </div>
            )}

            {/* Cards list below slider */}
            <div className="space-y-3">
              {promotions.map((promo) => (
                <div key={promo.id} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                  <img
                    src={promo.image_url}
                    alt={promo.title || 'promotion'}
                    className="h-20 w-28 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex flex-col justify-center gap-1">
                    {promo.title && <p className="font-semibold text-gray-900">{promo.title}</p>}
                    {promo.amount && (
                      <span className="inline-block w-fit rounded-full bg-orange-100 px-2.5 py-0.5 text-sm font-bold text-orange-600">
                        {promo.amount}
                      </span>
                    )}
                    <p className="text-xs text-gray-400">{promo.date_from} — {promo.date_to}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Promotions;
