/** Dynamic imports cache failed loads; recovering requires a fresh document request. */
export class PageLoadError extends Error {
  constructor(cause: unknown) {
    super('A page download failed.', { cause })
    this.name = 'PageLoadError'
  }
}
