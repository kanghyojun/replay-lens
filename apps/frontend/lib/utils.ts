import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decode HTML entities and special tags from StarCraft II names
 * - &lt; -> <
 * - &gt; -> >
 * - &amp; -> &
 * - &quot; -> "
 * - &#39; -> '
 * - <sp/> -> space
 */
export function decodeSC2Name(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/<sp\/>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
