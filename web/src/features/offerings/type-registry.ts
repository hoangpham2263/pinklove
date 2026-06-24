import {
  type OfferingFulfillmentType,
  type OfferingTemplateEngine,
  type OfferingTemplateMode,
  type OfferingType,
} from "@/features/offerings/types";
import { REGISTERED_OFFERING_TYPES as registeredOfferingTypes } from "@/features/offerings/registered-offering-types.mjs";

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

export const REGISTERED_OFFERING_TYPES = registeredOfferingTypes as RegisteredOfferingType[];

export function getRegisteredOfferingType(key: string) {
  return REGISTERED_OFFERING_TYPES.find((type) => type.key === key);
}
