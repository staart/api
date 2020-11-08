/**
 * Parse a string like "a: 1, b: 2" to { a: 1, b: 2 }
 * @param objectLiteralString - String to parse
 * @source https://github.com/mbest/js-object-literal-parse
 */
export const parseObjectLiteral = (
  objectLiteralString: string,
): [string, string | undefined][] => {
  const stringDouble = '"(?:[^"\\\\]|\\\\.)*"';
  const stringSingle = "'(?:[^'\\\\]|\\\\.)*'";
  const stringRegexp = '/(?:[^/\\\\]|\\\\.)*/w*';
  const specials = ',"\'{}()/:[\\]';
  const everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']';
  const oneNotSpace = '[^\\s]';
  const token = RegExp(
    stringDouble +
      '|' +
      stringSingle +
      '|' +
      stringRegexp +
      '|' +
      everyThingElse +
      '|' +
      oneNotSpace,
    'g',
  );
  const divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/;
  const keywordRegexLookBehind: Record<string, number> = {
    in: 1,
    return: 1,
    typeof: 1,
  };
  let str = objectLiteralString.trim();
  if (str.charCodeAt(0) === 123) str = str.slice(1, -1);
  const result: [string, string | undefined][] = [];
  let toks = str.match(token) as RegExpMatchArray;
  if (!toks) return result;
  let key: string | undefined = undefined;
  let values = [];
  let depth = 0;
  toks.push(',');
  for (let i = 0, tok: string; (tok = toks[i]); ++i) {
    const c = tok.charCodeAt(0);
    if (c === 44) {
      if (depth <= 0) {
        if (!key && values.length === 1) {
          key = values.pop();
        }
        if (key)
          result.push([key, values.length ? values.join('') : undefined]);
        key = undefined;
        values = [];
        depth = 0;
        continue;
      }
    } else if (c === 58) {
      if (!depth && !key && values.length === 1) {
        key = values.pop();
        continue;
      }
    } else if (c === 47 && i && tok.length > 1) {
      const match = toks[i - 1].match(divisionLookBehind);
      if (match && !keywordRegexLookBehind[match[0]]) {
        str = str.substr(str.indexOf(tok) + 1);
        const result = str.match(token);
        if (result) toks = result;
        toks.push(',');
        i = -1;
        tok = '/';
      }
    } else if (c === 40 || c === 123 || c === 91) {
      ++depth;
    } else if (c === 41 || c === 125 || c === 93) {
      --depth;
    } else if (!key && !values.length && (c === 34 || c === 39)) {
      tok = tok.slice(1, -1);
    }
    values.push(tok);
  }
  return result;
};
