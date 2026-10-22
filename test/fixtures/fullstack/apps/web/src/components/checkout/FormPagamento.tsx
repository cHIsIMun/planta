import { loadStripe } from '@stripe/stripe-js';

const stripe = loadStripe('pk_test');

export function FormPagamento() {
  return <fieldset data-stripe={String(!!stripe)} />;
}
