import type { ReactNode, CSSProperties } from 'react';
import { useSiteCustomization } from '../contexts/SiteCustomizationContext';

type AsTag = 'span' | 'p' | 'h1' | 'h2' | 'div';

export default function PiacEditable({
  editKey,
  children,
  as: Tag = 'span',
  className = '',
  style,
}: {
  editKey: string;
  children: ReactNode;
  as?: AsTag;
  className?: string;
  style?: CSSProperties;
}) {
  const { devModeActive } = useSiteCustomization();

  return (
    <Tag
      data-piac-edit={editKey}
      className={`${className} ${devModeActive ? 'piac-editable' : ''}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
}
