/**
 * Invoice Editor Page
 * 
 * Requirements: 8.1, 8.2 - Loading and error states
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Send,
    ChevronDown,
    Calendar,
    AlertCircle,
    Copy,
    CheckCircle,
    Link as LinkIcon,
    Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LineItem, InvoiceInput, InvoiceStatus } from '../lib/database.types';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function InvoiceEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { clients, getInvoiceById, addInvoice, updateInvoice, duplicateInvoice, markInvoiceAsPaid, isLoading } = useApp();
    
    const existingInvoice = id ? getInvoiceById(id) : undefined;
    const isEditing = !!existingInvoice;

    const [selectedClientId, setSelectedClientId] = useState(existingInvoice?.clientId || '');
    const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
    const [issueDate, setIssueDate] = useState(existingInvoice?.issueDate || new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(existingInvoice?.dueDate || '');
    const [lineItems, setLineItems] = useState<LineItem[]>(
        existingInvoice?.lineItems || [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]
    );
    const [notes, setNotes] = useState(existingInvoice?.notes || '');
    const [taxRate] = useState(10);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    const canMarkAsPaid = existingInvoice && (existingInvoice.status === 'sent' || existingInvoice.status === 'overdue');

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const updateLineItem = (itemId: string, field: keyof LineItem, value: string | number) => {
        setLineItems((items) =>
            items.map((item) => {
                if (item.id !== itemId) return item;
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = Number(updated.quantity) * Number(updated.rate);
                }
                return updated;
            })
        );
    };

    const addLineItem = () => {
        setLineItems((items) => [...items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeLineItem = (itemId: string) => {
        if (lineItems.length > 1) setLineItems((items) => items.filter((item) => item.id !== itemId));
    };

    const buildInvoiceInput = (status: InvoiceStatus): InvoiceInput => ({
        clientId: selectedClientId,
        issueDate,
        dueDate,
        lineItems: lineItems.map(item => ({ description: item.description, quantity: item.quantity, rate: item.rate })),
        notes: notes || undefined,
        status,
    });

    const handleSave = async (status: InvoiceStatus) => {
        setIsSaving(true);
        setErrors({});

        const input = buildInvoiceInput(status);
        
        try {
            const result = isEditing && id 
                ? await updateInvoice(id, input)
                : await addInvoice(input);

            if (result.valid) {
                navigate('/invoices');
            } else {
                setErrors(result.errors);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDraft = () => handleSave('draft');
    const handleSendInvoice = () => handleSave('sent');

    const handleMarkAsPaid = async () => {
        if (id && canMarkAsPaid) {
            await markInvoiceAsPaid(id);
            navigate('/invoices');
        }
    };

    const handleDuplicate = async () => {
        if (id) {
            const newInvoice = await duplicateInvoice(id);
            if (newInvoice) navigate(`/invoices/${newInvoice.id}/edit`);
        }
    };

    const handleCopyLink = async () => {
        if (id) {
            const shareableUrl = `${window.location.origin}/invoice/${id}`;
            try {
                await navigator.clipboard.writeText(shareableUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-8">
            <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link to="/invoices" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                                {isEditing ? `Edit ${existingInvoice?.invoiceNumber}` : 'New Invoice'}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isEditing ? 'Update invoice details' : 'Create a new invoice'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleSaveDraft} disabled={isSaving}
                            className="hidden items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:flex">
                            <Save className="h-4 w-4" />{isSaving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button onClick={handleSendInvoice} disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600">
                            <Send className="h-4 w-4" />
                            <span className="hidden sm:inline">{isSaving ? 'Sending...' : 'Send Invoice'}</span>
                            <span className="sm:hidden">{isSaving ? '...' : 'Send'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    {isEditing && existingInvoice && (
                        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <span className="mr-2 text-sm font-medium text-slate-500 dark:text-slate-400">Actions:</span>
                            {canMarkAsPaid && (
                                <button onClick={handleMarkAsPaid} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                                    <CheckCircle className="h-4 w-4" />Mark as Paid
                                </button>
                            )}
                            <button onClick={handleDuplicate} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                                <Copy className="h-4 w-4" />Duplicate
                            </button>
                            <button onClick={handleCopyLink} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${linkCopied ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                                {linkCopied ? <><Check className="h-4 w-4" />Link Copied!</> : <><LinkIcon className="h-4 w-4" />Copy Link</>}
                            </button>
                        </div>
                    )}

                    {errors.general && (
                        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />{errors.general}
                        </div>
                    )}

                    <div className="mb-6 grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
                        <div className="sm:col-span-2 md:col-span-1">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Client *</label>
                            <div className="relative">
                                <button type="button" onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                                    className={`flex w-full items-center justify-between rounded-lg border ${errors.clientId ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-300 dark:border-slate-600'} bg-white px-3 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700`}>
                                    {selectedClient ? <span>{selectedClient.name}{selectedClient.company ? ` - ${selectedClient.company}` : ''}</span> : <span className="text-slate-400">Select a client</span>}
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                </button>
                                {clientDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setClientDropdownOpen(false)} />
                                        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                            {clients.length === 0 ? (
                                                <div className="px-3 py-2 text-sm text-slate-500">No clients. Add a client first.</div>
                                            ) : (
                                                clients.map((client) => (
                                                    <button key={client.id} type="button" onClick={() => { setSelectedClientId(client.id); setClientDropdownOpen(false); if (errors.clientId) setErrors(prev => { const { clientId: _, ...rest } = prev; return rest; }); }}
                                                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">{client.name.split(' ').map((n) => n[0]).join('')}</div>
                                                        <div><p className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{client.company}</p></div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            {errors.clientId && <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-4 w-4" />{errors.clientId}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Issue Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className={`mb-6 rounded-xl border ${errors.lineItems ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} bg-white shadow-sm dark:bg-slate-900`}>
                        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Line Items</h2>
                            {errors.lineItems && <p className="mt-1 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-4 w-4" />{errors.lineItems}</p>}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-24">Qty</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-32">Rate</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-32">Amount</th>
                                        <th className="w-12 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {lineItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-3"><input type="text" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} placeholder="Item description" className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-white" /></td>
                                            <td className="px-4 py-3"><input type="number" min="1" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono" /></td>
                                            <td className="px-4 py-3"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span><input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full rounded border border-slate-200 bg-slate-50 py-1 pl-6 pr-2 text-right text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono" /></div></td>
                                            <td className="px-4 py-3 text-right"><span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span></td>
                                            <td className="px-4 py-3"><button type="button" onClick={() => removeLineItem(item.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950" disabled={lineItems.length === 1}><Trash2 className="h-4 w-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                            {lineItems.map((item, index) => (
                                <div key={item.id} className="p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Item {index + 1}</span>
                                        <button type="button" onClick={() => removeLineItem(item.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950" disabled={lineItems.length === 1}><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                    <div className="mb-3"><input type="text" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} placeholder="Item description" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Qty</label><input type="number" min="1" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono" /></div>
                                        <div><label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Rate</label><input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono" /></div>
                                        <div><label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Amount</label><div className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-900 dark:bg-slate-700 dark:text-white font-mono">{formatCurrency(item.amount)}</div></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                            <button type="button" onClick={addLineItem} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"><Plus className="h-4 w-4" />Add Line Item</button>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any notes for your client..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Subtotal</span><span className="font-mono font-medium text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span></div>
                                <div className="flex items-center justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Tax ({taxRate}%)</span><span className="font-mono font-medium text-slate-900 dark:text-white">{formatCurrency(tax)}</span></div>
                                <div className="border-t border-slate-200 pt-3 dark:border-slate-700"><div className="flex items-center justify-between"><span className="text-base font-semibold text-slate-900 dark:text-white">Total</span><span className="font-mono text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(total)}</span></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
