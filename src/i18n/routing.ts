import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ko', 'en', 'ja', 'zh'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed', // ko는 prefix 없이, en/ja/zh만 prefix
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
