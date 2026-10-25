'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { SlotField } from '../../slots.schema';
import { carClassOptions } from '../../data/vehicles';

const selectOptionsFor = (key: string) => (key === 'carClass' ? carClassOptions : null);

export function SearchForm({ fields }: { fields: SlotField[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const f of fields) if (values[f.key]) params.set(f.key, values[f.key]);
    router.push(`/results?${params.toString()}`);
  };

  return (
    <form className="form-row" data-testid="search-form" onSubmit={onSubmit}>
      {fields.map((field) => {
        const options = field.type === 'select' ? selectOptionsFor(field.key) : null;
        return (
          <div className="field-group" key={field.key} data-testid={`field-${field.key}`}>
            <label className="field-label" htmlFor={`field-input-${field.key}`}>
              {field.label}
            </label>
            {options ? (
              <select
                id={`field-input-${field.key}`}
                className="field-input"
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              >
                <option value="">Any class</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-input-${field.key}`}
                className="field-input"
                type={field.type === 'date' ? 'date' : 'text'}
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.type === 'text' ? field.label : undefined}
              />
            )}
          </div>
        );
      })}
      <button type="submit" className="btn btn-primary" data-testid="search-submit">
        Search cars
      </button>
    </form>
  );
}
