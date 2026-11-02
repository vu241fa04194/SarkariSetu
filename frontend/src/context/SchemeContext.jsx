import React, { createContext, useContext, useState } from 'react';

/**
 * SchemeContext provides shared state for bookmarking or quick access in future iterations.
 * Available for Phase 1 context tree consistency.
 */
const SchemeContext = createContext();

export const SchemeProvider = ({ children }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  return (
    <SchemeContext.Provider
      value={{
        activeCategory,
        setActiveCategory,
      }}
    >
      {children}
    </SchemeContext.Provider>
  );
};

export const useSchemeContext = () => useContext(SchemeContext);

export default SchemeContext;
