import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    FileText,
    Download,
    CreditCard,
    Check,
    X,
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ArrowLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadInvoicePDF } from '@backend/services/pdfService';

// Format currency
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Format date
const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(date)
    );

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        paid: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
        sent: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
        overdue: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800',
        draft: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    };

    return (
        <span
            className={`inline-flex items-center rounded-lg border px-3 py-1 text-sm font-medium capitalize ${styles[status as keyof typeof styles]
                }`}
        >
            {status === 'paid' && <Check className="mr-1.5 h-4 w-4" />}
            {status}
        </span>
    );
};

export default function ShareableInvoice() {
    const { id } = useParams();
    const { getInvoiceById, markInvoiceAsPaid } = useApp();
    const invoice = getInvoiceById(id || '');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Mock company info
    const companyInfo = {
        name: 'Invoicey',
        email: 'hello@invoicey.com',
        phone: '+1 (555) 000-1234',
        address: '100 Main Street, Suite 200, San Francisco, CA 94105',
    };

    // Handler for downloading PDF
    const handleDownloadPDF = async () => {
        if (!invoice || !invoice.client || isDownloading) return;
        setIsDownloading(true);
        try {
            // Type assertion is safe here because we've checked invoice.client exists above
            const invoiceWithClient = { ...invoice, client: invoice.client };
            await downloadInvoicePDF(invoiceWithClient);
        } catch (error) {
            console.error('Failed to download PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    // Handler for payment submission
    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mark invoice as paid in the context
        if (invoice) {
            markInvoiceAsPaid(invoice.id);
        }
        setPaymentSuccess(true);
    };

    if (!invoice) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans dark:bg-slate-950">
                <div className="text-center">
                    <FileText className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" />
                    <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                        Invoice not found
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        This invoice doesn't exist or has been removed.
                    </p>
                    <Link
                        to="/"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans dark:bg-slate-950">
            {/* Header Bar */}
            <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500">
                            <FileText className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">Invoicey</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="hidden items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:flex"
                        >
                            <Download className="h-4 w-4" />
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                        {invoice.status !== 'paid' && (
                            <button
                                onClick={() => setPaymentModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                <CreditCard className="h-4 w-4" />
                                Pay Now
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoice Content */}
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    {/* Invoice Header */}
                    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 sm:px-10">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            {/* Company Info */}
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {companyInfo.name}
                                    </h1>
                                </div>
                                <div className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {companyInfo.email}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {companyInfo.phone}
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                        {companyInfo.address}
                                    </p>
                                </div>
                            </div>

                            {/* Invoice Meta */}
                            <div className="text-left sm:text-right">
                                <h2 className="text-lg font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Invoice
                                </h2>
                                <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
                                    {invoice.invoiceNumber}
                                </p>
                                <div className="mt-4">
                                    <StatusBadge status={invoice.status} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Details */}
                    <div className="grid gap-6 border-b border-slate-200 px-6 py-6 dark:border-slate-800 sm:grid-cols-2 sm:px-10">
                        {/* Bill To */}
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Bill To
                            </h3>
                            <div className="mt-2">
                                {invoice.client ? (
                                    <>
                                        <p className="font-semibold text-slate-900 dark:text-white">{invoice.client.name}</p>
                                        {invoice.client.company && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                <Building2 className="mr-1.5 inline h-4 w-4" />
                                                {invoice.client.company}
                                            </p>
                                        )}
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            <Mail className="mr-1.5 inline h-4 w-4" />
                                            {invoice.client.email}
                                        </p>
                                        {invoice.client.address && (
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {invoice.client.address}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No client assigned</p>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-3 sm:text-right">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Issue Date
                                </span>
                                <p className="mt-1 flex items-center gap-1.5 text-slate-900 dark:text-white sm:justify-end">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {formatDate(invoice.issueDate)}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Due Date
                                </span>
                                <p className={`mt-1 flex items-center gap-1.5 sm:justify-end ${invoice.status === 'overdue' ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(invoice.dueDate)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="px-6 py-6 sm:px-10">
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Items
                        </h3>

                        {/* Desktop Table */}
                        <div className="hidden overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Rate
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {invoice.lineItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-4 text-slate-900 dark:text-white">{item.description}</td>
                                            <td className="px-4 py-4 text-center font-mono text-slate-600 dark:text-slate-400">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                                {formatCurrency(item.rate)}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-medium text-slate-900 dark:text-white">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700 md:hidden">
                            {invoice.lineItems.map((item) => (
                                <div key={item.id} className="p-4">
                                    <p className="font-medium text-slate-900 dark:text-white">{item.description}</p>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {item.quantity} × {formatCurrency(item.rate)}
                                        </span>
                                        <span className="font-mono font-medium text-slate-900 dark:text-white">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 flex justify-end">
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                                    <span className="font-mono text-slate-900 dark:text-white">
                                        {formatCurrency(invoice.subtotal)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Tax</span>
                                    <span className="font-mono text-slate-900 dark:text-white">
                                        {formatCurrency(invoice.tax)}
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                                        <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(invoice.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="border-t border-slate-200 bg-slate-50 px-6 py-6 dark:border-slate-800 dark:bg-slate-800/30 sm:px-10">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Notes
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-10">
                        Thank you for your business!
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => {
                            if (!paymentSuccess) setPaymentModalOpen(false);
                        }}
                    />
                    <div className="fixed inset-x-4 top-1/2 z-50 max-h-[85vh] -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2">
                        {paymentSuccess ? (
                            // Success State
                            <div className="p-8 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                                    <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                                    Payment Successful!
                                </h2>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">
                                    Thank you for your payment of {formatCurrency(invoice.total)}.
                                </p>
                                <button
                                    onClick={() => {
                                        setPaymentModalOpen(false);
                                        setPaymentSuccess(false);
                                    }}
                                    className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            // Payment Form
                            <>
                                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Pay Invoice
                                    </h2>
                                    <button
                                        onClick={() => setPaymentModalOpen(false)}
                                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">Amount Due</span>
                                            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(invoice.total)}
                                            </span>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePaymentSubmit}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Card Number
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="4242 4242 4242 4242"
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Expiry
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        CVC
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="123"
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Name on Card
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                        >
                                            Pay {formatCurrency(invoice.total)}
                                        </button>
                                    </form>

                                    <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                        This is a demo. No actual payment will be processed.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
