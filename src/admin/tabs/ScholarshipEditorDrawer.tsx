import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Trash2, X } from 'lucide-react';
import { api, errorMessage, isAuthError } from '../api';
import type { Scholarship } from '../api';
import { ErrorBanner } from '../ui';

/** The API stores/returns an `active` flag that the shared Scholarship type does not model. */
export type AdminScholarship = Scholarship & { active?: boolean };

type Props = {
  /** The row being edited, or null for a fresh "add" form. */
  scholarship: AdminScholarship | null;
  onClose: () => void;
  onAuthError: () => void;
  onSaved: (saved: AdminScholarship) => void;
  onDeleted: (id: string) => void;
};

type UpsertResponse = { ok: boolean; scholarship: AdminScholarship };

const REGION_OPTIONS = ['uk', 'us', 'canada', 'europe', 'australia', 'new-zealand', 'asia', 'africa', 'any'];
const FIELD_OPTIONS = ['business', 'stem', 'health', 'social', 'law', 'arts', 'any'];
const DEGREE_OPTIONS = ['taught', 'research', 'mba', 'phd', 'any'];
const FUNDING_OPTIONS = ['full', 'partial', 'self-partly', 'flexible'];
const MIN_CLASS_OPTIONS: Scholarship['minClass'][] = ['first', '2:1', '2:2', 'third', 'any'];
const IDEAL_EXP_OPTIONS: Scholarship['idealExp'][] = ['none', 'some', 'experienced', 'any'];
const GENDER_OPTIONS: NonNullable<Scholarship['genderEligibility']>[] = ['any', 'female', 'male'];

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function emptyForm(): AdminScholarship {
  return {
    id: '',
    name: '',
    region: '',
    fundingType: '',
    blurb: '',
    regions: [],
    fields: [],
    degrees: [],
    funding: [],
    minClass: 'any',
    idealExp: 'any',
    tags: [],
    weight: 50,
    genderEligibility: 'any',
    active: true,
  };
}

