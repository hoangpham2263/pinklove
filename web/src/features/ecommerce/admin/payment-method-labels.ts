export function getPaymentMethodTypeLabel(type: string) {
  switch (type) {
    case "offline":
      return "Offline";
    case "redirect":
      return "Redirect";
    case "embedded":
      return "Embedded";
    case "mock":
      return "Mock";
    default:
      return "Manual";
  }
}

export function getRequiresShippingLabel(value: boolean | null) {
  if (value === true) return "Chỉ đơn giao hàng";
  if (value === false) return "Chỉ đơn digital/service";
  return "Mọi loại đơn";
}
