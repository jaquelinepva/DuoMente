'use client';
import { Button } from '@/components/ui/button';
export function ReportExport() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Imprimir / Salvar em PDF
    </Button>
  );
}
