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
    key: SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE,
    label: "Thiệp online",
    description: "Mẫu thiệp cưới online coded hoặc builder, dùng để tạo wedding site từ template.",
    rendererKey: "physical-product",
    fulfillmentType: "digital",
    templateKey: SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE,
    templateEngine: "coded",
    templateMode: "fixed",
    supportsInventory: false,
    supportsProviderSupply: false,
  },
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
    key: SYSTEM_OFFERING_TYPES.WEDDING_VIDEO,
    label: "Làm video cưới",
    description: "Dịch vụ quay phim, dựng video cưới, pre-wedding clip và highlight lễ cưới.",
    rendererKey: "service",
    fulfillmentType: "service",
    templateKey: SYSTEM_OFFERING_TYPES.WEDDING_VIDEO,
    supportsInventory: false,
    supportsProviderSupply: true,
  },
  {
    key: SYSTEM_OFFERING_TYPES.BRIDAL_MAKEUP,
    label: "Makeup cô dâu",
    description: "Dịch vụ makeup, thử layout, làm tóc và chăm sóc hình ảnh cô dâu.",
    rendererKey: "service",
    fulfillmentType: "service",
    templateKey: SYSTEM_OFFERING_TYPES.BRIDAL_MAKEUP,
    supportsInventory: false,
    supportsProviderSupply: true,
  },
  {
    key: SYSTEM_OFFERING_TYPES.WEDDING_DECORATION,
    label: "Trang trí tiệc cưới",
    description: "Dịch vụ trang trí gia tiên, sân khấu, backdrop, hoa cưới và không gian tiệc.",
    rendererKey: "service",
    fulfillmentType: "service",
    templateKey: SYSTEM_OFFERING_TYPES.WEDDING_DECORATION,
    supportsInventory: false,
    supportsProviderSupply: true,
  },
  {
    key: SYSTEM_OFFERING_TYPES.WEDDING_PLANNER,
    label: "Wedding planner",
    description: "Dịch vụ lập kế hoạch, điều phối ngày cưới và quản lý timeline sự kiện.",
    rendererKey: "service",
    fulfillmentType: "service",
    templateKey: SYSTEM_OFFERING_TYPES.WEDDING_PLANNER,
    supportsInventory: false,
    supportsProviderSupply: true,
  },
  {
    key: SYSTEM_OFFERING_TYPES.WEDDING_SERVICE,
    label: "Dịch vụ cưới",
    description: "Nhóm dịch vụ cưới tổng hợp có thể báo giá, đặt lịch và phân công provider.",
    rendererKey: "service",
    fulfillmentType: "service",
    templateKey: SYSTEM_OFFERING_TYPES.WEDDING_SERVICE,
    supportsInventory: false,
    supportsProviderSupply: true,
  },
  {
    key: SYSTEM_OFFERING_TYPES.WEBSITE_DESIGN,
    label: "Thiết kế website",
    description: "Dịch vụ thiết kế website, landing page và website cưới cho khách hàng hoặc provider.",
    rendererKey: "service",
    fulfillmentType: "service",
    templateKey: SYSTEM_OFFERING_TYPES.WEBSITE_DESIGN,
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
