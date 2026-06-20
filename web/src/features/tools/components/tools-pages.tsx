"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Check,
  Copy,
  Download,
  Gift,
  QrCode,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";

type ToolPageHeaderProps = {
  eyebrow: string;
  title: string;
  excerpt: string;
};

const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#ff95f8,#ff6ff5)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_rgba(255,111,245,0.25)] transition hover:-translate-y-0.5";

const secondaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#ead8e8] bg-white px-6 text-sm font-bold text-stone-700 transition hover:border-[#ff6ff5] hover:text-[#b529aa]";

function ToolsDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 top-24 size-72 rounded-full bg-white/45 blur-3xl" />
      <div className="absolute right-[5%] top-12 size-72 rounded-full bg-[#ff6ff5]/12 blur-3xl" />
      <span className="cta-sparkle-float absolute left-[9%] top-[22%] text-4xl text-white">✦</span>
      <span className="cta-heart-pop absolute right-[9%] top-[28%] text-3xl text-[#ff6ff5]/30">♥</span>
    </div>
  );
}

function ToolPageHeader({ eyebrow, title, excerpt }: ToolPageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#ffd1f7] via-[#f9e8ff] to-[#f9f1ff]">
      <ToolsDecor />
      <div className="container relative mx-auto px-4 py-14 text-center lg:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#b529aa]">{eyebrow}</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-stone-600 lg:text-lg">{excerpt}</p>
      </div>
      <svg className="absolute inset-x-0 bottom-0 h-8 w-full translate-y-px fill-white" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 52C244 6 483 9 720 39c237 30 477 32 720-9v50H0Z" />
      </svg>
    </section>
  );
}

