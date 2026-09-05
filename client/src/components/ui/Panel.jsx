export function Panel({ 
  children,
  title,
  className = '', 
}) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        </div>
      )}
      <div className="p-4 text-zinc-300">
        {children}
      </div>
    </div>
  );
}
