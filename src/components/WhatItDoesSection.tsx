import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PILLARS } from '../data/derivContent';

export function WhatItDoesSection() {
  const [expandedId, setExpandedId] = useState<string | null>('no-ownership');

  const toggleExample = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="what-it-does" className="py-16 sm:py-24 bg-[#FAF9F7] border-b border-[#181C25]/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-2">
            Plain-English Overview
          </p>
          <h2
            className="text-2xl sm:text-4xl font-display font-bold text-[#181C25] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            What Deriv Actually Does
          </h2>
          <p className="mt-3 text-base text-[#181C25]/70 leading-relaxed">
            No complex Wall Street terminology. Three everyday ideas explain the entire platform.
          </p>
        </div>

        {/* Asymmetric Bento-Editorial Layout (no symmetrical 3-column icon-on-top cliché) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {PILLARS.map((pillar, index) => {
            const isOpen = expandedId === pillar.id;
            const spanClass =
              index === 0
                ? 'lg:col-span-7'
                : index === 1
                ? 'lg:col-span-5'
                : 'lg:col-span-12';

            return (
              <article
                key={pillar.id}
                className={`${spanClass} bg-white border border-[#181C25]/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6`}
              >
                <div className={index === 2 ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : ''}>
                  <div className={index === 2 ? 'lg:col-span-7' : ''}>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-[#181C25]/55 mb-3">
                      <span className="font-mono tabular-nums text-[#FF444F] font-semibold">
                        {pillar.number}.
                      </span>
                      <span>{pillar.instrumentLabel}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#181C25] tracking-tight mb-3">
                      {pillar.title}
                    </h3>

                    <p className="text-sm sm:text-base text-[#181C25]/75 leading-relaxed">
                      {pillar.summary}
                    </p>
                  </div>

                  {index === 2 && (
                    <div className="lg:col-span-5 bg-[#FAF9F7] border border-[#181C25]/8 rounded-xl p-5 space-y-2">
                      <p className="text-xs font-semibold text-[#181C25]">
                        Why weekend access matters
                      </p>
                      <p className="text-sm text-[#181C25]/70 leading-relaxed">
                        {pillar.everydayAnalogy}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => toggleExample(pillar.id)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#181C25] hover:text-[#FF444F] transition-colors duration-150 cursor-pointer"
                  >
                    <span>{isOpen ? 'Hide everyday example' : 'See everyday example'}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-[#181C25]/8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {index !== 2 && (
                        <div className="sm:col-span-2">
                          <p className="text-sm text-[#181C25]/75 leading-relaxed">
                            {pillar.everydayAnalogy}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-[#181C25]/50">Example setup</p>
                        <p className="text-sm font-semibold text-[#181C25] mt-0.5">
                          {pillar.exampleStake}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#181C25]/50">What it means for you</p>
                        <p className="text-sm font-semibold text-[#0D9488] mt-0.5">
                          {pillar.exampleOutcome}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
