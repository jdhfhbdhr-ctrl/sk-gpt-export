import React from 'react';
import ReactMarkdown from 'react-markdown';

export const tableCells = (line) => {
  const source = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = []; let cell = '', code = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '\\' && source[index + 1] === '|') { cell += '|'; index++; continue; }
    if (char === '`') code = !code;
    if (char === '|' && !code) { cells.push(cell.trim()); cell = ''; } else cell += char;
  }
  cells.push(cell.trim()); return cells;
};
export default function MarkdownTable({ lines }) {
  const header = tableCells(lines[0]);
  const alignment = tableCells(lines[1]).map((cell) => cell.startsWith(':') && cell.endsWith(':') ? 'text-center' : cell.endsWith(':') ? 'text-right' : 'text-left');
  const inline = (value) => <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span>, a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline">{children}</a> }}>{value}</ReactMarkdown>;
  return <div className="my-5 max-w-full overflow-x-auto" tabIndex={0} aria-label="Scrollable table">
    <table className="w-full border-collapse text-base leading-relaxed">
      <thead><tr>{header.map((cell, index) => <th key={index} className={`border bg-muted p-3 font-semibold ${alignment[index]}`}>{inline(cell)}</th>)}</tr></thead>
      <tbody>{lines.slice(2).map((line, row) => <tr key={row}>{header.map((_, index) => <td key={index} className={`border p-3 align-top ${alignment[index]}`}>{inline(tableCells(line)[index] || '')}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}