import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Dependent } from '../../types';

interface DependentFormProps {
  dependent?: Dependent | null;
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DependentForm({ dependent, employeeId, onClose, onSuccess }: DependentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: employeeId,
    full_name: dependent?.full_name || '',
    relationship: dependent?.relationship || '',
    date_of_birth: dependent?.date_of_birth || '',
    tax_id: dependent?.tax_id || '',
    cccd: dependent?.cccd || '',
    start_month: dependent?.start_month || '',
    end_month: dependent?.end_month || '',
    is_inactive: dependent?.is_inactive || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      end_month: formData.end_month ? formData.end_month : null,
      tax_id: formData.tax_id ? formData.tax_id : null,
      cccd: formData.cccd ? formData.cccd : null,
    };

    if (dependent?.id) {
      const { error } = await supabase.from('dependents').update(payload).eq('id', dependent.id);
      if (!error) onSuccess();
      else alert(error.message);
    } else {
      const { error } = await supabase.from('dependents').insert([payload]);
      if (!error) onSuccess();
      else alert(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
          <input required type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mối quan hệ</label>
          <input required type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" value={formData.relationship} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })} placeholder="Con ruột, Vợ/Chồng..." />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
          <input required type="date" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mã số thuế (nếu có)</label>
          <input type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" value={formData.tax_id} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Số CCCD (nếu có)</label>
          <input type="text" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" value={formData.cccd} onChange={(e) => setFormData({ ...formData, cccd: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Từ tháng (YYYY-MM)</label>
          <input required type="month" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" value={formData.start_month} onChange={(e) => setFormData({ ...formData, start_month: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Đến tháng (tùy chọn)</label>
          <input type="month" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" value={formData.end_month} onChange={(e) => setFormData({ ...formData, end_month: e.target.value })} />
        </div>
      </div>
      
      <div className="flex items-center mt-4">
        <input
          id="is_inactive"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={formData.is_inactive}
          onChange={(e) => setFormData({ ...formData, is_inactive: e.target.checked })}
        />
        <label htmlFor="is_inactive" className="ml-2 block text-sm text-gray-900">
          Đánh dấu không còn giảm trừ (hết hạn)
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
          {loading ? 'Đang lưu...' : 'Lưu lại'}
        </button>
      </div>
    </form>
  );
}
