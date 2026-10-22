import { Component, inject } from '@angular/core';
import { FeiraApi } from '../services/feira-api.service';
import { CardProdutoComponent } from '../components/card-produto.component';

@Component({
  selector: 'feira-vitrine',
  standalone: true,
  imports: [CardProdutoComponent],
  templateUrl: './vitrine.component.html',
})
export class VitrineComponent {
  private readonly api = inject(FeiraApi);
  produtos$ = this.api.produtosDaEstacao('primavera');
}
