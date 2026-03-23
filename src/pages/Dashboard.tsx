import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee } from '../types';
import { Plus, Upload, Edit, Trash2, Eye } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setEmployees(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      await supabase.from('employees').delete().eq('id', id);
      fetchEmployees();
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newEmployees = data.map((row: any) => ({
          employee_code: String(row['Mã NV'] || row['Mã nhân viên'] || row['MaNV'] || ''),
          full_name: String(row['Họ tên'] || row['Họ và tên'] || row['HoTen'] || ''),
          department: String(row['Đơn vị'] || row['Phòng ban'] || row['DonVi'] || ''),
          tax_id: String(row['Mã số thuế'] || row['MST'] || row['MaSoThue'] || ''),
          cccd: String(row['Số CCCD'] || row['CCCD'] || row['CMND'] || ''),
          is_resigned: false
        })).filter((emp) => emp.employee_code && emp.full_name);

        if (newEmployees.length > 0) {
          const { error } = await supabase.from('employees').upsert(newEmployees, { onConflict: 'employee_code' });
          if (error) throw error;
          alert(`Đã import thành công ${newEmployees.length} nhân viên`);
          fetchEmployees();
        } else {
          alert('Không tìm thấy dữ liệu nhân viên hợp lệ trong file');
        }
      } catch (err: any) {
        alert('Lỗi import file: ' + err.message);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Danh sách nhân viên</h2>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm"
          >
            <Upload className="w-4 h-4" />
            Nhập Excel
          </button>
          <button 
            onClick={() => {
              setEditingEmployee(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã số thuế</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Chưa có dữ liệu nhân viên
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.employee_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{emp.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.tax_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.is_resigned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {emp.is_resigned ? 'Đã nghỉ việc' : 'Đang làm việc'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link to={`/employees/${emp.id}`} className="text-gray-400 hover:text-primary-600" title="Chi tiết">
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => {
                            setEditingEmployee(emp);
                            setIsModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-blue-600" title="Sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="text-gray-400 hover:text-red-600" title="Xóa">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEmployee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
      >
        <EmployeeForm 
          employee={editingEmployee} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEmployees();
          }}
        />
      </Modal>
    </div>
  );
}
