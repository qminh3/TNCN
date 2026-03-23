import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';

export default function TaxHistory() {
  const [monthYear, setMonthYear] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setMonthYear(`${yyyy}-${mm}`);
  }, []);

  const handleSearch = async () => {
    if (!monthYear) return;
    setLoading(true);
    setHasSearched(true);
    
    const { data: records, error } = await supabase
      .from('income_records')
      .select('*, employees(employee_code, full_name, department, tax_id)')
      .eq('month_year', monthYear);

    if (!error && records) {
      const sorted = records.sort((a, b) => {
        const cA = a.employees?.employee_code || '';
        const cB = b.employees?.employee_code || '';
        return cA.localeCompare(cB);
      });
      setData(sorted);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Lịch sử đóng thuế</h2>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng/Năm</label>
            <input 
              type="month" 
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="block w-48 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm" 
            />
          </div>
          <div>
            <button 
              onClick={handleSearch}
              disabled={loading || !monthYear}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Đang tải...' : 'Xem lịch sử'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã NV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MST</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng thu nhập</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">Thu nhập tính thuế</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50/50">Thuế đã nộp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : !hasSearched ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Vui lòng chọn thời gian và bấm "Xem lịch sử"</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Không có dữ liệu đóng thuế trong tháng {monthYear}</td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.employees?.employee_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.employees?.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.employees?.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.employees?.tax_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{Number(record.total_income).toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-700 text-right bg-gray-50/50">
                      {Number((record.total_income - record.tax_exempt_income - record.insurance_deduction) > 0 ? (record.total_income - record.tax_exempt_income - record.insurance_deduction) : 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-700 text-right bg-red-50/20">{Number(record.calculated_tax).toLocaleString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
