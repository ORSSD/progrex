export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand${small ? ' brand-sm' : ''}`}>
      <img className="brand-mark" src="/progrex-mark-mint-trim.png" alt="" />
      <img className="brand-wordmark" src="/progrex-wordmark-mint-trim.png" alt="Progrex" />
    </span>
  );
}
