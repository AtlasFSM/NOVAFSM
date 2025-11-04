'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

export function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const paths = pathname.split('/').filter(Boolean);

  // Remove 'dashboard' from first position if present
  const pathsFiltered = paths[0] === 'dashboard' ? paths.slice(1) : paths;

  // If we're on the dashboard home, don't show breadcrumbs
  if (pathsFiltered.length === 0) {
    return null;
  }

  const breadcrumbs = pathsFiltered.map((path, index) => {
    const href = `/dashboard/${pathsFiltered.slice(0, index + 1).join('/')}`;
    const label = path
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return { href, label };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={breadcrumb.href}>
          <ChevronRight className="h-4 w-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{breadcrumb.label}</span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
