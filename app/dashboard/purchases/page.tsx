'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export default function PurchasesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [partyId, setPartyId] = useState('');
  const [lines, setLines] = useState<any[]>([
    {
      productId: '',
      quantity: 1,
      unitPrice: 0,
    },
  ]);
  const [paid, setPaid] = useState(0);
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/parties?type=SUPPLIER').then((r) => r.json()),
    ]).then(([p, c]) => {
      setProducts(p);
      setParties(c);
    });
  }, []);

  const total = useMemo(
    () =>
      lines.reduce(
        (n, l) =>
          n +
          (Number(l.quantity) || 0) *
            (Number(l.unitPrice) ||
              products.find((x) => x._id === l.productId)?.buyPrice ||
              0),
        0
      ),
    [lines, products]
  );

  const due = Math.max(0, total - Number(paid || 0));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (
      !lines.every(
        (l) => l.productId && Number(l.quantity) > 0
      )
    ) {
      setError(
        'Select a product and quantity for every line.'
      );
      return;
    }

    const r = await fetch('/api/purchases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        partyId: partyId || null,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
        paidAmount: Number(paid),
        paymentMethod: method,
        notes: notes || undefined,
      }),
    });

    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Purchase failed');
      return;
    }

    setDone(d.result);
    setLines([
      {
        productId: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
    setPaid(0);
    setNotes('');

    window.dispatchEvent(
      new Event('talikhata:refresh')
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Purchasing
          </p>

          <h1 className="text-3xl font-bold">
            নতুন ক্রয়
          </h1>

          <p className="mt-2 text-slate-500">
            Add stock from suppliers and track what remains payable.
          </p>
        </div>

        <Link
          href="/dashboard/transactions"
          className="btn-secondary"
        >
          History
        </Link>
      </div>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 font-semibold">
          <Truck size={18} />
          Purchase items
        </div>

        {lines.map((l, i) => (
          <div
            key={i}
            className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_150px_40px]"
          >
            <select
              className="field"
              value={l.productId}
              onChange={(e) => {
                const p = products.find(
                  (x) => x._id === e.target.value
                );

                const a = [...lines];

                a[i] = {
                  ...l,
                  productId: e.target.value,
                  unitPrice: p?.buyPrice || 0,
                };

                setLines(a);
              }}
            >
              <option value="">
                Select product
              </option>

              {products.map((p) => (
                <option
                  key={p._id}
                  value={p._id}
                >
                  {p.name} — {p.stockQuantity} {p.unit}
                </option>
              ))}
            </select>

            {/* Quantity */}
            <input
              className="field"
              type="number"
              min="0.01"
              step="0.01"
              value={l.quantity}
              onChange={(e) => {
                const a = [...lines];

                a[i] = {
                  ...l,
                  quantity: Number(e.target.value),
                };

                setLines(a);
              }}
            />

            {/* Buy Price */}
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              value={l.unitPrice}
              onChange={(e) => {
                const a = [...lines];

                a[i] = {
                  ...l,
                  unitPrice: Number(e.target.value),
                };

                setLines(a);
              }}
              placeholder="Buy price"
            />

            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setLines(
                  lines.filter((_, x) => x !== i)
                )
              }
              disabled={lines.length === 1}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setLines([
              ...lines,
              {
                productId: '',
                quantity: 1,
                unitPrice: 0,
              },
            ])
          }
          className="mt-3 text-sm font-semibold text-emerald-700"
        >
          <Plus
            size={15}
            className="inline"
          />{' '}
          Add item
        </button>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <select
            className="field"
            value={partyId}
            onChange={(e) =>
              setPartyId(e.target.value)
            }
          >
            <option value="">
              No supplier / cash purchase
            </option>

            {parties.map((p) => (
              <option
                key={p._id}
                value={p._id}
              >
                {p.name} — payable ৳
                {Math.abs(p.currentBalance || 0)}
              </option>
            ))}
          </select>

          <select
            className="field"
            value={method}
            onChange={(e) =>
              setMethod(e.target.value)
            }
          >
            <option value="CASH">
              Cash
            </option>

            <option value="BANK">
              Bank/MFS
            </option>

            <option value="OTHER">
              Other
            </option>
          </select>

          <input
            className="field"
            placeholder="Notes"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <span className="text-sm text-slate-500">
              Total
            </span>

            <strong className="mt-1 block text-2xl">
              ৳{total.toLocaleString()}
            </strong>
          </div>

          <div>
            <label className="text-sm text-slate-500">
              Paid now
            </label>

            <input
              className="field mt-1"
              type="number"
              min="0"
              max={total}
              value={paid}
              onChange={(e) =>
                setPaid(Number(e.target.value))
              }
            />
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <span className="text-sm text-amber-700">
              Supplier payable
            </span>

            <strong className="mt-1 block text-2xl text-amber-800">
              ৳{due.toLocaleString()}
            </strong>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button className="btn-primary mt-5 w-full">
          Complete purchase
        </button>
      </form>

      {done && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-emerald-800">
            <CheckCircle2 size={20} />
            Purchase completed
          </div>

          <p className="mt-2">
            Total ৳{done.total.toLocaleString()} •
            Paid ৳{done.paidAmount.toLocaleString()} •
            Payable ৳{done.due.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}