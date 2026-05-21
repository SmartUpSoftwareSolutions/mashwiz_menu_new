import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface MultipleChoiceOption {
  id: string;
  text_en: string;
  text_ar: string;
}

export interface SurveyQuestion {
  id: string;
  question_en: string;
  question_ar: string;
  question_type: 'rating' | 'text' | 'yes_no' | 'multiple_choice';
  choices: MultipleChoiceOption[] | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  question_id: string;
  rating: number | null;
  text_response: string | null;
  selected_choice: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  session_id: string;
  created_at: string;
  question?: SurveyQuestion;
}

export interface SurveyQuestionFormValues {
  question_en: string;
  question_ar: string;
  question_type: 'rating' | 'text' | 'yes_no' | 'multiple_choice';
  choices?: MultipleChoiceOption[] | null;
  is_active: boolean;
  display_order: number;
}

export interface SurveySubmission {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  responses: {
    question_id: string;
    rating?: number;
    text_response?: string;
    selected_choice?: string;
  }[];
}

export interface SurveySettings {
  id: string;
  description_en: string;
  description_ar: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupedSurveyResponse {
  session_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  responses: SurveyResponse[];
}

export const fetchSurveySettings = async (): Promise<SurveySettings | null> => {
  const res = await api.get<{ success: boolean; data: SurveySettings | null }>('/api/survey/settings');
  return res.data ?? null;
};

export const updateSurveySettings = async (values: Partial<SurveySettings>): Promise<SurveySettings> => {
  const res = await api.patch<{ success: boolean; data: SurveySettings }>('/api/survey/settings', values);
  return res.data;
};

export const fetchActiveQuestions = async (): Promise<SurveyQuestion[]> => {
  const res = await api.get<{ success: boolean; data: SurveyQuestion[] }>('/api/survey/questions/active');
  return res.data ?? [];
};

export const fetchAllQuestions = async (): Promise<SurveyQuestion[]> => {
  const res = await api.get<{ success: boolean; data: SurveyQuestion[] }>('/api/survey/questions');
  return res.data ?? [];
};

export const createQuestion = async (values: SurveyQuestionFormValues): Promise<SurveyQuestion> => {
  const res = await api.post<{ success: boolean; data: SurveyQuestion }>('/api/survey/questions', values);
  return res.data;
};

export const updateQuestion = async (id: string, values: Partial<SurveyQuestionFormValues>): Promise<SurveyQuestion> => {
  const res = await api.patch<{ success: boolean; data: SurveyQuestion }>(`/api/survey/questions/${id}`, values);
  return res.data;
};

export const deleteQuestion = async (id: string): Promise<void> => {
  await api.delete(`/api/survey/questions/${id}`);
};

export const toggleQuestionStatus = async (id: string, is_active: boolean): Promise<SurveyQuestion> =>
  updateQuestion(id, { is_active });

export const submitSurvey = async (submission: SurveySubmission): Promise<void> => {
  await api.post('/api/survey/responses', submission);
};

export const fetchAllResponses = async (): Promise<SurveyResponse[]> => {
  const res = await api.get<{ success: boolean; data: SurveyResponse[] }>('/api/survey/responses');
  return res.data ?? [];
};

export const fetchGroupedResponses = async (): Promise<GroupedSurveyResponse[]> => {
  const responses = await fetchAllResponses();
  const grouped = responses.reduce((acc, response) => {
    if (!acc[response.session_id]) {
      acc[response.session_id] = {
        session_id: response.session_id,
        customer_name: response.customer_name,
        customer_email: response.customer_email,
        customer_phone: response.customer_phone,
        created_at: response.created_at,
        responses: [],
      };
    }
    acc[response.session_id].responses.push(response);
    return acc;
  }, {} as Record<string, GroupedSurveyResponse>);
  return Object.values(grouped).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const deleteResponseSession = async (session_id: string): Promise<void> => {
  await api.delete(`/api/survey/responses/session/${session_id}`);
};

export const useActiveQuestions = () =>
  useQuery({ queryKey: ['surveyQuestions', 'active'], queryFn: fetchActiveQuestions });

export const useAllQuestions = () =>
  useQuery({ queryKey: ['surveyQuestions', 'all'], queryFn: fetchAllQuestions });

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] }),
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<SurveyQuestionFormValues> }) =>
      updateQuestion(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] }),
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] }),
  });
};

export const useToggleQuestionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleQuestionStatus(id, is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surveyQuestions'] }),
  });
};

export const useSubmitSurvey = () => useMutation({ mutationFn: submitSurvey });

export const useGroupedResponses = () =>
  useQuery({ queryKey: ['surveyResponses', 'grouped'], queryFn: fetchGroupedResponses });

export const useDeleteResponseSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResponseSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surveyResponses'] }),
  });
};

export const useSurveySettings = () =>
  useQuery({ queryKey: ['surveySettings'], queryFn: fetchSurveySettings });

export const useUpdateSurveySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSurveySettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surveySettings'] }),
  });
};
