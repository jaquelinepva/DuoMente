import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompanyDashboard, IntelligenceNavigation } from '../src/components/company-dashboard';

describe('Painel da empresa', () => {
  it('não apresenta a série fictícia como dados reais nem transforma ausência em zero', () => {
    const html = renderToStaticMarkup(<CompanyDashboard points={[]} />);
    expect(html).toContain('Sem histórico mensal comparável');
    expect(html).toContain('Sem dados');
    expect(html).not.toContain('<rect');
    expect(html).not.toContain('58%');
  });
  it('isola os indicadores por área e mantém dados recebidos como não validados', () => {
    const html = renderToStaticMarkup(
      <CompanyDashboard
        initialArea="pessoas"
        points={[
          {
            indicator_key: 'sales',
            value_text: '999',
            period_label: '2026-08',
            status: 'validated',
            source_type: 'manual',
            source_label: null,
          },
          {
            indicator_key: 'team',
            value_text: '160',
            period_label: '2026-08',
            status: 'received',
            source_type: 'manual',
            source_label: null,
          },
        ]}
      />,
    );
    expect(html).toContain('160');
    expect(html).not.toContain('999');
    expect(html).toContain('Valor recebido · aguardando validação');
  });
  it('navega para gestão sem reativar o gerador de relatório legado', () => {
    const html = renderToStaticMarkup(<IntelligenceNavigation />);
    expect(html).toContain('/app/painel?view=relatorios');
    expect(html).not.toContain('/diagnostico/relatorio');
  });
});
