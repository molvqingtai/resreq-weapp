/**
 * Determines whether the specified URL is absolute
 * Reference: https://github.com/axios/axios/blob/v1.x/lib/helpers/isAbsoluteURL.js
 */
const isAbsoluteURL = (url: string) => {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)
}

export default isAbsoluteURL
