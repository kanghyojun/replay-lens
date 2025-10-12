import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { abbreviateUnitName, abbreviateUpgradeName } from '@repo/sc2-utils/unit-utils';

interface UnitIconProps {
  name: string;
  count: number;
  type: 'building' | 'unit' | 'upgrade';
}

export function UnitIcon({ name, count, type }: UnitIconProps) {
  const displayName = type === 'upgrade' ? abbreviateUpgradeName(name) : abbreviateUnitName(name);
  const colorClasses = {
    building: {
      border: 'border-amber-600',
      bg: 'bg-amber-900/30',
      bgHover: 'hover:bg-amber-900/50',
      text: 'text-amber-100',
      badge: 'bg-amber-600',
    },
    unit: {
      border: 'border-blue-600',
      bg: 'bg-blue-900/30',
      bgHover: 'hover:bg-blue-900/50',
      text: 'text-blue-100',
      badge: 'bg-blue-600',
    },
    upgrade: {
      border: 'border-green-600',
      bg: 'bg-green-900/30',
      bgHover: 'hover:bg-green-900/50',
      text: 'text-green-100',
      badge: 'bg-green-600',
    },
  };

  const colors = colorClasses[type];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`relative w-[60px] h-[60px] border ${colors.border} ${colors.bg} rounded flex items-center justify-center cursor-help ${colors.bgHover} transition-colors`}
        >
          <span className={`text-sm font-bold ${colors.text}`}>
            {displayName}
          </span>
          {count > 1 && (
            <span className={`absolute bottom-0 right-0 ${colors.badge} text-white text-xs font-bold px-1 rounded-tl`}>
              {count}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {name} {count > 1 ? `(×${count})` : ''}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
