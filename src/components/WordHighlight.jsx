export function WordHighlight({ word, status }) {
  const styles = {
    correct: 'bg-mint-100 text-mint-700',
    hesitation: 'bg-sun-100 text-sun-700',
    error: 'bg-coral-500/10 text-coral-500',
    pending: 'text-slate-700',
  }
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded-lg mx-0.5 my-1 font-semibold transition-colors duration-300 ${styles[status] || styles.pending}`}>
      {word}
    </span>
  )
}
