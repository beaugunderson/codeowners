interface Codeowners {
  /**
   * The codeowners file found as a parent of the cwd
   */
  readonly codeownersFilePath: string;
  /**
   * The assumed project directory root for paths within the codeowners file
   */
  readonly codeownersDirectory: string;
  /**
   * Object built from space delimited table of contact info prefixed by '##'
   */
  readonly contactInfo: Array<Record<string, string>>;

  /**
   * Get a list of owner(s) for a given file/folder path
   * @param filePath relative to the codeownersDirectory
   */
  getOwner(filePath: string): string[];

  /**
   * Get a list of paths owned by a given user or team
   * @param owner team or user name
   */
  getPathsForOwner(owner: string): string[];
}

declare const Codeowners: {
  /**
   * Searches upwards for a codeowners file either in a direct
   * parent or within a docs/ or .github/ or .gitlab/ folder in a parent
   * folder of the cwd.
   * @param cwd current directory, defaults to process.cwd()
   */
  new (cwd?: string, fileName?: string): Codeowners;
};
export = Codeowners;
