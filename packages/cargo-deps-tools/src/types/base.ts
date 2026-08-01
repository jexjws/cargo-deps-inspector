export interface BaseOptions {
  /**
   * Current working directory
   */
  cwd: string

  /** Path or executable name used to invoke Cargo. */
  cargoPath?: string
}
