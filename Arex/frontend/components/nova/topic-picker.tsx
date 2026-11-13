'use client';

import { useState } from 'react';
import { useT } from './i18n';

export function TopicPicker({
  connected,
  error,
  onChoose,
  onCancel,
  onRetry,
}: {
  connected: boolean;
  error: string | null;
  onChoose: (topic: string) => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const t = useT();
  const [topic, setTopic] = useState('');
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#09090B] px-5 py-10">
      <section
        className="w-full max-w-lg rounded-3xl border border-[#27272A] bg-[#121215] p-7 sm:p-10 shadow-2xl"
        aria-labelledby="topic-title"
      >
        <p role="status" className="mb-8 flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span
            aria-hidden
            className={`size-2 rounded-full ${error ? 'bg-[#EF4444]' : connected ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}
          />
          {error ? t.topicConnectionFailed : connected ? t.topicConnected : t.topicConnecting}
        </p>
        <h1 id="topic-title" className="text-3xl font-semibold tracking-tight text-[#FFFFFF]">
          {t.topicTitle}
        </h1>
        <p className="mt-3 mb-7 text-base leading-relaxed text-[#A1A1AA]">{t.topicBody}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!topic.trim()) {
              setInvalid(true);
              return;
            }
            if (connected && !error) onChoose(topic.trim());
          }}
        >
          <label htmlFor="lesson-topic" className="mb-2 block text-sm font-semibold text-[#FFFFFF]">
            {t.topicLabel}
          </label>
          <input
            id="lesson-topic"
            autoFocus
            value={topic}
            maxLength={160}
            onChange={(e) => {
              setTopic(e.target.value);
              setInvalid(false);
            }}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'topic-error' : undefined}
            placeholder={t.topicPlaceholder}
            className="w-full rounded-xl border border-[#3F3F46] bg-[#18181B] px-4 py-3 text-base text-[#FFFFFF] placeholder:text-[#71717A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFFFFF]"
          />
          {invalid && (
            <p id="topic-error" role="alert" className="mt-2 text-sm text-[#EF4444]">
              {t.topicRequired}
            </p>
          )}
          <p className="mt-5 mb-2 text-xs font-semibold text-[#A1A1AA]">{t.topicTry}</p>
          <div className="flex flex-wrap gap-2">
            {t.topicExamples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setTopic(example);
                  setInvalid(false);
                }}
                className="rounded-full border border-[#27272A] bg-[#18181B] px-3 py-2 text-sm text-[#E4E4E7] hover:bg-[#27272A] hover:text-[#FFFFFF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFFFFF]"
              >
                {example}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!connected || !!error}
            className="mt-8 w-full rounded-xl bg-[#FFFFFF] px-4 py-3.5 text-base font-semibold text-[#000000] hover:bg-[#E4E4E7] transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFFFFF] disabled:cursor-wait disabled:opacity-50"
          >
            {t.topicExplain}
          </button>
        </form>
        {error && (
          <div role="alert" className="mt-4 text-sm text-[#EF4444]">
            {error}{' '}
            <button onClick={onRetry} className="font-semibold underline">
              {t.retry}
            </button>
          </div>
        )}
        <button
          onClick={onCancel}
          className="mt-5 py-2 text-sm text-[#A1A1AA] hover:text-[#FFFFFF] underline underline-offset-4"
        >
          {t.topicCancel}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-[#71717A]">{t.topicMicNote}</p>
      </section>
    </div>
  );
}
