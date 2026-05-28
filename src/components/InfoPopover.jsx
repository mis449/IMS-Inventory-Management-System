import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const InfoPopover = ({ children, items, title }) => {
  const [show, setShow] = useState(false);
  const [showUp, setShowUp] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (show && containerRef.current && !isMobile) {
      const timer = setTimeout(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceRight = window.innerWidth - rect.right;

        if (spaceAbove < 200) {
          setShowUp(false);
        } else {
          setShowUp(true);
        }

        if (spaceRight < 150) {
          setAlignRight(true);
        } else {
          setAlignRight(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [show, isMobile]);

  return (
    <div
      className="relative inline-block cursor-help"
      onMouseEnter={() => !isMobile && setShow(true)}
      onMouseLeave={() => !isMobile && setShow(false)}
      onClick={() => setShow(!show)}
      ref={containerRef}
    >
      {children}

      {show && items && items.length > 0 && (
        <>
          {isMobile ? (
            <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-hidden lg:left-56">
              <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
                style={{ maxHeight: '80vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-none z-20">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
                  <button
                    onClick={() => setShow(false)}
                    className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto bg-white min-h-0 z-10">
                  <div className="p-6 space-y-4">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0 shadow-sm shadow-sky-200"></div>
                        <span className="text-xs md:text-sm font-medium text-slate-600 uppercase leading-relaxed break-words">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-none z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShow(false); }}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 shadow-sm text-xs uppercase tracking-wider"
                  >
                    Close info
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop Popover */
            <div
              className={`absolute z-[300] w-max min-w-[200px] max-w-[300px] bg-white border border-slate-200/60 shadow-xl rounded-xl p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none
                ${showUp ? 'bottom-full mb-3' : 'top-full mt-3'}
                ${alignRight ? 'right-0 origin-top-right' : 'left-1/2 -translate-x-1/2 origin-top'}
              `}
            >
              <div className="flex flex-col gap-2">
                {title && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1.5 mb-1 tracking-wider text-center whitespace-nowrap">
                    {title}
                  </p>
                )}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0 shadow-sm shadow-sky-200"></div>
                      <span className="text-xs font-semibold text-slate-600 uppercase leading-normal break-words">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow indicator */}
              <div
                className={`absolute border-8 border-transparent drop-shadow-sm
                  ${showUp ? 'top-full border-t-white' : 'bottom-full border-b-white'}
                  ${alignRight ? 'right-4' : 'left-1/2 -translate-x-1/2'}
                `}
              ></div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InfoPopover;
