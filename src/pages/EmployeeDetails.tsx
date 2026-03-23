import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Employee, Dependent } from '../types';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { DependentForm } from '../components/dependents/DependentForm';

export default function EmployeeDetails() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);

  const fetchData = async () => {
    setLoading(true);
    if (!id) return;

    const [empResponse, depResponse] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).single(),
      supabase.from('dependents').select('*').eq('employee_id', id).order('created_at', { ascending: true })
    ]);

    if (!empResponse.error && empResponse.data) setEmployee(empResponse.data);
    if (!depResponse.error && depResponse.data) setDependents(depResponse.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async (depId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người phụ thuộc này?')) {
      await supabase.from('dependents').delete().eq('id', depId);
      fetchData();
    }
  };

  if (loading) return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  if (!employee) return <div className="text-center py-8">Không tìm thấy nhân viên</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Hồ sơ nhân viên</h2>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold border-b pb-3 mb-4">Thông tin chung</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Mã nhân viên</p>
            <p className="font-medium">{employee.employee_code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Họ và tên</p>
            <p className="font-medium">{employee.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Đơn vị</p>
            <p className="font-medium">{employee.department}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Số CCCD</p>
            <p className="font-medium">{employee.cccd}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Mã số thuế</p>
            <p className="font-medium">{employee.tax_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.is_resigned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {employee.is_resigned ? 'Đã nghỉ việc' : 'Đang làm việc'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Danh sách người phụ thuộc</h3>
        <button 
          onClick={() => {
            setEditingDependent(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 text-white px-3 py-2 rounded-md hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm người phụ thuộc
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mối quan hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian GT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dependents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nhân viên này chưa có người phụ thuộc nào
                  </td>
                </tr>
              ) : (
                dependents.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dep.full_name}
                      {(dep.tax_id || dep.cccd) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {dep.tax_id && `MST: ${dep.tax_id}`} {dep.cccd && `CCCD: ${dep.cccd}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{dep.relationship}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dep.date_of_birth).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dep.start_month} đến {dep.end_month || 'Nay'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dep.is_inactive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {dep.is_inactive ? 'Hết hiệu lực' : 'Đang giảm trừ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingDependent(dep);
                            setIsModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-blue-600" title="Sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(dep.id)} className="text-gray-400 hover:text-red-600" title="Xóa">
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
        title={editingDependent ? "Sửa người phụ thuộc" : "Thêm người phụ thuộc"}
      >
        <DependentForm 
          dependent={editingDependent} 
          employeeId={id!}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      </Modal>
    </div>
  );
}
