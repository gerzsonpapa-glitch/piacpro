import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface RouterContextType {
  path: string;
  search: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
}

export const RouterContext = createContext<RouterContextType>({
  path: '/',
  search: '',
  navigate: () => {},
  params: {},
});

export function useRouter() {
  return useContext(RouterContext);
}

const ROUTE_PATTERNS = [
  '/listing/:id',
  '/auction/:id',
  '/edit-listing/:id',
  '/checkout/:id',
  '/profile/:id',
  '/chat/:id',
  '/job/:id',
  '/shops/:slug',
  '/producers/:id',
  '/donations/:id',
  '/offers/:id',
  '/helyi-vallalkozasok/:id',
];

export function useRouterProvider(): RouterContextType {
  const [path, setPath] = useState(window.location.pathname || '/');
  const [search, setSearch] = useState(window.location.search || '');
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((newPath: string) => {
    window.history.pushState({}, '', newPath);
    const [pathname, qs] = newPath.split('?');
    setPath(pathname);
    setSearch(qs ? `?${qs}` : '');
  }, []);

  useEffect(() => {
    const currentParams: Record<string, string> = {};
    for (const pattern of ROUTE_PATTERNS) {
      const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$');
      const match = path.match(regex);
      if (match) {
        const paramNames = pattern.match(/:([^/]+)/g)?.map((p) => p.slice(1)) || [];
        paramNames.forEach((name, i) => { currentParams[name] = match[i + 1]; });
        break;
      }
    }
    setParams(currentParams);
  }, [path]);

  return { path, search, navigate, params };
}

export function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const { navigate } = useRouter();
  return (
    <a href={to} className={className} onClick={(e) => { e.preventDefault(); navigate(to); }}>
      {children}
    </a>
  );
}
