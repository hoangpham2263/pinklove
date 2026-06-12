import {
  SYSTEM_OFFERING_TYPES,
  type OfferingFulfillmentType,
  type OfferingTemplateEngine,
  type OfferingTemplateMode,
  type OfferingType,
} from "@/features/offerings/types";

export type RegisteredOfferingType = {
  key: OfferingType;
  label: string;
  description: string;
  rendererKey: "physical-product" | "service";
  fulfillmentType: OfferingFulfillmentType;
  templateKey: string;
  templateEngine?: OfferingTemplateEngine;
  templateMode?: OfferingTemplateMode;
  supportsInventory: boolean;
  supportsProviderSupply: boolean;
};

export const REGISTERED_OFFERING_TYPES: RegisteredOfferingType[] = [
  {
    key: SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT,
    label: "Thiệp giấy",
    description: "Thiệp cưới in ấn, bộ thiệp giấy và sản phẩm hữu hình liên quan.",
    rendererKey: "physical-product",
    fulfillmentType: "physical",
    templateKey: SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT,
    supportsInventory: true,
    supportsProviderSupply: true,
  },
  {
    key: SYSTEM_OFFERING_TYPES.WEDDING_PHOTO,
    label: "Chụp ảnh cưới",
    description: "Dịch vụ chụp ảnh cưới, phóng sự cưới và chụp pre-wedding.",
    rendererKey: "service",
    fulfillmentType: "service",
    templateKey: SYSTEM_OFFERING_TYPES.WEDDING_PHOTO,
    supportsInventory: false,
    supportsProviderSupply: true,
  },
  {
    key: SYSTEM_OFFERING_TYPES.WEDDING_GIFT,
    label: "Quà cưới",
    description: "Quà tặng, hộp quà và phụ kiện cưới dạng sản phẩm vật lý.",
    rendererKey: "physical-product",
    fulfillmentType: "physical",
    templateKey: SYSTEM_OFFERING_TYPES.WEDDING_GIFT,
    supportsInventory: true,
    supportsProviderSupply: true,
  },
];

export function getRegisteredOfferingType(key: string) {
  return REGISTERED_OFFERING_TYPES.find((type) => type.key === key);
}
