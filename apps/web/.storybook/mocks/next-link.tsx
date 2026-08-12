import type { AnchorHTMLAttributes, ReactNode } from 'react';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  children?: ReactNode;
  href: string | { pathname?: string };
};

export default function Link({ children, href, ...props }: LinkProps) {
  const resolvedHref = typeof href === 'string' ? href : (href.pathname ?? '#');

  return (
    <a href={resolvedHref} {...props}>
      {children}
    </a>
  );
}
