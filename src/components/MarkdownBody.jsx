import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownBody({ children }) {
  return <ReactMarkdown components={{
    a: ({ node, ...props }) => <a className="underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
    ul: ({ node, ...props }) => <ul className="my-4 list-disc space-y-2 pl-6" {...props} />,
    ol: ({ node, ...props }) => <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />,
    h1: ({ node, ...props }) => <h1 className="mb-4 mt-6 font-heading text-2xl font-semibold leading-snug" {...props} />,
    h2: ({ node, ...props }) => <h2 className="mb-3 mt-6 font-heading text-xl font-semibold leading-snug" {...props} />,
    h3: ({ node, ...props }) => <h3 className="mb-3 mt-5 text-lg font-semibold" {...props} />,
    p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
    pre: ({ node, ...props }) => <pre className="my-4 max-w-full overflow-x-auto rounded-xl border bg-muted p-4 text-[15px] leading-relaxed [overflow-wrap:normal] [&_code]:whitespace-pre" {...props} />,
    code: ({ node, ...props }) => <code className="rounded bg-muted px-1 font-mono text-[0.9em]" {...props} />,
    blockquote: ({ node, ...props }) => <blockquote className="my-4 border-l-2 pl-4 text-muted-foreground" {...props} />,
  }}>{children}</ReactMarkdown>;
}