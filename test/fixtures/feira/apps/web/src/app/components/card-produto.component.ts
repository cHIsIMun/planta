import { Component, input } from '@angular/core';

@Component({
  selector: 'feira-card-produto',
  standalone: true,
  template: `<article><h2>{{ produto().nome }}</h2><p>{{ produto().precoKg }} / kg</p></article>`,
})
export class CardProdutoComponent {
  produto = input.required<{ nome: string; precoKg: number }>();
}