export function QrBuilderTool({
  title,
  excerpt,
  templatesPath,
}: {
  title: string;
  excerpt: string;
  templatesPath: string;
}) {
  const [coupleName, setCoupleName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [copied, setCopied] = useState(false);
  const qrContent = useMemo(
    () =>
      [
        "PINKLOVE WEDDING GIFT",
        coupleName && `Couple: ${coupleName}`,
        bankName && `Bank: ${bankName}`,
        accountNumber && `Account: ${accountNumber}`,
        accountName && `Name: ${accountName}`,
      ]
        .filter(Boolean)
        .join("\n"),
    [accountName, accountNumber, bankName, coupleName]
  );
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=18&data=${encodeURIComponent(qrContent)}`;
  const isComplete = Boolean(bankName && accountNumber && accountName);

  async function copyAccount() {
    if (!accountNumber) return;
    await navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="bg-white text-stone-950">
      <ToolPageHeader eyebrow="Công cụ chia sẻ quà cưới" title={title} excerpt={excerpt} />
      <section className="container mx-auto px-4 py-14 lg:py-20">
        <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="rounded-[28px] border border-[#f0deee] bg-white p-6 shadow-[0_18px_55px_rgba(85,38,82,0.07)] lg:p-8">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b529aa]">Bước 1</p>
              <h2 className="mt-2 text-2xl font-black">Nhập thông tin nhận quà</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">Mã QR sẽ cập nhật tự động theo nội dung bạn nhập.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <ToolInput label="Tên cô dâu & chú rể" value={coupleName} onChange={setCoupleName} placeholder="Linh & Tuấn" />
              <ToolInput label="Ngân hàng" value={bankName} onChange={setBankName} placeholder="MB Bank" />
              <ToolInput label="Số tài khoản" value={accountNumber} onChange={setAccountNumber} placeholder="123456789" inputMode="numeric" />
              <ToolInput label="Chủ tài khoản" value={accountName} onChange={setAccountName} placeholder="NGUYEN VAN A" />
            </div>
            <div className="mt-6 rounded-2xl bg-[#fff5fd] p-4 text-sm leading-6 text-stone-600">
              <strong className="text-stone-900">Lưu ý:</strong> hãy quét thử mã sau khi tải và đối chiếu thông tin trước khi gửi cho khách mời.
            </div>
          </div>

          <div className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-[28px] border border-[#f0deee] bg-gradient-to-b from-[#fff7fe] to-[#f9eaff] p-6 shadow-[0_18px_55px_rgba(85,38,82,0.08)] lg:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b529aa]">Bước 2</p>
                  <h2 className="mt-2 text-2xl font-black">Xem trước mã QR</h2>
                </div>
                <QrCode className="size-8 text-[#b529aa]" />
              </div>
              <div className="mx-auto max-w-[360px] rounded-[28px] bg-white p-5 text-center shadow-[0_18px_45px_rgba(181,41,170,0.1)]">
                {/* External QR rendering keeps the generated code standards-compliant without storing form data. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl} alt="Mã QR nhận quà cưới" className="aspect-square w-full rounded-2xl" />
                <p className="mt-4 font-black">{coupleName || "Tên cô dâu & chú rể"}</p>
                <p className="mt-1 text-sm text-stone-500">{bankName || "Ngân hàng"} · {accountNumber || "Số tài khoản"}</p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={copyAccount} disabled={!accountNumber} className={secondaryButtonClass}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Đã sao chép" : "Sao chép STK"}
                </button>
                <a href={qrImageUrl} download="pinklove-wedding-qr.png" target="_blank" rel="noreferrer" className={`${primaryButtonClass} ${!isComplete ? "pointer-events-none opacity-45" : ""}`}>
                  <Download className="size-4" /> Tải mã QR
                </a>
              </div>
            </div>
            <Link href={templatesPath} className="mt-4 flex items-center justify-between rounded-[22px] border border-[#f0deee] bg-white p-5 font-bold text-stone-800 transition hover:border-[#ff6ff5] hover:text-[#b529aa]">
              Dùng QR trong mẫu thiệp
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "numeric";
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-13 w-full rounded-2xl border border-[#ead8e8] bg-[#fffafd] px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#ff6ff5] focus:ring-4 focus:ring-[#ff6ff5]/10"
      />
    </label>
  );
}

const initialBudgetItems = [
  { label: "Nhà hàng & tiệc cưới", percent: 45 },
  { label: "Chụp ảnh & quay phim", percent: 15 },
  { label: "Trang phục & làm đẹp", percent: 12 },
  { label: "Trang trí & hoa", percent: 10 },
  { label: "Thiệp & quà cảm ơn", percent: 8 },
  { label: "Dự phòng", percent: 10 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

export function WeddingBudgetTool({
  title,
  excerpt,
  templatesPath,
}: {
  title: string;
  excerpt: string;
  templatesPath: string;
}) {
  const [budget, setBudget] = useState(200_000_000);
  const [items, setItems] = useState(initialBudgetItems);
  const totalPercent = items.reduce((sum, item) => sum + item.percent, 0);
  const allocatedAmount = budget * (totalPercent / 100);

  function updatePercent(index: number, percent: number) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, percent } : item)));
  }

  function resetBudget() {
    setBudget(200_000_000);
    setItems(initialBudgetItems);
  }

  return (
    <div className="bg-white text-stone-950">
      <ToolPageHeader eyebrow="Công cụ lập kế hoạch" title={title} excerpt={excerpt} />
      <section className="container mx-auto px-4 py-14 lg:py-20">
        <div className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="space-y-5 lg:sticky lg:top-28">
            <div className="rounded-[28px] border border-[#f0deee] bg-white p-6 shadow-[0_18px_55px_rgba(85,38,82,0.07)] lg:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b529aa]">Tổng ngân sách</p>
              <div className="mt-4 flex items-center rounded-2xl border border-[#ead8e8] bg-[#fffafd] px-4 focus-within:border-[#ff6ff5] focus-within:ring-4 focus-within:ring-[#ff6ff5]/10">
                <input
                  type="number"
                  min={0}
                  step={1_000_000}
                  value={budget}
                  onChange={(event) => setBudget(Math.max(0, Number(event.target.value)))}
                  className="h-14 min-w-0 flex-1 bg-transparent text-xl font-black outline-none"
                />
                <span className="text-sm font-bold text-stone-400">VND</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#fff5fd] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">Đã phân bổ</p>
                  <p className="mt-2 text-xl font-black text-[#b529aa]">{totalPercent}%</p>
                </div>
                <div className="rounded-2xl bg-[#fff5fd] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">Dự toán</p>
                  <p className="mt-2 text-sm font-black text-[#b529aa]">{formatCurrency(allocatedAmount)}</p>
                </div>
              </div>
              {totalPercent !== 100 ? (
                <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${totalPercent > 100 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                  {totalPercent > 100 ? `Đang vượt ${totalPercent - 100}% ngân sách.` : `Còn ${100 - totalPercent}% chưa phân bổ.`}
                </p>
              ) : (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <Check className="size-4" /> Ngân sách đã được phân bổ đủ 100%.
                </p>
              )}
              <button type="button" onClick={resetBudget} className="mt-5 text-sm font-bold text-stone-400 transition hover:text-[#b529aa]">Đặt lại mặc định</button>
            </div>
            <Link href={templatesPath} className="flex items-center justify-between rounded-[22px] bg-gradient-to-r from-[#ff95f8] to-[#ff6ff5] p-5 font-bold text-white shadow-[0_14px_34px_rgba(255,111,245,0.22)]">
              Tiết kiệm với thiệp online
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-[28px] border border-[#f0deee] bg-white p-6 shadow-[0_18px_55px_rgba(85,38,82,0.07)] lg:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b529aa]">Phân bổ chi tiết</p>
                <h2 className="mt-2 text-2xl font-black">Điều chỉnh theo kế hoạch của bạn</h2>
              </div>
              <WalletCards className="size-8 shrink-0 text-[#b529aa]" />
            </div>
            <div className="space-y-5">
              {items.map((item, index) => {
                const amount = budget * (item.percent / 100);
                return (
                  <div key={item.label} className="rounded-[20px] border border-[#f2e5f0] bg-[#fffafd] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-stone-800">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-[#b529aa]">{formatCurrency(amount)}</p>
                      </div>
                      <label className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 shadow-sm">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.percent}
                          onChange={(event) => updatePercent(index, Math.min(100, Math.max(0, Number(event.target.value))))}
                          className="w-12 bg-transparent text-right text-sm font-black outline-none"
                          aria-label={`Tỷ lệ ${item.label}`}
                        />
                        <span className="text-sm font-bold text-stone-400">%</span>
                      </label>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={Math.min(item.percent, 60)}
                      onChange={(event) => updatePercent(index, Number(event.target.value))}
                      className="mt-4 h-2 w-full cursor-pointer accent-[#ff6ff5]"
                      aria-label={`Điều chỉnh ${item.label}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff8fe] py-14">
        <div className="container mx-auto grid gap-5 px-4 md:grid-cols-3">
          {[
            [Gift, "Ưu tiên khoản quan trọng", "Chốt trước nhà hàng, hình ảnh và trang phục."],
            [Calculator, "Luôn giữ khoản dự phòng", "Nên dành khoảng 5–10% cho chi phí phát sinh."],
            [WalletCards, "Theo dõi chi phí thực tế", "Cập nhật lại dự toán sau mỗi lần đặt cọc."],
          ].map(([Icon, heading, description]) => {
            const ItemIcon = Icon as typeof Gift;
            return (
              <div key={heading as string} className="rounded-[22px] border border-[#f0deee] bg-white p-6">
                <ItemIcon className="size-6 text-[#b529aa]" />
                <h3 className="mt-4 font-black">{heading as string}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">{description as string}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
