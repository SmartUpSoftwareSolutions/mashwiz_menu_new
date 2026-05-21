import React, { useState } from 'react';
import { useAllPromotions, useCreatePromotion, useUpdatePromotion, useDeletePromotion, Promotion } from '@/services/promotionsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Trash2, Edit2, Save, X, Upload, Megaphone } from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  image_url: '',
  amount: '',
  date_from: '',
  date_to: '',
  is_active: true,
};

const AdminPromotions: React.FC = () => {
  const { data: promotions = [], isLoading } = useAllPromotions();
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url || null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
        formData,
        { withCredentials: true }
      );
      return res.data?.fileUrls?.[0] ?? null;
    } catch {
      toast.error('Image upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({ title: p.title || '', image_url: p.image_url, amount: p.amount || '', date_from: p.date_from, date_to: p.date_to, is_active: p.is_active });
    setImagePreview(p.image_url);
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date_from || !form.date_to) { toast.error('Please set date range'); return; }
    if (!form.image_url && !imageFile) { toast.error('Please upload an image'); return; }

    const imageUrl = await uploadImage();
    if (!imageUrl) return;

    const payload = { ...form, image_url: imageUrl };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: payload });
      toast.success('Promotion updated');
    } else {
      await createMutation.mutateAsync(payload);
      toast.success('Promotion created');
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Promotion deleted');
  };

  const handleToggleActive = async (p: Promotion) => {
    await updateMutation.mutateAsync({ id: p.id, data: { is_active: !p.is_active } });
  };

  const today = new Date().toISOString().split('T')[0];
  const isLive = (p: Promotion) => p.is_active && p.date_from <= today && p.date_to >= today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <Megaphone className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            <p className="text-sm text-gray-500">Manage promotional banners shown on the main screen</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Add Promotion
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 border-orange-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Promotion' : 'New Promotion'}</h2>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Title (optional)</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Sale" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Amount / Label (optional)</label>
                <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 20% OFF" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Date From *</label>
                <Input type="date" value={form.date_from} onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Date To *</label>
                <Input type="date" value={form.date_to} onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))} required />
              </div>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Promotion Image *</label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="h-24 w-40 object-cover rounded-xl border" />
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-600 hover:bg-orange-100 transition-colors">
                  <Upload className="w-4 h-4" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-sm text-gray-600">Active</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={uploading || createMutation.isPending || updateMutation.isPending} className="bg-orange-500 hover:bg-orange-600">
                <Save className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Create Promotion'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          No promotions yet. Add your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map(p => (
            <Card key={p.id} className="flex items-center gap-4 p-4">
              <img src={p.image_url} alt={p.title || 'promotion'} className="h-16 w-28 flex-shrink-0 rounded-lg object-cover border" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.title && <span className="font-semibold text-gray-900">{p.title}</span>}
                  {p.amount && <Badge variant="secondary" className="bg-orange-100 text-orange-700">{p.amount}</Badge>}
                  {isLive(p)
                    ? <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
                    : <Badge variant="secondary" className="text-gray-500">Inactive</Badge>}
                </div>
                <p className="mt-1 text-xs text-gray-500">{p.date_from} → {p.date_to}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={p.is_active} onCheckedChange={() => handleToggleActive(p)} />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;
