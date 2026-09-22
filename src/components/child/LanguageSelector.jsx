import React from 'react'
import { Globe } from 'lucide-react'
import { LANGUAGES } from '../../i18n/translations'

/**
 * LanguageSelector (Section 29 & Section 36)
 * Supports English, Telugu, and Hindi with native scripts and accessible child-friendly sizing.
 */
export function LanguageSelector({
  value = 'en',
  onChange,
  className = '',
  size = 'md',
}) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="absolute left-3 pointer-events-none text-[#0899AA]">
        <Globe size={size === 'sm' ? 14 : 16} />
      </div>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Language selection"
        className={`appearance-none bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] rounded-2xl pl-8 pr-7 font-display font-bold text-[#08233A] cursor-pointer outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 ${
          size === 'sm' ? 'py-1 text-xs' : 'py-2 text-xs sm:text-sm'
        }`}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name || lang.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 pointer-events-none text-[#527080] text-xs">
        ▾
      </div>
    </div>
  )
}

export default LanguageSelector
