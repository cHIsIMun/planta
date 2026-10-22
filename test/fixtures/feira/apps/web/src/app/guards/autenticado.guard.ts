import { CanActivateFn } from '@angular/router';

export const autenticado: CanActivateFn = () => !!localStorage.getItem('sessao');
