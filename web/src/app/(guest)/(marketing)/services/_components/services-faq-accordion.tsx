"use client";

import { useState } from "react";

type ServiceFaqAccordionItem = {
  question?: string;
  answer?: string;
};

export function ServicesFaqAccordion({ items }: { items: ServiceFaqAccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={`${item.question}-${index}`} className="overflow-hidden rounded-2xl border border-[#ffd8fc]/80 bg-white">
            <button
              type="button"
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-[#fff7fd] md:px-6"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span className="text-base font-semibold text-stone-950 lg:text-lg">{item.question}</span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff5fd] text-lg font-semibold leading-none text-[#d94dce]">
                {isOpen ? "-" : "+"}
              </span>
            </button>

            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-8 text-stone-600 md:px-6 md:pb-6 md:text-base">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
