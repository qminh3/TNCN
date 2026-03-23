import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { Upload, Save, RefreshCw } from 'lucide-react';

export default function TaxCalculation() {
  const [monthYear, setMonthYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateTax = (assessableIncome: number) => {
    if (assessableIncome <= 0) return 0;
    if (assessableIncome <= 5000000) return assessableIncome * 0.05;
    if (assessableIncome <= 10000000) return (assessableIncome * 0.10) - 250000;
    if (assessableIncome <= 18000000) return (assessableIncome * 0.15) - 750000;
    if (assessableIncome <= 32000000) return (assessableIncome * 0.20) - 1650000;
    if (assessableIncome <= 52000000) return (assessableIncome * 0.25) - 3250000;
    if (assessableIncome <= 80000000) return (assessableIncome * 0.30) - 5850000;
    return (assessableIncome * 0.35) - 9850000;
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!monthYear) {
      alert('Vui lòng chọn Tháng/Năm trước khi import file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setCalculating(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Fetch employees and valid dependents
        const [{ data: employees }, { data: dependents }] = await Promise.all([
          supabase.from('employees').select('id, employee_code, full_name, tax_id'),
          supabase.from('dependents').select('*')
            .eq('is_inactive', false)
            .lte('start_month', monthYear)
            .or(`end_month.is.null,end_month.gte.${monthYear}`)
        ]);

        if (!employees) throw new Error('Không thể tải danh sách nhân viên từ DB');

        const results = data.map((row: any) => {
          const maNV = String(row['MaNV'] || row['Mã nhân viên'] || '');
          const emp = employees.find(e => e.employee_code === maNV);
          
          if (!emp) {
            return {
              error: `Không tìm thấy nhân viên mã ${maNV}`,
              maNV,
              hoTen: row['HoTen'] || row['Họ tên'],
            };
          }

          const empDependents = dependents?.filter(d => d.employee_id === emp.id) || [];
          const numDependents = empDependents.length;
          
          const totalIncome = Number(row['TongThuNhap'] || row['Tổng thu nhập'] || 0);
          const taxExempt = Number(row['KhgChiuThue'] || row['Không chịu thuế'] || 0);
          const insurance = Number(row['BaoHiem'] || row['Bảo hiểm'] || 0);

          const taxableIncome = totalIncome - taxExempt;
          const totalDeduction = 11000000 + (numDependents * 4400000) + insurance;
          const assessableIncome = taxableIncome - totalDeduction;
          const calculatedTax = calculateTax(assessableIncome);

          return {
            employee_id: emp.id,
            employee_code: emp.employee_code,
            full_name: emp.full_name,
            tax_id: emp.tax_id,
            num_dependents: numDependents,
            total_income: Math.max(0, totalIncome),
            tax_exempt_income: Math.max(0, taxExempt),
            insurance_deduction: Math.max(0, insurance),
            assessable_income: assessableIncome > 0 ? assessableIncome : 0,
            calculated_tax: Math.max(0, calculatedTax),
          };
        });

        setPreviewData(results);
      } catch (err: any) {
        alert('Lỗi: ' + err.message);
      } finally {
        setCalculating(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    if (previewData.length === 0) return;
    
    // Filter out errors
    const validData = previewData.filter(d => !d.error);
    if (validData.length === 0) {
      alert('Không có dữ liệu hợp lệ để lưu.');
      return;
    }

    setLoading(true);
    
    const recordsToUpsert = validData.map(d => ({
      employee_id: d.employee_id,
      month_year: monthYear,
      total_income: d.total_income,
      tax_exempt_income: d.tax_exempt_income,
      insurance_deduction: d.insurance_deduction,
      calculated_tax: d.calculated_tax,
    }));
    
    try {
      const employeeIds = recordsToUpsert.map(r => r.employee_id);
      
      // We manually delete rather than strictly using generic 'onConflict' due to Supabase multi-column constraint logic
      await supabase
        .from('income_records')
        .delete()
        .eq('month_year', monthYear)
        .in('employee_id', employeeIds);
        
      const { error } = await supabase.from('income_records').insert(recordsToUpsert);
      if (error) throw error;
      
      alert(`Đã lưu thành công ${recordsToUpsert.length} bản ghi tính thuế cho tháng ${monthYear}`);
      setPreviewData([]);
      setMonthYear('');
    } catch (err: any) {
      alert('Lỗi lưu dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tính thuế TNCN</h2>
        {previewData.length > 0 && (
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Đang lưu...' : 'Lưu kết quả'}
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng/Năm tính thuế</label>
            <input 
              type="month" 
              required
              value={monthYear}
              onChange={e => setMonthYear(e.target.value)}
              className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls, .csv" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={calculating || !monthYear}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import dữ liệu thu nhập
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          File Excel cần có các cột: <strong>MaNV, HoTen, MaSoThue, TongThuNhap, KhgChiuThue, BaoHiem</strong>.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Kết quả xem trước</h3>
          {previewData.length > 0 && (
            <span className="text-sm text-gray-500">
              Tổng số dòng: {previewData.length} | Hợp lệ: {previewData.filter(d => !d.error).length} | Lỗi: {previewData.filter(d => d.error).length}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã NV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng thu nhập</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Không chịu thuế</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bảo hiểm</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số NPT</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50/50">Thu nhập tính thuế</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50/50">Thuế phải nộp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Chưa có dữ liệu. Vui lòng chọn Tháng/Năm và import file Excel.
                  </td>
                </tr>
              ) : (
                previewData.map((row, idx) => {
                  if (row.error) {
                    return (
                      <tr key={idx} className="bg-red-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-900 font-medium">{row.maNV}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-800">{row.hoTen}</td>
                        <td colSpan={6} className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">Lỗi: {row.error}</td>
                      </tr>
                    )
                  }
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.employee_code}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.full_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{row.total_income.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{row.tax_exempt_income.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{row.insurance_deduction.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{row.num_dependents}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-700 text-right bg-blue-50/20">{row.assessable_income.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-red-700 text-right bg-red-50/20">{row.calculated_tax.toLocaleString('vi-VN')}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
