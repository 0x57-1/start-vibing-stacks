---
version: 1.1.0
---

# Memory: Memory Optimization Pipeline (MOP)

Setup and `migrate --apply` always copy `.claude/memory-optimization/`.
That copy is core. Running `memory optimize --apply` still needs an explicit yes.

> **CARREGAR SEMPRE** — Esta memória explica o sistema de otimização de memórias estáticas do projeto. O agente deve entender que o MOP é uma ferramenta de manutenção segura, versionável e não intrusiva.

---

## O que é o MOP

O Memory Optimization Pipeline (MOP) é uma ferramenta que avalia, densifica e evolui as memórias estáticas do projeto (`.claude/memories/*.md`) usando **LLM-as-Judge** e, opcionalmente, técnicas evolutivas (GEPA).

**Princípio fundamental:** O MOP **nunca modifica** os arquivos originais. Ele sempre gera versões otimizadas (`.optimized.md`) e relatórios de mudanças para revisão humana.

---

## Regras de Ouro do MOP

1. **Nunca modificar** arquivos `.md` originais
2. **Nunca modificar** `CLAUDE.md`
3. **Nunca modificar** Skills (`SKILL.md`)
4. **Nunca adicionar** hooks automáticos no `settings.json`
5. **Nunca rodar** automaticamente sem confirmação explícita do usuário
6. **Sempre gerar** relatório explicativo antes de qualquer mudança
7. **Sempre ser** idempotente e reversível

---

## Quando o MOP Deve Ser Invocado

O agente deve sugerir o uso do MOP quando detectar:

- 3 ou mais chunks redundantes entre memórias diferentes
- 5 ou mais chunks genéricos (pouca especificidade)
- `CLAUDE.md` com mais de 35.000 caracteres
- Memória estática não atualizada há mais de 30 dias
- Sinais de degradação de qualidade de memória (perda de decisões, padrões ou gotchas)

Do not run `memory optimize --apply` without an explicit yes. The directory install is already done (`npx start-vibing-stacks memory optimize --apply`).

---

## Integração com o Agente

Quando o usuário pedir para otimizar memórias, o agente deve:

1. Executar o pipeline em modo dry-run primeiro
2. Apresentar o relatório gerado
3. Só aplicar mudanças após confirmação explícita
4. Nunca sobrescrever memórias originais sem criar backup explícito

---

## Lembrete para o Modelo

O MOP existe para combater a **degradação progressiva** de memórias estáticas em projetos longos. Ele é uma ferramenta de **manutenção**, não um processo autônomo. Respeite rigorosamente as regras de não intrusão.