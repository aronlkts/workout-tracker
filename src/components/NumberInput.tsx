import { useEffect, useRef, useState } from 'react';

interface NumberInputProps {
  id?: string;
  value: number | null;
  onCommit: (value: number | null) => void;
  /** An empty box commits null rather than 0 — used for "RIR not recorded". */
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  decimal?: boolean;
}

const show = (value: number | null) => (value === null ? '' : String(value));

export function NumberInput({
  id,
  value,
  onCommit,
  allowEmpty = false,
  placeholder,
  className = 'numfield',
  decimal = false,
  ...rest
}: NumberInputProps) {
  const [text, setText] = useState(() => show(value));
  const focused = useRef(false);

  // Follow the stored value unless the field is being typed into.
  useEffect(() => {
    if (!focused.current && Number(text) !== value) setText(show(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handle = (next: string) => {
    setText(next);
    if (next.trim() === '') {
      onCommit(allowEmpty ? null : 0);
      return;
    }
    const parsed = Number(next.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 0) onCommit(parsed);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={text}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(show(value));
      }}
      onChange={(e) => handle(e.target.value)}
      {...rest}
    />
  );
}
