export function Avatar({
  name,
  color,
  size = 28,
  title,
}: {
  name: string;
  color: string;
  size?: number;
  title?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      title={title ?? name}
      className="inline-grid place-items-center rounded-full text-white font-medium select-none"
      style={{
        background: color,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initials || '?'}
    </span>
  );
}
