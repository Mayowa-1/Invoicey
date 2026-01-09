/**
 * Invoices Page
 * 
 * Requirements: 8.1, 8.2 - Loading and error states
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    ChevronDown,
    ExternalLink,
    Pencil,
    FileText,
    Calendar,
    Trash2,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Invoice, InvoiceStatus } from '../lib/database.types';

type StatusFilter = 'all' | InvoiceStatus;

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
        sent: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
        overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
        draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status as keyof typeof styles]}`}>{status}</span>;
};

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading invoices...</p>
        </div>
    </div>
);

const ErrorDisplay = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Failed to load invoices</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
            </div>
            <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                <RefreshCw className="h-4 w-4" />Try Again
            </button>
        </div>
    </div>
);

export default function Invoices() {
    const { invoices, deleteInvoice, isLoading, error, refreshData, clearError } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<Invoice | null>(null);

    // Filter invoices
    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = !searchQuery || 
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        all: invoices.length,
        draft: invoices.filter((i) => i.status === 'draft').length,
        sent: invoices.filter((i) => i.status === 'sent').length,
        paid: invoices.filter((i) => i.status === 'paid').length,
        overdue: invoices.filter((i) => i.status === 'overdue').length,
    };

    const handleDeleteClick = (invoice: Invoice) => setDeleteConfirmInvoice(invoice);
    const confirmDelete = async () => {
        if (deleteConfirmInvoice) {
            await deleteInvoice(deleteConfirmInvoice.id);
            setDeleteConfirmInvoice(null);
        }
    };
    const cancelDelete = () => setDeleteConfirmInvoice(null);
    const handleRetry = async () => { clearError(); await refreshData(); };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={error} onRetry={handleRetry} />;

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Invoices</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create and manage your invoices.</p>
                </div>
                <Link to="/invoices/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                    <Plus className="h-4 w-4" />Create Invoice
                </Link>
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400" />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:hidden">
                    <Filter className="h-4 w-4" />Filter<ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <div className={`mb-6 flex flex-wrap gap-2 ${showFilters ? 'block' : 'hidden'} sm:flex`}>
                {(['all', 'draft', 'sent', 'paid', 'overdue'] as StatusFilter[]).map((status) => (
                    <button key={status} onClick={() => setStatusFilter(status)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${statusFilter === status ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                        <span className="capitalize">{status}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-xs ${statusFilter === status ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>{statusCounts[status]}</span>
                    </button>
                ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoice</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Due Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="whitespace-nowrap px-6 py-4"><span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{invoice.invoiceNumber}</span></td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{invoice.client?.name || 'Unknown'}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.client?.company}</p>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={invoice.status} /></td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.dueDate)}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right"><span className="font-mono text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(invoice.total)}</span></td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/invoices/${invoice.id}/edit`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" title="Edit"><Pencil className="h-4 w-4" /></Link>
                                            <Link to={`/invoice/${invoice.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" title="View"><ExternalLink className="h-4 w-4" /></Link>
                                            <button onClick={() => handleDeleteClick(invoice)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                    {filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="p-4">
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{invoice.client?.name || 'Unknown'}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.client?.company}</p>
                                </div>
                                <StatusBadge status={invoice.status} />
                            </div>
                            <div className="mb-3 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(invoice.dueDate)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.total)}</span>
                                <div className="flex items-center gap-2">
                                    <Link to={`/invoices/${invoice.id}/edit`} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"><Pencil className="h-4 w-4" /></Link>
                                    <Link to={`/invoice/${invoice.id}`} className="rounded-lg bg-indigo-100 p-2 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900"><ExternalLink className="h-4 w-4" /></Link>
                                    <button onClick={() => handleDeleteClick(invoice)} className="rounded-lg bg-rose-100 p-2 text-rose-600 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                        <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No invoices found</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first invoice to get started'}</p>
                    </div>
                )}
            </div>

            {deleteConfirmInvoice && (
                <>
                    <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={cancelDelete} />
                    <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:left-1/2 sm:right-auto sm:max-w-md sm:-translate-x-1/2">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30"><Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" /></div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Invoice</h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete invoice <span className="font-mono font-medium">{deleteConfirmInvoice.invoiceNumber}</span> for <span className="font-medium">{deleteConfirmInvoice.client?.name || 'Unknown'}</span>? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={cancelDelete} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                            <button type="button" onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600">Delete</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
