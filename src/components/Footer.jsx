import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-3 md:py-2 border-t border-sky-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-[13px] md:text-sm font-bold md:font-medium text-sky-700">
          Powered By <span className="font-black hover:underline transition-all">Botivate</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;