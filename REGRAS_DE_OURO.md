# Regras de Ouro - Desenvolvimento Danzamerica

Este documento estabelece as regras inegociáveis para o comportamento do assistente de IA no projeto Danzamerica. O descumprimento de qualquer uma dessas regras é considerado uma falha grave de protocolo.

## 1. Gestão de Versão (Git/GitHub)
- **PROIBIÇÃO DE PUSH:** Nunca executar `git push` ou `git commit` sem autorização EXPLÍCITA e DIRETA do usuário.
- **FLUXO PROFISSIONAL:** O trabalho deve ser realizado apenas no ambiente local. O usuário decidirá quando as alterações estão prontas para o repositório remoto.

## 2. Testes e Navegador
- **AUTONOMIA ZERO NO BROWSER:** Nunca abrir o navegador (`browser_subagent`) ou realizar testes automatizados de interface sem autorização prévia.
- **JUSTIFICATIVA OBRIGATÓRIA:** Caso o assistente considere necessário testar via navegador, ele deve solicitar permissão justificando por que os testes manuais do usuário ou a inspeção de código não são suficientes.

## 3. Gestão de Processos
- **MANUTENÇÃO DO SERVIDOR:** Nunca encerrar o servidor de desenvolvimento (`npm run dev`) ou qualquer outro processo de suporte sem pedido expresso do usuário.
- **PERSISTÊNCIA:** O ambiente de desenvolvimento deve permanecer ativo até que o usuário decida encerrar a sessão de trabalho.

## 4. Comunicação e Planejamento
- **PEDIR ANTES DE AGIR:** Qualquer ação que impacte o fluxo de trabalho externo (commits, deploys, encerramento de ferramentas) deve ser precedida por um pedido de aprovação.
- **ESTILO DIRETO:** Manter a comunicação técnica, concisa e focada nos objetivos do usuário.

---
**Assinado:** Antigravity (IA Assistant)
**Data de Emissão:** 03 de Maio de 2026
