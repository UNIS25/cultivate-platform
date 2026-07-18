"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Info, Leaf, PackageOpen, Scale, Snowflake, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IMPACT_ASSUMPTIONS } from "@/config/impact-assumptions";
import { cn } from "@/lib/format";
import type { Donor, FoodCategory } from "@/types/domain";

interface FormState {
  donorId: string;
  title: string;
  category: FoodCategory;
  quantityKg: string;
  handling: "Ambient" | "Chilled" | "Frozen";
  availableFrom: string;
  collectBy: string;
  city: string;
  notes: string;
}

const initialState: FormState = {
  donorId: "",
  title: "",
  category: "Produce",
  quantityKg: "",
  handling: "Ambient",
  availableFrom: "2026-07-18T15:00",
  collectBy: "2026-07-18T19:00",
  city: "",
  notes: "",
};

const fieldClass = "mt-2 h-12 w-full rounded-[2px] border border-[var(--line-strong)] bg-[var(--surface-raised)] px-3 text-sm outline-none transition-[background-color,border-color,box-shadow] placeholder:text-[#7f8b84] focus:border-[var(--blue)] focus:bg-white focus:shadow-[3px_3px_0_var(--blue-soft)]";

function createInitialState(donors: Donor[]): FormState {
  return { ...initialState, donorId: donors[0]?.id ?? "", city: donors[0]?.city ?? "" };
}

