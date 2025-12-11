export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
