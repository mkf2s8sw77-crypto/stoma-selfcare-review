export const BASE_PATH = '/stoma-selfcare-review';

export function bp(path: string): string {
  if (!path) return BASE_PATH + '/';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith(BASE_PATH + '/')) return path;
  if (path === BASE_PATH) return path;
  if (path.startsWith('/')) return BASE_PATH + path;
  return BASE_PATH + '/' + path;
}

export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/api/')) return BASE_PATH + path;
  if (path.startsWith('api/')) return BASE_PATH + '/' + path;
  if (path.startsWith('/')) return path;
  return path;
}

export const APP_NAME = '肠造口居家自护 AI 复核助手';
export const CLIENT_NAME = '山西白求恩医院';
