// @ts-check
'use strict';

/**
 * Class for indexing and accessing contact info listed in a codeowners file.
 */
function ContactInfo() {
  /** @type {string[]} */
  this.fields = [];
  /** @type {Array<Record<string, string>>} */
  this.owners = [];
}

/**
 * Consume one line of contact info
 * @param {string} line Contact info line, with leading '##' intact
 */
ContactInfo.prototype.addLine = function (line) {
  const dataItems = line.replace(/^##\s*/, '').split(' ');
  if (!this.fields.length) {
    // assume first line defines column field names
    this.fields = dataItems;
    return;
  }
  /** @type {Record<string, string>} */
  const ownerInfo = {};
  for (const field of this.fields) {
    const value = dataItems.shift();
    if (value) {
      ownerInfo[field] = value;
    }
  }
  this.owners.push(ownerInfo);
};

module.exports = ContactInfo;
