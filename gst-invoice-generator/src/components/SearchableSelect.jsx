import { useState, useRef, useEffect } from 'react'

export default function SearchableSelect({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef(null)

  // Sync internal search state with external value (for initial load/edit)
  useEffect(() => {
    if (value && value !== search) {
      setSearch(value)
    }
  }, [value])

  const filteredOptions = options.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.code.includes(search) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          const text = e.target.value
          setSearch(text)
          setIsOpen(true)
          // Allow manual typing instantly
          onChange({ description: text }) 
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((item, index) => (
              <div
                key={index}
                className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                onClick={() => {
                  setSearch(item.description)
                  onChange(item)
                  setIsOpen(false)
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">{item.description}</span>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-mono">
                    {item.code}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                  <span className="bg-blue-100 text-blue-800 px-1.5 rounded">{item.category}</span>
                  <span>GST: {item.rate}%</span>
                </div>
              </div>
            ))
          ) : (
            // --- NEW: Custom Item Handler ---
            <div 
                className="p-3 text-blue-600 cursor-pointer hover:bg-gray-50 text-sm font-semibold"
                onClick={() => setIsOpen(false)}
            >
                + Use "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}