const inputClass =
  'w-full rounded-lg border border-[#c8d6e5] bg-white px-3 py-2 text-sm text-[#26334d] outline-none transition focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#64718a]';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                on
                  ? 'border-[#0077B6] bg-[#e7f4ff] text-[#0077B6]'
                  : 'border-[#c8d6e5] bg-white text-[#64718a] hover:border-[#0077B6]'
              }`}
              aria-pressed={on}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function ScholarshipEditorDrawer({ scholarship, onClose, onAuthError, onSaved, onDeleted }: Props) {
  const isEdit = Boolean(scholarship);
  const [form, setForm] = useState<AdminScholarship>(() => scholarship ?? emptyForm());
  const [idTouched, setIdTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function patch(next: Partial<AdminScholarship>) {
    setForm((cur) => ({ ...cur, ...next }));
  }

  function onNameChange(name: string) {
    setForm((cur) => {
      const next: AdminScholarship = { ...cur, name };
      // In add mode, auto-suggest the slug from the name until the user edits the id directly.
      if (!isEdit && !idTouched) next.id = slugify(name);
      return next;
    });
  }

  const tagsText = useMemo(() => (form.tags || []).join(', '), [form.tags]);

  function validate(): string[] {
    const errs: string[] = [];
    if (!form.id.trim()) errs.push('An id (slug) is required.');
    if (!form.name.trim()) errs.push('Name is required.');
    if (!form.fundingType.trim()) errs.push('Funding type is required.');
    if (!form.blurb.trim()) errs.push('Blurb is required.');
    if ((form.regions || []).length === 0) errs.push('Pick at least one region.');
    if ((form.fields || []).length === 0) errs.push('Pick at least one field.');
    if ((form.degrees || []).length === 0) errs.push('Pick at least one degree.');
    if ((form.funding || []).length === 0) errs.push('Pick at least one funding type.');
    return errs;
  }

  async function save() {
    const errs = validate();
    if (errs.length) {
      setFieldErrors(errs);
      setError('');
      return;
    }
    setFieldErrors([]);
    setSaving(true);
    setError('');
    const payload: AdminScholarship = {
      ...form,
      id: form.id.trim(),
      name: form.name.trim(),
      region: form.region.trim(),
      fundingType: form.fundingType.trim(),
      blurb: form.blurb.trim(),
      weight: Number(form.weight) || 0,
    };
    try {
      const res = await api<UpsertResponse>('/api/admin-scholarships.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'upsert', scholarship: payload }),
      });
      onSaved(res.scholarship);
      onClose();
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      const anyErr = e as { errors?: unknown };
      if (Array.isArray(anyErr.errors)) setFieldErrors(anyErr.errors.map(String));
      setError(errorMessage(e, 'Could not save this scholarship'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!scholarship) return;
    if (!window.confirm(`Remove ${scholarship.name} from the engine?`)) return;
    setDeleting(true);
    setError('');
    try {
      await api('/api/admin-scholarships.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id: scholarship.id }),
      });
      onDeleted(scholarship.id);
      onClose();
    } catch (e) {
      if (isAuthError(e)) {
        onAuthError();
        return;
      }
      setError(errorMessage(e, 'Could not delete this scholarship'));
    } finally {
      setDeleting(false);
    }
  }

  const busy = saving || deleting;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Scholarship editor">
      <div className="absolute inset-0 bg-[#102548]/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-[0_24px_80px_rgba(16,37,72,0.35)]">
        <div className="sticky top-0 z-10 border-b border-[#edf1f6] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-[#102548]">
                {isEdit ? form.name || 'Edit scholarship' : 'Add scholarship'}
              </h2>
              <p className="truncate text-sm text-[#64718a]">
                {isEdit ? form.id : 'New entry for the recommendation engine'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c8d6e5] text-[#64718a] transition hover:border-[#0077B6] hover:text-[#0077B6]"
              aria-label="Close editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pt-4">
          <ErrorBanner message={error} />
          {fieldErrors.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <ul className="list-disc pl-5">
                {fieldErrors.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid gap-4 px-5 pb-6">
          <Field label="Id (slug)">
            {isEdit ? (
              <input value={form.id} readOnly className={`${inputClass} cursor-not-allowed bg-[#f6f8fb] text-[#64718a]`} />
            ) : (
              <input
                value={form.id}
                onChange={(e) => {
                  setIdTouched(true);
                  patch({ id: e.target.value });
                }}
                onBlur={(e) => patch({ id: slugify(e.target.value) })}
                placeholder="lowercase-kebab-id"
                className={`${inputClass} font-mono`}
              />
            )}
          </Field>

          <Field label="Name">
            <input value={form.name} onChange={(e) => onNameChange(e.target.value)} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Region (display label)">
              <input
                value={form.region}
                onChange={(e) => patch({ region: e.target.value })}
                placeholder="United Kingdom"
                className={inputClass}
              />
            </Field>
            <Field label="Funding type (display label)">
              <input
                value={form.fundingType}
                onChange={(e) => patch({ fundingType: e.target.value })}
                placeholder="Fully funded"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Blurb">
            <textarea
              value={form.blurb}
              onChange={(e) => patch({ blurb: e.target.value })}
              rows={4}
              className={inputClass}
            />
          </Field>

          <CheckboxGroup
            label="Regions (codes)"
            options={REGION_OPTIONS}
            value={form.regions || []}
            onChange={(regions) => patch({ regions })}
          />
          <CheckboxGroup
            label="Fields"
            options={FIELD_OPTIONS}
            value={form.fields || []}
            onChange={(fields) => patch({ fields })}
          />
          <CheckboxGroup
            label="Degrees"
            options={DEGREE_OPTIONS}
            value={form.degrees || []}
            onChange={(degrees) => patch({ degrees })}
          />
          <CheckboxGroup
            label="Funding"
            options={FUNDING_OPTIONS}
            value={form.funding || []}
            onChange={(funding) => patch({ funding })}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min class">
              <select
                value={form.minClass}
                onChange={(e) => patch({ minClass: e.target.value as Scholarship['minClass'] })}
                className={inputClass}
              >
                {MIN_CLASS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ideal experience">
              <select
                value={form.idealExp}
                onChange={(e) => patch({ idealExp: e.target.value as Scholarship['idealExp'] })}
                className={inputClass}
              >
                {IDEAL_EXP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Gender eligibility">
              <select
                value={form.genderEligibility || 'any'}
                onChange={(e) => patch({ genderEligibility: e.target.value as Scholarship['genderEligibility'] })}
                className={inputClass}
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Weight (1-100)">
              <input
                type="number"
                min={1}
                max={100}
                value={form.weight}
                onChange={(e) => patch({ weight: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Tags (comma-separated)">
              <input
                value={tagsText}
                onChange={(e) =>
                  patch({
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="africa, research, women"
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#c8d6e5] bg-[#f9fbfd] px-4 py-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#0077B6]"
              checked={Boolean(form.active)}
              onChange={(e) => patch({ active: e.target.checked })}
            />
            <span>
              <span className="block text-sm font-bold text-[#102548]">Include in the live recommendation engine</span>
              <span className="block text-xs text-[#64718a]">
                Off keeps the record but hides it from quiz recommendations.
              </span>
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-3 border-t border-[#edf1f6] bg-white px-5 py-4">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-400 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c8d6e5] bg-white px-4 py-2 text-sm font-semibold text-[#102548] transition hover:border-[#0077B6] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#102548] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#173661] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
