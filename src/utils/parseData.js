/**
 * Strips the JS variable wrapper from Telangana GIS data files.
 * Input:  var json_XYZ = { ... };
 * Output: valid JSON string
 */
export function parseGISFile(text) {
  // Remove everything up to and including the first `=`
  let clean = text.replace(/^[\s\S]*?=\s*/, '')
  // Remove trailing semicolon
  clean = clean.replace(/;\s*$/, '')
  // Fix trailing commas before ] or } (invalid JSON)
  clean = clean.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(clean)
}