export function ReportForm({ donors, dataReady }: { donors: Donor[]; dataReady: boolean }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => createInitialState(donors));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const quantity = Number(form.quantityKg) || 0;
  const estimate = useMemo(() => ({
    meals: Math.round(quantity * IMPACT_ASSUMPTIONS.mealsPerKilogram.value),
    co2e: quantity * IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value,
  }), [quantity]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function validateStep(currentStep: number) {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!form.title.trim()) nextErrors.title = "Add a short description of the food.";
      if (!quantity || quantity <= 0) nextErrors.quantityKg = "Enter a quantity greater than zero.";
    }
    if (currentStep === 2) {
      if (!form.availableFrom) nextErrors.availableFrom = "Choose when collection can start.";
      if (!form.collectBy) nextErrors.collectBy = "Choose a collection deadline.";
      if (form.availableFrom && form.collectBy && new Date(form.collectBy) <= new Date(form.availableFrom)) nextErrors.collectBy = "The deadline must be after the start time.";
      if (!form.city.trim()) nextErrors.city = "Enter the collection city.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) setStep((current) => Math.min(3, current + 1));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/surplus-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantityKg: quantity,
          availableFrom: new Date(form.availableFrom).toISOString(),
          collectBy: new Date(form.collectBy).toISOString(),
        }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The surplus listing could not be created.");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The surplus listing could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="cn-panel cn-enter-delay mt-6 overflow-hidden p-6 text-center sm:p-12">
        <span className="mx-auto grid size-14 place-items-center bg-[var(--ink)] text-[var(--acid)] shadow-[5px_5px_0_var(--green-soft)]"><CheckCircle2 size={28} /></span>
        <Badge tone="green" className="mt-5">Demo report saved to Supabase</Badge>
        <h2 className="mt-4 text-xl font-bold">Your surplus is ready for matching</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">The fictional report is now an available Supabase listing and can be evaluated by the transparent matching engine.</p>
        <div className="mx-auto mt-7 grid max-w-xl gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
          <div className="bg-[var(--background)] p-4"><p className="text-lg font-bold">{quantity} kg</p><p className="mt-1 text-xs text-[var(--muted)]">Food offered</p></div>
          <div className="bg-[var(--background)] p-4"><p className="text-lg font-bold">{estimate.meals}</p><p className="mt-1 text-xs text-[var(--muted)]">Est. meals</p></div>
          <div className="bg-[var(--background)] p-4"><p className="text-lg font-bold">{estimate.co2e.toFixed(0)} kg</p><p className="mt-1 text-xs text-[var(--muted)]">Est. CO₂e avoided</p></div>
        </div>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Link href="/matches" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-bold text-white shadow-[3px_3px_0_var(--acid)] hover:bg-[var(--green)]">View matches <ArrowRight size={16} /></Link><button onClick={() => { setSubmitted(false); setStep(1); setForm(createInitialState(donors)); }} className="inline-flex min-h-10 items-center justify-center rounded-[3px] border border-[var(--line-strong)] bg-white px-4 text-sm font-bold hover:bg-[var(--background)]">Report another offer</button></div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting} className="cn-enter-delay mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
      <section className="cn-panel overflow-hidden">
        <div className="grid grid-cols-3 border-b border-[var(--ink)] bg-[var(--ink)]">
          {[{number:1,label:"Food details"},{number:2,label:"Collection"},{number:3,label:"Review"}].map((item) => (
            <button key={item.number} type="button" disabled={item.number >= step} onClick={() => setStep(item.number)} className={cn("relative flex min-h-16 items-center justify-center gap-2 border-r border-white/10 px-2 text-xs font-bold last:border-r-0 disabled:cursor-default", step === item.number ? "bg-white text-[var(--ink)]" : item.number < step ? "text-white" : "text-white/40")}>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-[2px] font-mono text-[10px]", item.number < step ? "bg-[var(--acid)] text-[var(--ink)]" : step === item.number ? "bg-[var(--ink)] text-[var(--acid)]" : "bg-white/10 text-white/45")}>{item.number < step ? <Check size={13} /> : `0${item.number}`}</span><span className="hidden sm:inline">{item.label}</span>{step === item.number && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--acid)]" />}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-7">
          {step === 1 && (
            <div><h2 className="text-base font-bold">Describe the available food</h2><p className="mt-1 text-sm text-[var(--muted)]">Clear details help recipients respond quickly and safely.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="text-xs font-bold">Donor organisation</span><select className={fieldClass} disabled={!dataReady || donors.length === 0} value={form.donorId} onChange={(event) => { const donor = donors.find((item) => item.id === event.target.value); update("donorId", event.target.value); if (donor) update("city", donor.city); }}>{donors.length === 0 && <option value="">No donor organisations available</option>}{donors.map((donor) => <option key={donor.id} value={donor.id}>{donor.name} · {donor.city}</option>)}</select></label>
                <label className="sm:col-span-2"><span className="text-xs font-bold">Food description</span><input className={cn(fieldClass, errors.title && "border-[var(--red)]")} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Mixed seasonal vegetables" />{errors.title && <span className="mt-1.5 block text-xs text-[var(--red)]">{errors.title}</span>}</label>
                <label><span className="text-xs font-bold">Food category</span><select className={fieldClass} value={form.category} onChange={(event) => update("category", event.target.value as FoodCategory)}>{["Produce","Bakery","Prepared meals","Dairy","Pantry","Mixed"].map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span className="text-xs font-bold">Quantity in kilograms</span><div className="relative"><input className={cn(fieldClass, "pr-12", errors.quantityKg && "border-[var(--red)]")} type="number" min="1" max="2000" step="1" value={form.quantityKg} onChange={(event) => update("quantityKg", event.target.value)} placeholder="0" /><span className="absolute bottom-3 right-3 text-xs font-bold text-[var(--muted)]">kg</span></div>{errors.quantityKg && <span className="mt-1.5 block text-xs text-[var(--red)]">{errors.quantityKg}</span>}</label>
                <fieldset className="sm:col-span-2"><legend className="text-xs font-bold">Storage and handling</legend><div className="mt-2 grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)]">{(["Ambient","Chilled","Frozen"] as const).map((item) => <button key={item} type="button" onClick={() => update("handling", item)} className={cn("flex min-h-20 flex-col items-center justify-center gap-1.5 bg-white text-xs font-bold transition-colors", form.handling === item ? "bg-[var(--ink)] text-[var(--acid)]" : "text-[var(--muted)] hover:bg-[var(--surface-raised)]")}>{item === "Ambient" ? <PackageOpen size={18} /> : <Snowflake size={18} />}{item}</button>)}</div></fieldset>
              </div>
            </div>
          )}

          {step === 2 && (
            <div><h2 className="text-base font-bold">Set the collection window</h2><p className="mt-1 text-sm text-[var(--muted)]">The exact pickup address remains private in this demonstration.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label><span className="text-xs font-bold">Available from</span><input className={cn(fieldClass, errors.availableFrom && "border-[var(--red)]")} type="datetime-local" value={form.availableFrom} onChange={(event) => update("availableFrom", event.target.value)} />{errors.availableFrom && <span className="mt-1.5 block text-xs text-[var(--red)]">{errors.availableFrom}</span>}</label>
                <label><span className="text-xs font-bold">Collect by</span><input className={cn(fieldClass, errors.collectBy && "border-[var(--red)]")} type="datetime-local" value={form.collectBy} onChange={(event) => update("collectBy", event.target.value)} />{errors.collectBy && <span className="mt-1.5 block text-xs text-[var(--red)]">{errors.collectBy}</span>}</label>
                <label className="sm:col-span-2"><span className="text-xs font-bold">Collection city</span><input className={cn(fieldClass, errors.city && "border-[var(--red)]")} value={form.city} onChange={(event) => update("city", event.target.value)} />{errors.city && <span className="mt-1.5 block text-xs text-[var(--red)]">{errors.city}</span>}</label>
                <label className="sm:col-span-2"><span className="text-xs font-bold">Handling notes</span><textarea className="mt-2 min-h-32 w-full resize-y rounded-[2px] border border-[var(--line-strong)] bg-[var(--surface-raised)] p-3 text-sm outline-none placeholder:text-[#7f8b84] focus:border-[var(--blue)] focus:bg-white focus:shadow-[3px_3px_0_var(--blue-soft)]" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Packaging, allergens, access instructions or vehicle requirements" /><span className="mt-1.5 block text-[11px] text-[var(--muted)]">Do not include personal contact details.</span></label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div><h2 className="text-base font-bold">Review the surplus report</h2><p className="mt-1 text-sm text-[var(--muted)]">Confirm the information before creating the fictional demonstration listing.</p>
              <dl className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">{[
                ["Donor", donors.find((item) => item.id === form.donorId)?.name ?? "—"], ["Food", form.title], ["Category", form.category], ["Quantity", `${quantity} kg · approximately ${estimate.meals} meals`], ["Handling", form.handling], ["Collection", `${new Date(form.availableFrom).toLocaleString("en-IE")} to ${new Date(form.collectBy).toLocaleString("en-IE")}`], ["Location", form.city],
              ].map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[130px_1fr]"><dt className="text-xs font-bold text-[var(--muted)]">{label}</dt><dd className="text-sm font-semibold">{value}</dd></div>)}</dl>
              <label className="mt-5 flex items-start gap-3 border-l-4 border-[var(--blue)] bg-[var(--blue-soft)] p-4"><input required type="checkbox" className="mt-0.5 size-4 accent-[var(--green)]" /><span className="text-xs leading-5 text-[var(--blue)]">I confirm that this fictional listing is suitable for the demonstration and contains no personal or commercially sensitive information.</span></label>
            </div>
          )}
        </div>

        {submitError && <div role="alert" className="mx-5 mb-5 border-l-4 border-[var(--red)] bg-[var(--red-soft)] p-3 text-xs leading-5 text-[var(--red)] sm:mx-7">{submitError}</div>}
        <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--background)] px-5 py-4 sm:px-6">
          <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</Button>
          {step < 3 ? <Button type="button" disabled={!dataReady || donors.length === 0} onClick={nextStep}>Continue <ArrowRight size={16} /></Button> : <Button type="submit" disabled={submitting || !dataReady || donors.length === 0}><Check size={16} /> {submitting ? "Saving..." : "Create demo listing"}</Button>}
        </div>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <section className="cn-panel-dark p-5 sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Leaf className="text-[var(--acid)]" size={18} /><h2 className="text-sm font-bold">Live sharing calculator</h2></div><span className="cn-live-dot" /></div><p className="mt-2 text-xs leading-5 text-white/55">Illustrative estimates respond to the quantity field.</p><div className="mt-6 divide-y divide-white/10 border-y border-white/10"><div className="flex items-center gap-3 py-4"><Users className="text-[#90afff]" size={19} /><div className="flex-1"><p className="text-2xl font-semibold">{estimate.meals}</p><p className="font-mono text-[9px] text-white/45">ESTIMATED MEALS</p></div></div><div className="flex items-center gap-3 py-4"><Leaf className="text-[var(--acid)]" size={19} /><div className="flex-1"><p className="text-2xl font-semibold">{estimate.co2e.toFixed(1)} kg</p><p className="font-mono text-[9px] text-white/45">ESTIMATED CO₂E AVOIDED</p></div></div><div className="flex items-center gap-3 py-4"><Scale className="text-[#ffc270]" size={19} /><div className="flex-1"><p className="text-2xl font-semibold">{quantity || 0} kg</p><p className="font-mono text-[9px] text-white/45">FOOD IN CIRCULATION</p></div></div></div><div className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-white/45"><Info className="mt-0.5 shrink-0" size={13} /> Demo factors: {IMPACT_ASSUMPTIONS.mealsPerKilogram.value} meals/kg and {IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value} kg CO2e/kg.</div></section>
        <section className="border border-[var(--ink)] bg-[var(--acid)] p-5"><Clock3 className="text-[var(--ink)]" size={20} /><h2 className="mt-4 text-sm font-bold">Collection windows matter</h2><p className="mt-2 text-xs leading-5 text-[var(--ink)]/65">Short, accurate windows improve match quality and reduce unnecessary journeys for volunteers.</p></section>
      </aside>
    </form>
  );
}
