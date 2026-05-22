import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'main';
}

export function Container({ children, className = '', as: Tag = 'div' }: ContainerProps) {
  return <Tag className={`container-site ${className}`}>{children}</Tag>;
}
