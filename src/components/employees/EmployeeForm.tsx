import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Employee } from '../../types';

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmployeeForm({ employee, onClose, onSuccess }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_code: employee?.employee_code || '',
    full_name: employee?.full_name || '',
    department: employee?.department || '',
    tax_id: employee?.tax_id || '',
    cccd: employee?.cccd || '',
    is_resigned: employee?.is_resigned || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (employee?.id) {
      const { error } = await supabase
        .from('employees')
        .update(formData)
        .eq('id', employee.id);
      if (!error) onSuccess();
      else alert(error.message);
    } else {
      const { error } = await supabase.from('employees').insert([formData]);
      if (!error) onSuccess();
      else alert(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mã nhân viên</label>
          <input
            required
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
            value={formData.employee_code}
            onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
          <input
            required
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Đơn vị</label>
          <input
            required
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
          <input
            required
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Số CCCD</label>
          <input
            required
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
            value={formData.cccd}
            onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex items-center mt-4">
        <input
          id="is_resigned"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={formData.is_resigned}
          onChange={(e) => setFormData({ ...formData, is_resigned: e.target.checked })}
        />
        <label htmlFor="is_resigned" className="ml-2 block text-sm text-gray-900">
          Đánh dấu đã nghỉ việc
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu lại'}
        </button>
      </div>
    </form>
  );
}
