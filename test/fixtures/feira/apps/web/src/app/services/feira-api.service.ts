import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FeiraApi {
  private readonly base = '/api';

  constructor(private readonly http: HttpClient) {}

  produtosDaEstacao(estacao: string) {
    return this.http.get<unknown[]>(`${this.base}/produtores/produtos`, { params: { estacao } });
  }

  montarCesta(itens: { produtoId: string; kg: number }[], clienteEmail: string) {
    return this.http.post(this.base + '/cestas', { itens, clienteEmail });
  }

  fecharCesta(id: string) {
    return this.http.post(`${this.base}/cestas/${id}/fechar`, {});
  }
}
