import React, { useState, useMemo } from 'react';
import { useGroupedResponses, useDeleteResponseSession, GroupedSurveyResponse, useAllQuestions } from '@/services/surveyService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, Search, Download, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { MultipleChoiceOption } from '@/services/surveyService';
import { cn } from '@/lib/utils';

const AdminSurveyResponses: React.FC = () => {
  const { data: responses = [], isLoading } = useGroupedResponses();
  const { data: questions = [] } = useAllQuestions();
  const deleteSession = useDeleteResponseSession();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredResponses = useMemo(() => {
    if (!searchTerm.trim()) return responses;
    const term = searchTerm.toLowerCase();
    return responses.filter(r => 
      r.customer_name?.toLowerCase().includes(term) ||
      r.customer_email?.toLowerCase().includes(term) ||
      r.customer_phone?.includes(term)
    );
  }, [responses, searchTerm]);

  const handleDelete = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this survey response?')) {
      try {
        await deleteSession.mutateAsync(sessionId);
        toast.success('Response deleted successfully');
      } catch {
        toast.error('Failed to delete response');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateForExcel = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
  };

  const getResponseValue = (response: GroupedSurveyResponse, questionId: string): string => {
    const r = response.responses.find(res => res.question_id === questionId);
    if (!r) return '';

    const question = r.question;
    if (!question) return '';

    switch (question.question_type) {
      case 'rating':
        return r.rating !== null ? `${r.rating}/10` : '';
      case 'yes_no':
        if (r.rating === 10) return 'Yes';
        if (r.rating === 1) return 'No';
        return '';
      case 'text':
        return r.text_response || '';
      case 'multiple_choice':
        if (!r.selected_choice) return '';
        const choices = question.choices as MultipleChoiceOption[] | null;
        const selectedChoice = choices?.find(c => c.id === r.selected_choice);
        return selectedChoice ? `${selectedChoice.text_en} / ${selectedChoice.text_ar}` : '';
      default:
        return '';
    }
  };

  const getResponseDisplay = (response: GroupedSurveyResponse, questionId: string) => {
    const r = response.responses.find(res => res.question_id === questionId);
    if (!r) return <span className="text-gray-300">—</span>;

    const question = r.question;
    if (!question) return <span className="text-gray-300">—</span>;

    switch (question.question_type) {
      case 'rating':
        if (r.rating === null) return <span className="text-gray-300">—</span>;
        const getRatingColor = (rating: number) => {
          if (rating >= 8) return "bg-emerald-500";
          if (rating >= 5) return "bg-amber-500";
          return "bg-rose-500";
        };
        return (
          <div className="flex items-center gap-1">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
              getRatingColor(r.rating)
            )}>
              {r.rating}
            </div>
          </div>
        );

      case 'yes_no':
        if (r.rating === 10) {
          return <ThumbsUp className="h-4 w-4 text-emerald-500" />;
        } else if (r.rating === 1) {
          return <ThumbsDown className="h-4 w-4 text-rose-500" />;
        }
        return <span className="text-gray-300">—</span>;

      case 'text':
        if (!r.text_response) return <span className="text-gray-300">—</span>;
        return (
          <span className="text-xs text-gray-700 line-clamp-2 max-w-[150px]" title={r.text_response}>
            {r.text_response}
          </span>
        );

      case 'multiple_choice':
        if (!r.selected_choice) return <span className="text-gray-300">—</span>;
        const choices = question.choices as MultipleChoiceOption[] | null;
        const selectedChoice = choices?.find(c => c.id === r.selected_choice);
        if (!selectedChoice) return <span className="text-gray-300">—</span>;
        return (
          <span className="text-xs text-gray-700 line-clamp-1 max-w-[120px]" title={selectedChoice.text_en}>
            {selectedChoice.text_en}
          </span>
        );

      default:
        return <span className="text-gray-300">—</span>;
    }
  };

  const exportToExcel = () => {
    if (filteredResponses.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Build headers
    const headers = [
      'Customer Name',
      'Email',
      'Phone',
      'Submitted Date',
      ...questions.map(q => q.question_en)
    ];

    // Build rows
    const rows = filteredResponses.map(response => [
      response.customer_name || 'Anonymous',
      response.customer_email || '',
      response.customer_phone || '',
      formatDateForExcel(response.created_at),
      ...questions.map(q => getResponseValue(response, q.id))
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
            ? `"${escaped}"` 
            : escaped;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `survey_responses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export successful! Open with Excel.');
  };

  // Get active questions for table columns
  const activeQuestions = useMemo(() => {
    return questions.filter(q => responses.some(r => 
      r.responses.some(res => res.question_id === q.id)
    ));
  }, [questions, responses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Responses</h2>
          <p className="mt-1 text-sm text-gray-600">
            View and manage customer survey submissions ({responses.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <Button 
            onClick={exportToExcel} 
            variant="outline" 
            className="gap-2"
            disabled={filteredResponses.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Responses Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="sticky left-0 bg-gray-50/80 z-10 min-w-[140px]">Customer</TableHead>
                <TableHead className="min-w-[180px]">Contact</TableHead>
                <TableHead className="min-w-[140px]">Date</TableHead>
                {activeQuestions.map(q => (
                  <TableHead key={q.id} className="min-w-[120px]">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium truncate max-w-[120px]" title={q.question_en}>
                        {q.question_en}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[120px]" dir="rtl" title={q.question_ar}>
                        {q.question_ar}
                      </p>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-16" /></TableCell>
                    ))}
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredResponses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4 + activeQuestions.length} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 text-gray-300" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No responses match your search' : 'No survey responses yet'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResponses.map(response => (
                  <TableRow key={response.session_id} className="hover:bg-gray-50/50">
                    <TableCell className="sticky left-0 bg-white z-10 font-medium">
                      {response.customer_name || <span className="text-gray-400">Anonymous</span>}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        {response.customer_email && (
                          <p className="text-gray-600 truncate max-w-[160px]" title={response.customer_email}>
                            {response.customer_email}
                          </p>
                        )}
                        {response.customer_phone && (
                          <p className="text-gray-500">{response.customer_phone}</p>
                        )}
                        {!response.customer_email && !response.customer_phone && (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {formatDate(response.created_at)}
                    </TableCell>
                    {activeQuestions.map(q => (
                      <TableCell key={q.id}>
                        {getResponseDisplay(response, q.id)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(response.session_id)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary Stats */}
      {filteredResponses.length > 0 && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredResponses.length}</span> of{' '}
            <span className="font-semibold">{responses.length}</span> responses
            {searchTerm && <span className="text-gray-400"> (filtered)</span>}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSurveyResponses;
