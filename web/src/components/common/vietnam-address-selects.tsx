"use client";

import { useMemo, useState } from "react";
import {
  getDistrictsByProvinceCode,
  getProvinces,
  getWardsByDistrictCode,
} from "@do-kevin/pc-vn";

type VietnamAddressSelectsProps = {
  city?: string;
  district?: string;
  ward?: string;
};

type Province = ReturnType<typeof getProvinces>[number];
type District = ReturnType<typeof getDistrictsByProvinceCode>[number];
type Ward = ReturnType<typeof getWardsByDistrictCode>[number];

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getProvinceLabel(province: Province) {
  return province.name;
}

function getDistrictLabel(district: District) {
  return district.name;
}

function getWardLabel(ward: Ward) {
  return ward.name;
}

function findProvinceCode(provinces: Province[], city?: string) {
  const keyword = normalize(city);
  if (!keyword) return "";
  return provinces.find((province) => normalize(province.name) === keyword)?.code ?? "";
}

function findDistrictCode(districts: District[], district?: string) {
  const keyword = normalize(district);
  if (!keyword) return "";
  return districts.find((item) => normalize(item.name) === keyword || normalize(item.full_name) === keyword)?.code ?? "";
}

function findWardCode(wards: Ward[], ward?: string) {
  const keyword = normalize(ward);
  if (!keyword) return "";
  return wards.find((item) => normalize(item.name) === keyword || normalize(item.full_name) === keyword)?.code ?? "";
}

const selectClassName = "h-10 w-full rounded-md border bg-background px-3 text-sm";

export function VietnamAddressSelects({ city, district, ward }: VietnamAddressSelectsProps) {
  const provinces = useMemo(() => getProvinces(), []);
  const initialProvinceCode = useMemo(() => findProvinceCode(provinces, city), [city, provinces]);
  const [provinceCode, setProvinceCode] = useState(initialProvinceCode);
  const districts = useMemo(() => (provinceCode ? getDistrictsByProvinceCode(provinceCode) : []), [provinceCode]);
  const initialDistrictCode = useMemo(() => findDistrictCode(districts, district), [district, districts]);
  const [districtCode, setDistrictCode] = useState(initialDistrictCode);
  const wards = useMemo(() => (districtCode ? getWardsByDistrictCode(districtCode) : []), [districtCode]);
  const initialWardCode = useMemo(() => findWardCode(wards, ward), [ward, wards]);
  const [wardCode, setWardCode] = useState(initialWardCode);

  const selectedProvince = provinces.find((province) => province.code === provinceCode);
  const selectedDistrict = districts.find((item) => item.code === districtCode);
  const selectedWard = wards.find((item) => item.code === wardCode);
  const cityValue = selectedProvince ? getProvinceLabel(selectedProvince) : city ?? "";
  const districtValue = selectedDistrict ? getDistrictLabel(selectedDistrict) : district ?? "";
  const wardValue = selectedWard ? getWardLabel(selectedWard) : ward ?? "";

  return (
    <>
      <input type="hidden" name="city" value={cityValue} />
      <input type="hidden" name="district" value={districtValue} />
      <input type="hidden" name="ward" value={wardValue} />

      <div className="space-y-2">
        <label className="font-medium">Tỉnh / thành phố</label>
        <select
          required
          value={provinceCode}
          className={selectClassName}
          onChange={(event) => {
            setProvinceCode(event.target.value);
            setDistrictCode("");
            setWardCode("");
          }}
        >
          <option value="">Chọn tỉnh / thành phố</option>
          {city && !initialProvinceCode ? <option value="">{city}</option> : null}
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {getProvinceLabel(province)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Quận / huyện</label>
        <select
          required
          value={districtCode}
          className={selectClassName}
          disabled={!provinceCode}
          onChange={(event) => {
            setDistrictCode(event.target.value);
            setWardCode("");
          }}
        >
          <option value="">Chọn quận / huyện</option>
          {district && !initialDistrictCode ? <option value="">{district}</option> : null}
          {districts.map((item) => (
            <option key={item.code} value={item.code}>
              {getDistrictLabel(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Phường / xã</label>
        <select value={wardCode} className={selectClassName} disabled={!districtCode} onChange={(event) => setWardCode(event.target.value)}>
          <option value="">Chọn phường / xã</option>
          {ward && !initialWardCode ? <option value="">{ward}</option> : null}
          {wards.map((item) => (
            <option key={item.code} value={item.code}>
              {getWardLabel(item)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
