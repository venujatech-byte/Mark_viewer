import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function relativeUrl(document: string, destination: string): URL {
  if (!destination || /[\u0000-\u0020\u007f\\]/.test(destination) || destination.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(destination)) {
    throw new Error('Only relative file URLs are allowed.');
  }
  const url = new URL(destination, pathToFileURL(document));
  if (url.protocol !== 'file:' || url.host) throw new Error('Invalid local URL.');
  return url;
}

export async function linkUrl(document: string, destination: string): Promise<URL> {
  if (/^https?:\/\//i.test(destination) || /^mailto:/i.test(destination)) return new URL(destination);
  return relativeUrl(document, destination);
}

export async function imagePath(document: string, destination: string): Promise<string> {
  const root = await realpath(dirname(document));
  const path = await realpath(fileURLToPath(relativeUrl(document, destination)));
  const within = relative(root, path);
  if (within === '..' || within.startsWith('../') || within.startsWith('..\\') || isAbsolute(within)) throw new Error('Image is outside the document folder.');
  if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico'].includes(extname(path).toLowerCase())) throw new Error('Unsupported image type.');
  const info = await stat(path);
  if (!info.isFile() || info.size > 10 * 1024 * 1024) throw new Error('Images must be regular files no larger than 10 MiB.');
  return path;
}
