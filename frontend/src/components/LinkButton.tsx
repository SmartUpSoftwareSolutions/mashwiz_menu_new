
import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface LinkButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  asComponent?: React.ComponentType<any> | keyof JSX.IntrinsicElements;
  onClick?: React.MouseEventHandler<HTMLElement>;
  disabled?: boolean;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  icon: Icon,
  label,
  className,
  style,
  hoverStyle,
  asComponent,
  onClick,
  disabled = false,
}) => {
  const [isHover, setIsHover] = useState(false);

  const combinedStyle = isHover && hoverStyle ? { ...style, ...hoverStyle } : style;
  const Component = (asComponent ?? 'a') as any;
  const isAnchor = typeof Component === 'string' ? Component === 'a' : false;

  const handleClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (onClick) {
      onClick(event);
    }
  };

  const sharedProps: Record<string, any> = {
    className: `flex items-center justify-center space-x-2 rounded-md px-4 py-2 transition ${className ?? ''}`,
    style: combinedStyle,
    onMouseEnter: () => setIsHover(true),
    onMouseLeave: () => setIsHover(false),
    onClick: handleClick,
    'aria-disabled': disabled || undefined,
    tabIndex: disabled ? -1 : undefined,
  };

  if (isAnchor) {
    sharedProps.href = href;
    sharedProps.rel = 'noopener noreferrer';
  } else {
    sharedProps.to = href;
    sharedProps.disabled = disabled;
  }

  return (
    <Component {...sharedProps}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Component>
  );
};

export default LinkButton;