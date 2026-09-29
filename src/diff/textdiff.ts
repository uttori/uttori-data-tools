import { diff, Op } from "./diff.js";

export const DEFAULT_CONTEXT = 3;

/** Edit describes a single edit of a line-by-line diff. */
export interface TextEdit {
  /** The edit operation. */
  op: number;
  /** The line. */
  line: string;
}

/** Hunk describes a sequence of consecutive edits. */
export interface TextHunk {
  /** The start line in x (zero-based). */
  posX: number;
  /** The end line in x (zero-based). */
  endX: number;
  /** The start line in y (zero-based). */
  posY: number;
  /** The end line in y (zero-based). */
  endY: number;
  /** The edits to transform x lines PosX..EndX to y lines PosY..EndY. */
  edits: TextEdit[];
}

/**
 * Splits text into lines, preserving newline characters
 * @param text The text to split
 * @returns Array of lines with newlines preserved
 */
function splitLines(text: string): string[] {
  if (!text) {
    return [];
  }

  const lines: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      lines.push(text.substring(start, i + 1));
      start = i + 1;
    }
  }

  // Add remaining text if any
  if (start < text.length) {
    lines.push(text.substring(start));
  }

  return lines;
}

/**
 * Hunks compares the lines in x and y and returns the changes necessary to convert from one to the other.
 * The output is a sequence of hunks that each describe a number of consecutive edits.
 * Hunks include a number of matching elements before and after the last delete or insert operation.
 * If x and y are identical, the output has length zero.
 * @param x The first text to compare
 * @param y The second text to compare
 * @param context Number of matching lines to include around changes (default: 3)
 * @returns The hunks for the diff. The hunks describe the changes necessary to convert from x to y.
 */
export function textHunks(x: string, y: string, context = DEFAULT_CONTEXT): TextHunk[] {
  const xlines = splitLines(x);
  const ylines = splitLines(y);

  const { rx, ry } = diff(xlines, ylines);

  return createTextHunks(xlines, ylines, rx, ry, context);
}

/**
 * textEdits compares the lines in x and y and returns the changes necessary to convert from one to the other.
 * textEdits returns edits for every element in the input. If x and y are identical, the output will consist of a match edit for every input element.
 * @param {string} x The first text to compare
 * @param {string} y The second text to compare
 * @returns {TextEdit[]} The edits for the diff.
 */
export function textEdits(x: string, y: string): TextEdit[] {
  const xlines = splitLines(x);
  const ylines = splitLines(y);

  const { rx, ry } = diff(xlines, ylines);

  return createTextEdits(xlines, ylines, rx, ry);
}

const PREFIX_MATCH = " ";
const PREFIX_DELETE = "-";
const PREFIX_INSERT = "+";

/**
 * Unified compares the lines in x and y and returns the changes necessary to convert from one to the other in unified format.
 *
 * @param x The first text to compare
 * @param y The second text to compare
 * @param context Number of matching lines to include around changes (default: 3)
 * @returns The unified diff in string format.
 */
export function unified(x: string, y: string, context = DEFAULT_CONTEXT): string {
  const xlines = splitLines(x);
  const ylines = splitLines(y);

  const { rx, ry } = diff(xlines, ylines);

  const hunks: TextHunk[] = createTextHunks(xlines, ylines, rx, ry, context);

  // Format output.
  let output = "";

  for (const h of hunks) {
    const xCount = h.endX - h.posX;
    const yCount = h.endY - h.posY;
    const xRange = xCount === 1 ? `${h.posX + 1}` : `${h.posX + 1},${xCount}`;
    const yRange = yCount === 1 ? `${h.posY + 1}` : `${h.posY + 1},${yCount}`;
    output += `@@ -${xRange} +${yRange} @@\n`;

    for (const edit of h.edits) {
      switch (edit.op) {
        case Op.Delete:
          output += PREFIX_DELETE;
          output += edit.line;
          if (!edit.line.endsWith("\n")) {
            output += "\n";
          }
          break;
        case Op.Insert:
          output += PREFIX_INSERT;
          output += edit.line;
          if (!edit.line.endsWith("\n")) {
            output += "\n";
          }
          break;
        case Op.Match:
          output += PREFIX_MATCH;
          output += edit.line;
          if (!edit.line.endsWith("\n")) {
            output += "\n";
          }
          break;
      }
    }
  }

  return output;
}

