---
id: ADR-0001
title: E-mails transacionais por evento
status: accepted
---

# Contexto

O envio de e-mail não pode atrasar a resposta do cadastro.

# Decisão

O serviço publica um evento e um listener envia o e-mail.
