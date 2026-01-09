/**
 * Dashboard Page
 * 
 * Requirements: 8.1, 8.2 - Loading and error states
 */

import { Link } from 'react-router-dom';
import {
    DollarSign,
    Clock,
    AlertTriangle,
    Users,
    Plus,
    UserPlus,
    ArrowRight,
    TrendingUp,
    RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Format currency
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
        sent: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
        overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
        draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status as keyof typeof styles]
                }`}
        >
            {status}
        </span>
    );
};

// Loading spinner component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
    </div>
);

// Error display component
const ErrorDisplay = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Failed to load data
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {message}
                </p>
            </div>
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
                <RefreshCw className="h-4 w-4" />
                Try Again
            </button>
        </div>
    </div>
);

export default function Dashboard() {
    const { clients, invoices, metrics, isLoading, error, refreshData, clearError } = useApp();
    
    // Get recent items sorted by createdAt descending
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    const recentClients = [...clients]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);

    // Handle retry
    const handleRetry = async () => {
        clearError();
        await refreshData();
    };

    // Show loading state (Requirement 8.1)
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Show error state (Requirement 8.2)
    if (error) {
        return <ErrorDisplay message={error} onRetry={handleRetry} />;
    }

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Welcome back! Here's what's happening with your invoices.
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Revenue */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                {formatCurrency(metrics.totalRevenue)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{metrics.paidInvoices} paid invoices</span>
                    </div>
                </div>

                {/* Pending */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                {formatCurrency(metrics.pendingAmount)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {metrics.pendingInvoices} invoices awaiting payment
                    </div>
                </div>

                {/* Overdue */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                {formatCurrency(metrics.overdueAmount)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-rose-600 dark:text-rose-400">
                        {metrics.overdueInvoices} overdue invoices
                    </div>
                </div>

                {/* Total Clients */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Clients</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                                {metrics.totalClients}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Active client accounts
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8 flex flex-wrap gap-3">
                <Link
                    to="/invoices/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </Link>
                <Link
                    to="/clients"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Client
                </Link>
            </div>

            {/* Recent Items Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Invoices */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Invoices</h2>
                        <Link
                            to="/invoices"
                            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            View all
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentInvoices.length === 0 ? (
                            <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                No invoices yet. Create your first invoice to get started.
                            </div>
                        ) : (
                            recentInvoices.map((invoice) => (
                                <Link
                                    key={invoice.id}
                                    to={`/invoices/${invoice.id}/edit`}
                                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-slate-900 dark:text-white font-mono text-sm">
                                            {invoice.invoiceNumber}
                                        </p>
                                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                            {invoice.client?.name || 'Unknown Client'}
                                        </p>
                                    </div>
                                    <div className="ml-4 flex flex-col items-end gap-1">
                                        <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                                            {formatCurrency(invoice.total)}
                                        </span>
                                        <StatusBadge status={invoice.status} />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Clients */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Clients</h2>
                        <Link
                            to="/clients"
                            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            View all
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentClients.length === 0 ? (
                            <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                No clients yet. Add your first client to get started.
                            </div>
                        ) : (
                            recentClients.map((client) => (
                                <div
                                    key={client.id}
                                    className="flex items-center gap-4 px-6 py-4"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                                        {client.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-slate-900 dark:text-white">
                                            {client.name}
                                        </p>
                                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                            {client.company || client.email}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
