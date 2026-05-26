declare module "@do-kevin/pc-vn" {
  export type Province = {
    code: string;
    name: string;
    unit: string;
  };

  export type District = {
    code: string;
    name: string;
    unit: string;
    province_code: string;
    province_name: string;
    full_name: string;
  };

  export type Ward = {
    code: string;
    name: string;
    unit: string;
    district_code: string;
    district_name: string;
    province_code: string;
    province_name: string;
    full_name: string;
  };

  export function getProvinces(): Province[];
  export function getDistricts(): District[];
  export function getDistrictsByProvinceCode(provinceCode: string): District[];
  export function getWards(): Ward[];
  export function getWardsByDistrictCode(districtCode: string): Ward[];
  export function getWardsByProvinceCode(provinceCode: string): Ward[];
}
