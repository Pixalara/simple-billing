import React from 'react'

const BrandingFooter = () => (
  <div className="mt-12 mb-6 flex flex-col items-center justify-center gap-1 text-center no-print pointer-events-none select-none">
    <p className="text-[12px] text-gray-400 font-medium tracking-wide font-sans">
      Made for small traders & growing businesses in India
    </p>
    <p className="text-[12px] text-gray-400 font-medium tracking-wide font-sans">
      Crafted by{' '}
      <a 
        href="https://pixalara.com" 
        target="_blank" 
        rel="noreferrer" 
        className="text-gray-500 font-semibold hover:text-gray-700 transition-colors pointer-events-auto cursor-pointer"
      >
        Pixalara
      </a>{' '}
      to keep billing simple
    </p>
  </div>
)

export default BrandingFooter