import React from 'react';
if (process.env.NODE_ENV === 'development' && (process.env.REACT_APP_WDYR ?? true)) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    // trackAllPureComponents: true,
  });
}
