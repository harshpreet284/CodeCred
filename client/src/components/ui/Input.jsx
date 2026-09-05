export function Input({ 
  label,
  error,
  id,
  className = '', 
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label htmlFor={id} className="text-sm font-medium text-zinc-300">{label}</label>}
      <input
        id={id}
        className={`bg-zinc-900 border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500'} text-zinc-50 rounded-md px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
