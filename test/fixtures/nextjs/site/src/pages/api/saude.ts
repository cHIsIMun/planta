export default function handler(_req: unknown, res: { status(n: number): { end(): void } }) {
  res.status(200).end();
}
