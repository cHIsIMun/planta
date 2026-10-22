import { Component, inject } from '@angular/core';
import { FeiraApi } from '../services/feira-api.service';

@Component({
  selector: 'feira-cesta',
  standalone: true,
  template: `<h1>Sua cesta</h1><button (click)="fechar()">Fechar cesta</button>`,
})
export class CestaComponent {
  private readonly api = inject(FeiraApi);
  cestaId = '';

  fechar() {
    this.api.fecharCesta(this.cestaId).subscribe();
  }
}
