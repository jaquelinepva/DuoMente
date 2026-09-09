# Gráficos VisActor no DuoMente

Pasta destinada à integração de gráficos interativos do VisActor ao site DuoMente, com hospedagem prevista na Vercel.

## Componentes previstos

- **VChart (`@visactor/vchart`)**: renderização dos gráficos no site.
- **VMind (`@visactor/vmind`)**, opcional: geração de configurações de gráficos a partir de dados e pedidos em linguagem natural, usando um serviço de IA.

## Status

Pasta criada para organizar a integração. Ainda não foram adicionados componentes executáveis, instaladas dependências ou configurada a publicação na Vercel.

## Próximas etapas

1. Identificar a aplicação e a pasta configurada como raiz do projeto na Vercel.
2. Instalar `@visactor/vchart` na aplicação.
3. Implementar o primeiro gráfico com os dados e indicadores definidos para o DuoMente.
4. Verificar exibição em dispositivos móveis e o build da aplicação.
5. Avaliar o VMind se houver necessidade de geração de gráficos por texto. Credenciais de API devem ficar no servidor.

## Referências

- [VisActor VMind](https://visactor.io/vmind)
- [Guia de início do VMind](https://visactor.io/vmind/guide/Getting_Started/Getting_Started)
- [VChart](https://visactor.io/vchart)
