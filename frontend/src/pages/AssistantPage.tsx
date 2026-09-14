import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send, User, Loader2 } from "lucide-react";

import { sendChatMessage } from "@/api/careerAssistant";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage } from "@/types/careerAssistant";

export function AssistantPage() {
  const resumeId = useAuthStore((state) => state.resumeId);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      sendChatMessage(message, resumeId ?? undefined),
    onSuccess: (response) => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data.answer,
        },
      ]);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || chatMutation.isPending) return;

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    chatMutation.mutate(message);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            AI Career Assistant
          </h1>
        </div>

        <p className="mt-2 text-muted-foreground">
          Ask questions about your career, skills, roles, and next steps.
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="max-w-lg text-center">
                <Bot className="mx-auto mb-4 h-12 w-12 text-primary" />

                <h2 className="text-xl font-semibold">
                  How can I help with your career?
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Ask about your best-fit roles, missing skills, career
                  direction, or what you should learn next.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    "What skills should I learn next?",
                    "Which roles are best for me?",
                    "How can I improve my career readiness?",
                  ].map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setInput(question)}
                      className="rounded-full border px-3 py-2 text-sm transition hover:bg-muted"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm md:max-w-[88%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <MarkdownContent content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))
          )}

          {chatMutation.isPending && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          {chatMutation.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Unable to get a response right now. Please try again.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-3 md:p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder="Ask your career question..."
              rows={1}
              maxLength={4000}
              className="min-h-11 flex-1 resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />

            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="mt-2 text-right text-xs text-muted-foreground">
            {input.length}/4000
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 leading-6">
      {blocks.map((block, index) => {
        if (isTableBlock(block)) {
          return <MarkdownTable key={index} block={block} />;
        }

        if (/^#{1,6}\s/.test(block)) {
          const lines = block.split("\n");

          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lineIndex) => {
                const match = line.match(/^(#{1,6})\s+(.*)$/);

                if (!match) {
                  return (
                    <p key={lineIndex}>{renderInlineMarkdown(line)}</p>
                  );
                }

                const level = match[1].length;
                const className =
                  level <= 2
                    ? "text-lg font-bold tracking-tight"
                    : "text-base font-semibold";

                return (
                  <div key={lineIndex} className={className}>
                    {renderInlineMarkdown(match[2])}
                  </div>
                );
              })}
            </div>
          );
        }

        if (isListBlock(block)) {
          return (
            <ul key={index} className="ml-5 list-disc space-y-1.5">
              {block
                .split("\n")
                .filter((line) => /^[-*•]\s+/.test(line.trim()))
                .map((line, lineIndex) => (
                  <li key={lineIndex}>
                    {renderInlineMarkdown(
                      line.trim().replace(/^[-*•]\s+/, "")
                    )}
                  </li>
                ))}
            </ul>
          );
        }

        if (isNumberedListBlock(block)) {
          return (
            <ol key={index} className="ml-5 list-decimal space-y-1.5">
              {block
                .split("\n")
                .filter((line) => /^\d+[.)]\s+/.test(line.trim()))
                .map((line, lineIndex) => (
                  <li key={lineIndex}>
                    {renderInlineMarkdown(
                      line.trim().replace(/^\d+[.)]\s+/, "")
                    )}
                  </li>
                ))}
            </ol>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {renderInlineMarkdown(block)}
          </p>
        );
      })}
    </div>
  );
}

function isTableBlock(block: string) {
  const lines = block.split("\n").filter(Boolean);

  return (
    lines.length >= 2 &&
    lines[0].includes("|") &&
    lines.some((line) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line))
  );
}

function MarkdownTable({ block }: { block: string }) {
  const lines = block.split("\n").filter(Boolean);

  const rows = lines
    .filter(
      (line) =>
        !/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line)
    )
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
    );

  if (!rows.length) return null;

  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <table className="w-full min-w-[650px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/60">
            {header.map((cell, index) => (
              <th key={index} className="px-3 py-3 font-semibold">
                {renderInlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-0">
              {header.map((_, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 align-top">
                  {renderInlineMarkdown(row[cellIndex] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isListBlock(block: string) {
  return block
    .split("\n")
    .filter(Boolean)
    .every((line) => /^[-*•]\s+/.test(line.trim()));
}

function isNumberedListBlock(block: string) {
  return block
    .split("\n")
    .filter(Boolean)
    .every((line) => /^\d+[.)]\s+/.test(line.trim()));
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index}>{part.slice(2, -2)}</strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

