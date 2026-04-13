import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
}

export default function StatCard({ icon: Icon, value, label, color = 'emerald' }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   iconBg: 'bg-amber-100' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     iconBg: 'bg-sky-100' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  iconBg: 'bg-violet-100' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    iconBg: 'bg-pink-100' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    iconBg: 'bg-rose-100' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-[#0f2847]">{value}</p>
          <p className="text-[13px] text-gray-500 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}
