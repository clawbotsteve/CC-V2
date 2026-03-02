// components/TooltipContent.tsx
import React from 'react';

export const TooltipContent = ({
  title,
  description,
  list,
  teaser = 'Click next to continue.',
}: {
  title?: string;
  description?: string | React.ReactNode;
  list?: string[];
  teaser?: string;
}) => {
  return (
    <div className="space-y-2">
      {title && <p className="text-base font-semibold">{title}</p>}
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
      {list?.length ? (
        <ul className="list-disc list-inside text-sm pl-1 text-muted-foreground space-y-1">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : null}
      {teaser && (
        <p className="text-sm text-muted-foreground italic pt-1">{teaser}</p>
      )}
    </div>
  );
};
