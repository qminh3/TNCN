export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  department: string;
  tax_id: string;
  cccd: string;
  is_resigned: boolean;
  created_at: string;
}

export interface Dependent {
  id: string;
  employee_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string;
  tax_id: string | null;
  cccd: string | null;
  start_month: string;
  end_month: string | null;
  is_inactive: boolean;
  created_at: string;
}

export interface IncomeRecord {
  id: string;
  employee_id: string;
  month_year: string;
  total_income: number;
  tax_exempt_income: number;
  insurance_deduction: number;
  calculated_tax: number;
  created_at: string;
}
