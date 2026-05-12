export async function withTimeout(promise, ms = 8000, label = '') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout:${label || ms}`)), ms)
    ),
  ])
}
