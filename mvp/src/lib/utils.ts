import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const display = (value: unknown): string =>
  value === null || value === undefined || value === '' ? 'N/D' : String(value);
export const dateBR = (value: string | null | undefined) =>
  value
    ? new Date(value.length === 10 ? value + 'T12:00:00' : value).toLocaleDateString('pt-BR')
    : 'N/D';