/**
 * Creates hunks with context support, based on Go's rvecs.Hunks implementation
 * @param x The first text to compare
 * @param y The second text to compare
 * @param rx The first array of booleans
 * @param ry The second array of booleans
 * @param context Number of matching lines to include around changes (default: 3)
 * @returns The hunks for the diff. The hunks describe the changes necessary to convert from x to y.
 */
function createTextHunks(
  x: string[],
  y: string[],
  rx: boolean[],
  ry: boolean[],
  context: number,
): TextHunk[] {
  const hunks: TextHunk[] = [];

  // current index into x, y
  let s = 0;
  let t = 0;
  // start of the current hunk
  let s0 = -1;
  let t0 = -1;
  // number of consecutive matches
  let run = 0;
  const xLength = x.length;
  const yLength = y.length;

  while (s < xLength || t < yLength) {
    if ((s < xLength && rx[s]) || (t < yLength && ry[t])) {
      run = 0; // not a match, reset run counter

      // If we're not inside a hunk, start a new hunk or,
      // if there's an overlap due to context, continue with the previous hunk.
      if (s0 < 0) {
        // Start of hunk - include context lines before
        s0 = Math.max(0, s - context);
        t0 = Math.max(0, t - context);
      }

      // Process deletions
      while (s < xLength && rx[s]) {
        s++;
      }
      // Process insertions
      while (t < yLength && ry[t]) {
        t++;
      }
    } else {
      // Match - advance both pointers and count consecutive matches
      while (s < xLength && t < yLength && !rx[s] && !ry[t]) {
        s++;
        t++;
        run++;
      }
    }

    // Active in-progress hunk and we've seen enough matches to close it, or reached end
    if (s0 >= 0 && (run > 2 * context || (s === xLength && t === yLength))) {
      // Calculate how much context to include after the changes
      const delta = Math.min(0, -run + context);
      const s1 = s + delta;
      const t1 = t + delta;

      const edits = createTextEditsForRange(x, y, rx, ry, s0, s1, t0, t1);
      if (edits.length > 0) {
        hunks.push({
          posX: s0,
          endX: s1,
          posY: t0,
          endY: t1,
          edits,
        });
      }

      s0 = -1;
      t0 = -1;
      run = 0;
    }
  }

  return hunks;
}

/**
 * @param x The first text to compare
 * @param y The second text to compare
 * @param rx The first array of booleans
 * @param ry The second array of booleans
 * @param startX The start line in x (zero-based)
 * @param endX The end line in x (zero-based)
 * @param startY The start line in y (zero-based)
 * @param endY The end line in y (zero-based)
 * @returns The edits for the diff.
 */
function createTextEditsForRange(
  x: string[],
  y: string[],
  rx: boolean[],
  ry: boolean[],
  startX: number,
  endX: number,
  startY: number,
  endY: number,
): TextEdit[] {
  const edits: TextEdit[] = [];

  let s = startX,
    t = startY;
  while (s < endX || t < endY) {
    const oldS = s,
      oldT = t;

    // Process deletions
    while (s < endX && s < rx.length && rx[s]) {
      edits.push({
        op: Op.Delete,
        line: x[s],
      });
      s++;
    }

    // Process insertions
    while (t < endY && t < ry.length && ry[t]) {
      edits.push({
        op: Op.Insert,
        line: y[t],
      });
      t++;
    }

    // Process matches
    while (s < endX && t < endY && s < rx.length && t < ry.length && !rx[s] && !ry[t]) {
      edits.push({
        op: Op.Match,
        line: x[s],
      });
      s++;
      t++;
    }

    // Safety check to prevent infinite loop
    /* c8 ignore next 6 */
    if (s === oldS && t === oldT) {
      // If no progress was made, force increment to avoid infinite loop
      if (s < endX) {
        s++;
      } else if (t < endY) {
        t++;
      } else {
        break;
      }
    }
  }

  return edits;
}

