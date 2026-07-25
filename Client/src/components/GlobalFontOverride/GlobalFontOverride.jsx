import React from 'react';

const GlobalFontOverride = ({ config }) => {
  if (!config || !config.applyGlobalFont) return null;

  let rootFontSize = '16px'; // default medium

  if (config.fontCategory === 'small') {
    rootFontSize = '14px';
  } else if (config.fontCategory === 'large') {
    rootFontSize = '18px';
  }

  return (
    <style dangerouslySetInnerHTML={{__html: `
      :root {
        font-size: ${rootFontSize} !important;
      }
      
      /* Scale up major headings explicitly if needed based on scale */
      h1 { font-size: ${config.fontCategory === 'large' ? '3rem' : config.fontCategory === 'small' ? '2rem' : '2.5rem'} !important; }
      h2 { font-size: ${config.fontCategory === 'large' ? '2.5rem' : config.fontCategory === 'small' ? '1.75rem' : '2rem'} !important; }
    `}} />
  );
};

export default GlobalFontOverride;
