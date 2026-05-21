import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/hooks/useLanguage';
import LinkTreeContainer from '@/components/LinkTreeContainer';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, CheckCircle2, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useActiveQuestions, useSubmitSurvey, useSurveySettings } from '@/services/surveyService';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SurveyFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  responses: Record<string, { rating?: number; text_response?: string; selected_choice?: string }>;
}

const Survey: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const { data: questions = [], isLoading } = useActiveQuestions();
  const { data: settings } = useSurveySettings();
  const submitSurvey = useSubmitSurvey();

  
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<SurveyFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    responses: {},
  });

  const handleRatingChange = (questionId: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: { ...prev.responses[questionId], rating },
      },
    }));
  };

  const handleTextChange = (questionId: string, text_response: string) => {
    setFormData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: { ...prev.responses[questionId], text_response },
      },
    }));
  };

  const handleYesNoChange = (questionId: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: { ...prev.responses[questionId], rating: value ? 10 : 1 },
      },
    }));
  };

  const handleChoiceChange = (questionId: string, choiceId: string) => {
    setFormData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: { ...prev.responses[questionId], selected_choice: choiceId },
      },
    }));
  };

  const isFormValid = useMemo(() => {
    // Check if at least one question is answered
    const hasRatingResponse = questions.some(q => 
      q.question_type === 'rating' && formData.responses[q.id]?.rating
    );
    const hasYesNoResponse = questions.some(q => 
      q.question_type === 'yes_no' && formData.responses[q.id]?.rating !== undefined
    );
    const hasChoiceResponse = questions.some(q => 
      q.question_type === 'multiple_choice' && formData.responses[q.id]?.selected_choice
    );
    return hasRatingResponse || hasYesNoResponse || hasChoiceResponse || questions.length === 0;
  }, [questions, formData.responses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const responses = Object.entries(formData.responses).map(([question_id, response]) => ({
      question_id,
      rating: response.rating,
      text_response: response.text_response,
      selected_choice: response.selected_choice,
    }));

    try {
      await submitSurvey.mutateAsync({
        customer_name: formData.customer_name || undefined,
        customer_email: formData.customer_email || undefined,
        customer_phone: formData.customer_phone || undefined,
        responses,
      });
      
      setSubmitted(true);
      toast.success(t('surveySubmitted'));
    } catch {
      toast.error(t('surveySubmitError'));
    }
  };

  if (submitted) {
    return (
      <LinkTreeContainer title={t('surveyTitle')}>
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-4 shadow-lg">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            {t('thankYou')}
          </h2>
          <p className="mb-8 max-w-sm text-gray-600">
            {t('surveyThankYouMessage')}
          </p>
          <Link to="/">
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-2 border-orange-200 px-6 py-3 font-semibold text-orange-600 transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
              {t('backToHome')}
            </Button>
          </Link>
        </div>
      </LinkTreeContainer>
    );
  }

  return (
    <LinkTreeContainer title={t('surveyTitle')}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-orange-600">
        <ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
        {t('backToHome')}
      </Link>

      <div className={cn("w-full", isRtl && "text-right")} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            {settings?.description_en || t('surveyDescription')}
          </p>
          <p className="mt-1 text-sm text-gray-500" dir="rtl">
            {settings?.description_ar || ''}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : settings && !settings.is_active ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-700">{t('surveyUnavailable')}</h3>
            <p className="mb-6 text-gray-500">{t('surveyUnavailableMessage')}</p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
                {t('backToHome')}
              </Button>
            </Link>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">{t('noSurveyQuestions')}</p>
            <Link to="/" className="mt-4 inline-block">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
                {t('backToHome')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Questions */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-800">
                          {question.question_en}
                        </p>
                        <p className="mt-1 text-sm text-gray-500" dir="rtl">
                          {question.question_ar}
                        </p>
                      </div>
                    </div>
                  </div>

                  {question.question_type === 'rating' && (
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleRatingChange(question.id, num)}
                          className={cn(
                            "h-8 w-8 rounded-full text-sm font-semibold transition-all hover:scale-110 focus:outline-none",
                            (formData.responses[question.id]?.rating ?? 0) >= num
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'yes_no' && (
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleYesNoChange(question.id, true)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-medium transition-all",
                          formData.responses[question.id]?.rating === 10
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
                        )}
                      >
                        <ThumbsUp className="h-5 w-5" />
                        {t('yes')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleYesNoChange(question.id, false)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-medium transition-all",
                          formData.responses[question.id]?.rating === 1
                            ? "border-rose-500 bg-rose-50 text-rose-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-rose-300 hover:bg-rose-50"
                        )}
                      >
                        <ThumbsDown className="h-5 w-5" />
                        {t('no')}
                      </button>
                    </div>
                  )}

                  {question.question_type === 'text' && (
                    <Textarea
                      placeholder={t('typeYourAnswer')}
                      value={formData.responses[question.id]?.text_response ?? ''}
                      onChange={e => handleTextChange(question.id, e.target.value)}
                      className="min-h-[100px] resize-none rounded-xl border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                    />
                  )}

                  {question.question_type === 'multiple_choice' && question.choices && (
                    <div className="space-y-2">
                      {question.choices.map(choice => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleChoiceChange(question.id, choice.id)}
                          className={cn(
                            "w-full rounded-xl border-2 p-3 text-left transition-all",
                            formData.responses[question.id]?.selected_choice === choice.id
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                              formData.responses[question.id]?.selected_choice === choice.id
                                ? "border-orange-500 bg-orange-500"
                                : "border-gray-300"
                            )}>
                              {formData.responses[question.id]?.selected_choice === choice.id && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{choice.text_en}</p>
                              <p className="text-sm text-gray-500" dir="rtl">{choice.text_ar}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Optional Customer Info */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5">
              <p className="mb-4 text-sm font-medium text-gray-600">
                {t('optionalInfo')}
              </p>
              <div className="space-y-3">
                <Input
                  placeholder={t('yourName')}
                  value={formData.customer_name}
                  onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
                <Input
                  type="email"
                  placeholder={t('yourEmail')}
                  value={formData.customer_email}
                  onChange={e => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
                <Input
                  type="tel"
                  placeholder={t('yourPhone')}
                  value={formData.customer_phone}
                  onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || submitSurvey.isPending}
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500"
            >
              {submitSurvey.isPending ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {t('submitSurvey')}
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </LinkTreeContainer>
  );
};

export default Survey;

