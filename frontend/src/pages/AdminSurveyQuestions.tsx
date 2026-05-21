import React, { useState, useEffect } from 'react';
import { 
  useAllQuestions, 
  useCreateQuestion, 
  useUpdateQuestion, 
  useDeleteQuestion, 
  useToggleQuestionStatus,
  useSurveySettings,
  useUpdateSurveySettings,
  SurveyQuestion,
  SurveyQuestionFormValues,
  MultipleChoiceOption
} from '@/services/surveyService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Star, MessageSquare, ThumbsUp, ListChecks, X, Settings, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const questionTypeIcons = {
  rating: Star,
  text: MessageSquare,
  yes_no: ThumbsUp,
  multiple_choice: ListChecks,
};

const questionTypeLabels = {
  rating: 'Rating (1-10)',
  text: 'Text Response',
  yes_no: 'Yes / No',
  multiple_choice: 'Multiple Choice',
};

const AdminSurveyQuestions: React.FC = () => {
  const { data: questions = [], isLoading } = useAllQuestions();
  const { data: settings } = useSurveySettings();
  const updateSettings = useUpdateSurveySettings();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const toggleStatus = useToggleQuestionStatus();

  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [surveyEnabled, setSurveyEnabled] = useState(true);

  const MAX_QUESTIONS = 10;
  const canAddMore = questions.length < MAX_QUESTIONS;

  useEffect(() => {
    if (settings) {
      setDescriptionEn(settings.description_en);
      setDescriptionAr(settings.description_ar);
      setSurveyEnabled(settings.is_active);
    }
  }, [settings]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [formData, setFormData] = useState<SurveyQuestionFormValues>({
    question_en: '',
    question_ar: '',
    question_type: 'rating',
    choices: [],
    is_active: true,
    display_order: 0,
  });

  const isPending = createQuestion.isPending || updateQuestion.isPending;

  const handleOpenDialog = (question?: SurveyQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question_en: question.question_en,
        question_ar: question.question_ar,
        question_type: question.question_type as 'rating' | 'text' | 'yes_no' | 'multiple_choice',
        choices: question.choices || [],
        is_active: question.is_active,
        display_order: question.display_order,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        question_en: '',
        question_ar: '',
        question_type: 'rating',
        choices: [],
        is_active: true,
        display_order: questions.length,
      });
    }
    setIsDialogOpen(true);
  };

  const addChoice = () => {
    const newChoice: MultipleChoiceOption = {
      id: crypto.randomUUID(),
      text_en: '',
      text_ar: '',
    };
    setFormData(prev => ({
      ...prev,
      choices: [...(prev.choices || []), newChoice],
    }));
  };

  const updateChoice = (id: string, field: 'text_en' | 'text_ar', value: string) => {
    setFormData(prev => ({
      ...prev,
      choices: (prev.choices || []).map(choice =>
        choice.id === id ? { ...choice, [field]: value } : choice
      ),
    }));
  };

  const removeChoice = (id: string) => {
    setFormData(prev => ({
      ...prev,
      choices: (prev.choices || []).filter(choice => choice.id !== id),
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        description_en: descriptionEn,
        description_ar: descriptionAr,
        is_active: surveyEnabled,
      });
      toast.success('Survey settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleToggleSurvey = async (enabled: boolean) => {
    setSurveyEnabled(enabled);
    try {
      await updateSettings.mutateAsync({ is_active: enabled });
      toast.success(enabled ? 'Survey enabled' : 'Survey disabled');
    } catch (error) {
      console.error('Failed to update survey status:', error);
      toast.error('Failed to update survey status');
      setSurveyEnabled(!enabled);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({ id: editingQuestion.id, values: formData });
        toast.success('Question updated successfully');
      } else {
        await createQuestion.mutateAsync(formData);
        toast.success('Question created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(`Failed to ${editingQuestion ? 'update' : 'create'} question`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question? All associated responses will also be deleted.')) {
      try {
        await deleteQuestion.mutateAsync(id);
        toast.success('Question deleted successfully');
      } catch {
        toast.error('Failed to delete question');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleStatus.mutateAsync({ id, is_active: !currentStatus });
      toast.success(`Question ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle question status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Questions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your survey questions with bilingual support (English & Arabic)
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="gap-2"
          disabled={!canAddMore}
          title={!canAddMore ? `Maximum ${MAX_QUESTIONS} questions allowed` : undefined}
        >
          <Plus className="h-4 w-4" />
          Add Question ({questions.length}/{MAX_QUESTIONS})
        </Button>
      </div>

      {/* Survey Settings */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Survey Settings</h3>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-gray-50 px-4 py-2">
            <span className="text-sm font-medium text-gray-700">Survey Status:</span>
            <Switch
              checked={surveyEnabled}
              onCheckedChange={handleToggleSurvey}
            />
            <span className={cn(
              "text-sm font-semibold",
              surveyEnabled ? "text-emerald-600" : "text-gray-500"
            )}>
              {surveyEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {!surveyEnabled && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            ⚠️ The survey is currently disabled. Customers will not be able to access it.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description (English)</label>
            <Textarea
              value={descriptionEn}
              onChange={e => setDescriptionEn(e.target.value)}
              placeholder="Enter survey description in English..."
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description (Arabic)</label>
            <Textarea
              value={descriptionAr}
              onChange={e => setDescriptionAr(e.target.value)}
              placeholder="أدخل وصف الاستبيان بالعربية..."
              dir="rtl"
              className="min-h-[80px] text-right"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleSaveSettings} 
            disabled={updateSettings.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? 'Saving...' : 'Save Description'}
          </Button>
        </div>
      </div>

      {/* Questions Table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="w-24 text-center">Active</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-5 w-10" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No questions yet. Click "Add Question" to create your first survey question.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question, index) => {
                const TypeIcon = questionTypeIcons[question.question_type as keyof typeof questionTypeIcons] || Star;
                return (
                  <TableRow 
                    key={question.id}
                    className={cn(
                      "transition-colors",
                      !question.is_active && "bg-gray-50 opacity-60"
                    )}
                  >
                    <TableCell className="font-medium text-gray-500">
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-gray-300" />
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{question.question_en}</p>
                        <p className="text-sm text-gray-500" dir="rtl">{question.question_ar}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {questionTypeLabels[question.question_type as keyof typeof questionTypeLabels]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={question.is_active}
                        onCheckedChange={() => handleToggleStatus(question.id, question.is_active)}
                        disabled={toggleStatus.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(question)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(question.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion 
                ? 'Update your survey question in both languages.' 
                : 'Create a new survey question with English and Arabic translations.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* English Question */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Question (English) <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.question_en}
                  onChange={e => setFormData(prev => ({ ...prev, question_en: e.target.value }))}
                  placeholder="Enter the question in English..."
                  required
                  className="min-h-[100px]"
                />
              </div>

              {/* Arabic Question */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Question (Arabic) <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.question_ar}
                  onChange={e => setFormData(prev => ({ ...prev, question_ar: e.target.value }))}
                  placeholder="أدخل السؤال بالعربية..."
                  required
                  dir="rtl"
                  className="min-h-[100px] text-right"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Question Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Question Type</label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value: 'rating' | 'text' | 'yes_no') => 
                    setFormData(prev => ({ ...prev, question_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Rating (1-10)
                      </div>
                    </SelectItem>
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Text Response
                      </div>
                    </SelectItem>
                    <SelectItem value="yes_no">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Yes / No
                      </div>
                    </SelectItem>
                    <SelectItem value="multiple_choice">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Multiple Choice
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Display Order</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="flex h-10 items-center gap-3 rounded-md border bg-gray-50 px-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    formData.is_active ? "text-emerald-600" : "text-gray-500"
                  )}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Multiple Choice Options */}
            {formData.question_type === 'multiple_choice' && (
              <div className="space-y-4 rounded-lg border bg-gray-50/50 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Choices <span className="text-red-500">*</span>
                  </label>
                  <Button type="button" size="sm" variant="outline" onClick={addChoice} className="gap-1">
                    <Plus className="h-3 w-3" />
                    Add Choice
                  </Button>
                </div>
                
                {(formData.choices || []).length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No choices added yet. Click "Add Choice" to create options.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(formData.choices || []).map((choice, index) => (
                      <div key={choice.id} className="flex items-start gap-2 rounded-lg border bg-white p-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                          {index + 1}
                        </span>
                        <div className="flex-1 grid gap-2 sm:grid-cols-2">
                          <Input
                            placeholder="Choice (English)"
                            value={choice.text_en}
                            onChange={e => updateChoice(choice.id, 'text_en', e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="الخيار (بالعربية)"
                            value={choice.text_ar}
                            onChange={e => updateChoice(choice.id, 'text_ar', e.target.value)}
                            dir="rtl"
                            className="text-sm text-right"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeChoice(choice.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || (formData.question_type === 'multiple_choice' && (!formData.choices || formData.choices.length < 2))}
              >
                {isPending ? 'Saving...' : editingQuestion ? 'Update Question' : 'Create Question'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSurveyQuestions;

