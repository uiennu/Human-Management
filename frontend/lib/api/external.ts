// frontend/lib/api/external.ts

export interface Bank {
  id: number;
  shortName: string; // VD: Vietcombank
  code: string;      // VD: VCB
}

export interface Province {
  code: number;
  name: string;
  districts: District[];
}

export interface District {
  code: number;
  name: string;
}

// Gọi API VietQR lấy danh sách ngân hàng
export const fetchBanks = async (): Promise<Bank[]> => {
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks');
    const data = await res.json();
    return data.data || [];
  } catch (e) { return []; }
};

// Gọi API lấy Tỉnh/Thành Việt Nam
export const fetchProvinces = async (): Promise<Province[]> => {
  try {
    const res = await fetch('https://provinces.open-api.vn/api/?depth=2');
    return await res.json();
  } catch (e) { return []; }
};