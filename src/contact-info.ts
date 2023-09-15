/**
 * Class for indexing and accessing contact info listed in a codeowners file.
 */
export class ContactInfo {
  fields: string[] = [];
  owners: Array<Record<string, string>> = [];

  /**
   * Consume one line of contact info
   * @param line Contact info line, with leading '##' intact
   */
  addLine(line: string) {
    const dataItems = line.replace(/^##\s*/, "").split(" ");
    if (!this.fields.length) {
      // assume first line defines column field names
      this.fields = dataItems;
      return;
    }
    const ownerInfo: Record<string, string> = {};
    for (const field of this.fields) {
      const value = dataItems.shift();
      if (value) {
        ownerInfo[field] = value;
      }
    }
    this.owners.push(ownerInfo);
  }
}
