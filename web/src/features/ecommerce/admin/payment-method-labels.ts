export function getPaymentMethodTypeLabel(type: string) {
  switch (type) {
    case "offline":
      return "Thu trực tiếp";
    case "redirect":
      return "Chuyển sang cổng thanh toán";
    case "embedded":
      return "Nhúng cổng thanh toán";
    case "mock":
      return "Thanh toán thử nghiệm";
    default:
      return "Đối soát thủ công";
  }
}

export function getPaymentMethodCategoryLabel(category: string) {
  switch (category) {
    case "offline":
      return "Thanh toán trực tiếp / COD";
    case "gateway":
      return "Cổng thanh toán trực tuyến";
    default:
      return "Chuyển khoản / đối soát";
  }
}

export function getPaymentMethodCategoryDescription(category: string) {
  switch (category) {
    case "offline":
      return "Thu tiền khi giao hàng, tại studio hoặc các hình thức thanh toán không qua cổng online.";
    case "gateway":
      return "Stripe, PayPal, MoMo, VNPAY hoặc gateway bên thứ ba có redirect, embedded checkout, callback hoặc webhook.";
    default:
      return "Chuyển khoản ngân hàng, VietQR hoặc phương thức cần nhân sự đối soát trước khi duyệt đơn.";
  }
}

export function getRequiresShippingLabel(value: boolean | null) {
  if (value === true) return "Chỉ đơn giao hàng";
  if (value === false) return "Chỉ đơn digital/service";
  return "Mọi loại đơn";
}
