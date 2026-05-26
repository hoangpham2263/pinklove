"use client";

import { useMemo, useState } from "react";
import { level1s } from "dvhcvn";

type VietnamAddressSelectsProps = {
  city?: string;
  district?: string;
  ward?: string;
};

type Province = typeof level1s[number];
type District = NonNullable<Province["children"]>[number];
type Ward = NonNullable<District["children"]>[number];

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

function findProvinceId(provinces: readonly Province[], city?: string) {
  const keyword = normalize(city);
  if (!keyword) return "";
  return provinces.find((province) => normalize(province.name) === keyword)?.id ?? "";
}

function findDistrictId(districts: readonly District[], district?: string) {
  const keyword = normalize(district);
  if (!keyword) return "";
  return districts.find((item) => normalize(item.name) === keyword)?.id ?? "";
}

function findWardId(wards: readonly Ward[], ward?: string) {
  const keyword = normalize(ward);
  if (!keyword) return "";
  return wards.find((item) => normalize(item.name) === keyword)?.id ?? "";
}

const selectClassName = "h-10 w-full rounded-md border bg-background px-3 text-sm";

export function VietnamAddressSelects({ city, district, ward }: VietnamAddressSelectsProps) {
  const provinces = level1s;
  const initialProvinceId = useMemo(() => findProvinceId(provinces, city), [city, provinces]);
  const [provinceId, setProvinceId] = useState(initialProvinceId);
  const selectedProvince = useMemo(() => provinces.find((province) => province.id === provinceId), [provinces, provinceId]);
  const districts = useMemo(() => selectedProvince?.children ?? [], [selectedProvince]);
  
  const initialDistrictId = useMemo(() => findDistrictId(districts, district), [district, districts]);
  const [districtId, setDistrictId] = useState(initialDistrictId);
  const selectedDistrict = useMemo(() => districts.find((item) => item.id === districtId), [districts, districtId]);
  const wards = useMemo(() => selectedDistrict?.children ?? [], [selectedDistrict]);
  
  const initialWardId = useMemo(() => findWardId(wards, ward), [ward, wards]);
  const [wardId, setWardId] = useState(initialWardId);
  const selectedWard = useMemo(() => wards.find((item) => item.id === wardId), [wards, wardId]);

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
          value={provinceId}
          className={selectClassName}
          onChange={(event) => {
            setProvinceId(event.target.value);
            setDistrictId("");
            setWardId("");
          }}
        >
          <option value="">Chọn tỉnh / thành phố</option>
          {city && !initialProvinceId ? <option value="">{city}</option> : null}
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {getProvinceLabel(province)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Quận / huyện</label>
        <select
          required
          value={districtId}
          className={selectClassName}
          disabled={!provinceId}
          onChange={(event) => {
            setDistrictId(event.target.value);
            setWardId("");
          }}
        >
          <option value="">Chọn quận / huyện</option>
          {district && !initialDistrictId ? <option value="">{district}</option> : null}
          {districts.map((item) => (
            <option key={item.id} value={item.id}>
              {getDistrictLabel(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Phường / xã</label>
        <select value={wardId} className={selectClassName} disabled={!districtId} onChange={(event) => setWardId(event.target.value)}>
          <option value="">Chọn phường / xã</option>
          {ward && !initialWardId ? <option value="">{ward}</option> : null}
          {wards.map((item) => (
            <option key={item.id} value={item.id}>
              {getWardLabel(item)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
