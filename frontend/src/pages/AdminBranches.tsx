import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GitBranch, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Branch { id: string; code: string; name: string; name_ar: string | null }

const fetchBranches = async (): Promise<Branch[]> => {
  const res = await api.get<{ success: boolean; data: Branch[] }>('/api/branches');
  return res.data ?? [];
};

const fetchItemCodes = async (): Promise<string[]> => {
  const res = await api.get<{ success: boolean; data: string[] }>('/api/branches/item-codes');
  return res.data ?? [];
};

const defaultForm = { code: '', name: '', name_ar: '' };

const AdminBranches: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [prefillCode, setPrefillCode] = useState('');
  const [form, setForm] = useState(defaultForm);

  const { data: branches = [], isLoading: loadingBranches } = useQuery({ queryKey: ['admin-branches'], queryFn: fetchBranches });
  const { data: itemCodes = [], isLoading: loadingCodes } = useQuery({ queryKey: ['item-branch-codes'], queryFn: fetchItemCodes });
  const isLoading = loadingBranches || loadingCodes;

  const rows = useMemo(() => {
    const namedMap = new Map(branches.map((b) => [b.code, b]));
    const allCodes = [...new Set([...itemCodes, ...branches.map((b) => b.code)])].sort();
    return allCodes.map((code) => ({ code, branch: namedMap.get(code) ?? null }));
  }, [branches, itemCodes]);

  const saveMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      if (editing) {
        await api.patch(`/api/branches/${editing.id}`, { name: values.name.trim(), name_ar: values.name_ar.trim() || null });
      } else {
        await api.post('/api/branches', { code: values.code.trim().toUpperCase(), name: values.name.trim(), name_ar: values.name_ar.trim() || null });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['menuBranches'] });
      toast.success(editing ? 'Branch updated' : 'Branch saved');
      handleClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['menuBranches'] });
      toast.success('Branch name removed');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const handleOpen = (branch?: Branch, code?: string) => {
    if (branch) {
      setEditing(branch);
      setForm({ code: branch.code, name: branch.name, name_ar: branch.name_ar ?? '' });
    } else {
      setEditing(null);
      const c = code ?? '';
      setPrefillCode(c);
      setForm({ ...defaultForm, code: c });
    }
    setIsOpen(true);
  };

  const handleClose = () => { setIsOpen(false); setEditing(null); setPrefillCode(''); setForm(defaultForm); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.code.trim() || !form.name.trim()) return; saveMutation.mutate(form); };
  const handleDelete = (id: string) => { if (window.confirm('Remove the name for this branch? The code will still appear.')) deleteMutation.mutate(id); };
  const unnamed = rows.filter((r) => !r.branch).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Branches</h1>
        <Button onClick={() => handleOpen()} className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md hover:from-orange-600 hover:to-orange-700">
          <Plus className="mr-2 h-4 w-4" /> Add Branch
        </Button>
      </div>

      {!isLoading && unnamed > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{unnamed} branch code{unnamed > 1 ? 's have' : ' has'} no display name yet. Click <strong>Set Name</strong> to add one.</span>
        </div>
      )}

      <div className="rounded-2xl border border-orange-100 bg-white/90 shadow-lg overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-orange-50">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
            <GitBranch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Branches</h2>
            <p className="text-sm text-gray-500">Codes come from your menu data. Add a display name for each one.</p>
          </div>
          <Badge variant="outline" className="ml-auto border-orange-200 bg-orange-50 text-orange-700">Total: {rows.length}</Badge>
        </div>

        <Table>
          <TableHeader className="bg-orange-50/40">
            <TableRow className="uppercase text-xs tracking-wide text-gray-500">
              <TableHead>Code</TableHead><TableHead>Name (English)</TableHead>
              <TableHead>Name (Arabic)</TableHead><TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 rounded-full" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2"><GitBranch className="h-8 w-8 text-orange-300" /><span>No branch codes found.</span></div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ code, branch }) => (
                <TableRow key={code} className="hover:bg-orange-50/30">
                  <TableCell><Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 font-mono">{code}</Badge></TableCell>
                  <TableCell className="font-medium text-gray-900">{branch ? branch.name : <span className="text-amber-500 text-sm italic">No name set</span>}</TableCell>
                  <TableCell className="text-gray-600" dir="rtl">{branch?.name_ar || '—'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {branch ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(branch)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleOpen(undefined, code)} className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs">Set Name</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Branch Name' : 'Set Branch Name'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Branch Code</label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} disabled={!!editing || !!prefillCode} required className="font-mono uppercase" placeholder="e.g. SHR" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Name (English)</label>
              <Input placeholder="e.g. Sheraton Branch" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Name (Arabic) — optional</label>
              <Input placeholder="e.g. فرع شيراتون" value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} dir="rtl" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending || !form.code.trim() || !form.name.trim()} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700">
                {editing ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBranches;
