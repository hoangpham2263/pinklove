export type UserAddress = {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  ward: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export function formatUserAddress(address: Pick<UserAddress, "line1" | "line2" | "ward" | "district" | "city">) {
  return [address.line1, address.line2, address.ward, address.district, address.city].filter(Boolean).join(", ");
}
