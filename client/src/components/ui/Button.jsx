export function Button({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  loading = false, 
  className = '', 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm px-4 py-2";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 focus:ring-zinc-600",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 focus:ring-zinc-700",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
