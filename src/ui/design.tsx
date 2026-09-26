import {
  IconApple,
  IconBasket,
  IconBath,
  IconBottle,
  IconBowl,
  IconBread,
  IconMilk,
  IconSnowflake,
  IconSpray,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

import type { NeedTone } from 'src/domain/presentation';
import type { ProductCategory } from 'src/domain/types';

// Small visual building blocks of the Everyday design (see docs/DESIGN.md).

type IconProps = { size?: number; stroke?: number; 'aria-hidden'?: 'true' | 'false' };
export type IconComponent = ComponentType<IconProps>;

const CATEGORY_ICONS: Record<ProductCategory, IconComponent> = {
  DAIRY: IconMilk,
  BAKERY: IconBread,
  PRODUCE: IconApple,
  PANTRY: IconBowl,
  BEVERAGES: IconBottle,
  FROZEN: IconSnowflake,
  HOUSEHOLD: IconSpray,
  PERSONAL_CARE: IconBath,
  OTHER: IconBasket,
};

export const Icon = ({ icon: Component, size = 20 }: { icon: IconComponent; size?: number }) => (
  <span className="er-icon" aria-hidden="true">
    <Component size={size} stroke={1.75} aria-hidden="true" />
  </span>
);

// A round, category-coloured product avatar.
export const ProductAvatar = ({
  category,
  size = 44,
}: {
  category: ProductCategory | null;
  size?: number;
}) => {
  const key = category ?? 'OTHER';
  const Component = CATEGORY_ICONS[key];

  return (
    <span
      className="er-avatar"
      data-category={key.toLowerCase()}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <Component size={Math.round(size * 0.5)} stroke={1.75} aria-hidden="true" />
    </span>
  );
};

// Ring gauge for "how likely needed". Estimates get a "~" and a lighter,
// dashed track so they never look as certain as a confirmed report.
export const NeedGauge = ({
  value,
  tone,
  isEstimate,
  label,
  size = 56,
}: {
  value: number;
  tone: NeedTone;
  isEstimate: boolean;
  label: string;
  size?: number;
}) => {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const filled = (circumference * Math.max(percent, 3)) / 100;

  return (
    <div
      className="er-gauge"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="er-gauge-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={isEstimate ? '3 4' : undefined}
        />
        <circle
          className="er-gauge-value"
          data-tone={tone}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className="er-gauge-text"
        data-tone={tone}
        style={{ fontSize: `${Math.round(size * 0.25)}px` }}
      >
        {isEstimate ? '~' : ''}
        {percent}
        <small>%</small>
      </span>
    </div>
  );
};
