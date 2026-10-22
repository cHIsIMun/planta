import { Routes } from '@angular/router';
import { VitrineComponent } from './pages/vitrine.component';
import { CestaComponent } from './pages/cesta.component';
import { autenticado } from './guards/autenticado.guard';

export const routes: Routes = [
  { path: '', component: VitrineComponent },
  {
    path: 'produtores/:id',
    loadComponent: () => import('./pages/produtor.component').then((m) => m.ProdutorComponent),
  },
  { path: 'cesta', component: CestaComponent, canActivate: [autenticado] },
  { path: '**', redirectTo: '' },
];