/**
 * @param x The first text to compare
 * @param y The second text to compare
 * @param rx The first array of booleans
 * @param ry The second array of booleans
 * @returns The edits for the diff.
 */
function createTextEdits(x: string[], y: string[], rx: boolean[], ry: boolean[]): TextEdit[] {
  const edits: TextEdit[] = [];
  const n = rx.length - 1;
  const m = ry.length - 1;

  let s = 0,
    t = 0;
  while (s < n || t < m) {
    // Process deletions
    while (s < n && rx[s]) {
      edits.push({
        op: Op.Delete,
        line: x[s],
      });
      s++;
    }

    // Process insertions
    while (t < m && ry[t]) {
      edits.push({
        op: Op.Insert,
        line: y[t],
      });
      t++;
    }

    // Process matches
    while (s < n && t < m && !rx[s] && !ry[t]) {
      edits.push({
        op: Op.Match,
        line: x[s],
      });
      s++;
      t++;
    }
  }

  return edits;
}

/**
 * Escapes HTML special characters
 * @param str The string to escape
 * @returns The escaped string.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * htmlTable compares the lines in x and y and returns an HTML table showing the differences.
 * @param x The first text to compare (old version)
 * @param y The second text to compare (new version)
 * @param context Number of matching lines to include around changes (default: 3)
 * @returns HTML table string
 */
export function htmlTable(x: string, y: string, context = DEFAULT_CONTEXT): string {
  const hunks: TextHunk[] = textHunks(x, y, context);

  let html = '<table class="diff">\n<tbody>';

  for (const hunk of hunks) {
    let xLineNo = hunk.posX + 1; // Line numbers are 1-based in display
    let yLineNo = hunk.posY + 1;

    // Track the first and last match in a hunk for block markers
    let firstMatchIndex = -1;
    let lastMatchIndex = -1;
    for (let i = 0; i < hunk.edits.length; i++) {
      if (hunk.edits[i].op === Op.Match) {
        if (firstMatchIndex === -1) {
          firstMatchIndex = i;
        }
        lastMatchIndex = i;
      }
    }

    for (let i = 0; i < hunk.edits.length; i++) {
      const edit: TextEdit = hunk.edits[i];
      const escapedLine = escapeHtml(edit.line);

      let operation = "";
      let opSymbol = "";
      let leftLineNo = "";
      let rightLineNo = "";
      let blockAttr = "";

      switch (edit.op) {
        case Op.Delete: {
          operation = "delete";
          opSymbol = PREFIX_DELETE;
          leftLineNo = `${xLineNo}`;
          rightLineNo = "";

          xLineNo++;
          break;
        }
        case Op.Insert: {
          operation = "insert";
          opSymbol = PREFIX_INSERT;
          leftLineNo = "";
          rightLineNo = `${yLineNo}`;

          yLineNo++;
          break;
        }
        case Op.Match: {
          if (i === firstMatchIndex) {
            blockAttr = ' data-block-start=""';
          } else if (i === lastMatchIndex) {
            blockAttr = ' data-block-end=""';
          }
          operation = "match";
          opSymbol = PREFIX_MATCH;
          leftLineNo = `${xLineNo}`;
          rightLineNo = `${yLineNo}`;

          xLineNo++;
          yLineNo++;
          break;
        }
        /* c8 ignore next 5 */
        default: {
          // oxlint-disable-next-line no-console
          console.warn("🐛 Unknown Edit Operation:", edit.op);
          break;
        }
      }

      const leftNo = leftLineNo
        ? `<td class="line-no">${leftLineNo}</td>`
        : '<td class="line-no"></td>';
      const rightNo = rightLineNo
        ? `<td class="line-no">${rightLineNo}</td>`
        : '<td class="line-no"></td>';

      html +=
        `<tr class="src ${operation}" data-op="${operation}" ${blockAttr}>` +
        `${leftNo}` +
        `${rightNo}` +
        `<td class="op">${opSymbol}</td>` +
        `<td class="code"><code>${escapedLine}</code></td>` +
        "</tr>";
    }
  }

  html += "</tbody>\n</table>";
  return html;
}
