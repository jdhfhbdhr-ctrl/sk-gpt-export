import React from 'react';
import MarkdownBody from '@/components/MarkdownBody';
import MarkdownTable, { tableCells } from '@/components/MarkdownTable';

export default function MarkdownText({ children }) {
  if (!children) return null;
  const lines = String(children).split('\n');
  const blocks = [];
  let buffer = [], fence = null;
  const flush = () => { if (buffer.length) { blocks.push(<MarkdownBody key={blocks.length}>{buffer.join('\n')}</MarkdownBody>); buffer = []; } };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      buffer.push(line); continue;
    }
    const delimiter = lines[index + 1];
    if (!fence && line.includes('|') && delimiter?.includes('|') && tableCells(delimiter).every((cell) => /^:?-{3,}:?$/.test(cell)) && tableCells(line).length === tableCells(delimiter).length) {
      flush();
      const table = [line, delimiter]; index++;
      while (index + 1 < lines.length && lines[index + 1].trim() && lines[index + 1].includes('|') && !/^\s*(```|~~~)/.test(lines[index + 1])) table.push(lines[++index]);
      blocks.push(<MarkdownTable key={blocks.length} lines={table} />);
    } else buffer.push(line);
  }
  flush();
  return <div className="sk-gpt-markdown min-w-0 max-w-full [overflow-wrap:anywhere]">{blocks}</div>;
}