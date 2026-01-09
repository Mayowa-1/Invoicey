// Types
export interface Client {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
    createdAt: string;
}

export interface LineItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    clientId: string;
    client: Client;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    issueDate: string;
    dueDate: string;
    lineItems: LineItem[];
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    createdAt: string;
}

// Mock Clients
export const clients: Client[] = [
    {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah@acmecorp.com',
        company: 'Acme Corporation',
        phone: '+1 (555) 123-4567',
        address: '123 Business Ave, San Francisco, CA 94102',
        createdAt: '2025-11-15',
    },
    {
        id: '2',
        name: 'Marcus Johnson',
        email: 'marcus@techstart.io',
        company: 'TechStart Inc',
        phone: '+1 (555) 234-5678',
        address: '456 Innovation Blvd, Austin, TX 78701',
        createdAt: '2025-11-20',
    },
    {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily@designstudio.co',
        company: 'Design Studio Co',
        phone: '+1 (555) 345-6789',
        address: '789 Creative Lane, New York, NY 10001',
        createdAt: '2025-12-01',
    },
    {
        id: '4',
        name: 'James Wilson',
        email: 'james@wilsonlaw.com',
        company: 'Wilson & Associates',
        phone: '+1 (555) 456-7890',
        address: '321 Legal Way, Chicago, IL 60601',
        createdAt: '2025-12-05',
    },
    {
        id: '5',
        name: 'Aisha Patel',
        email: 'aisha@greentech.org',
        company: 'GreenTech Solutions',
        phone: '+1 (555) 567-8901',
        address: '555 Eco Drive, Seattle, WA 98101',
        createdAt: '2025-12-10',
    },
    {
        id: '6',
        name: 'David Kim',
        email: 'david@cloudnine.dev',
        company: 'Cloud Nine Development',
        phone: '+1 (555) 678-9012',
        address: '888 Cloud Street, Denver, CO 80202',
        createdAt: '2025-12-15',
    },
    {
        id: '7',
        name: 'Lisa Brown',
        email: 'lisa@mediapro.agency',
        company: 'MediaPro Agency',
        phone: '+1 (555) 789-0123',
        address: '999 Media Plaza, Los Angeles, CA 90001',
        createdAt: '2025-12-20',
    },
    {
        id: '8',
        name: 'Robert Taylor',
        email: 'robert@financeplus.com',
        company: 'Finance Plus',
        phone: '+1 (555) 890-1234',
        address: '111 Money Lane, Miami, FL 33101',
        createdAt: '2025-12-25',
    },
];

// Helper to get client by ID
export const getClientById = (id: string): Client | undefined =>
    clients.find(c => c.id === id);

// Mock Invoices
export const invoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2025-001',
        clientId: '1',
        client: clients[0],
        status: 'paid',
        issueDate: '2025-12-01',
        dueDate: '2025-12-15',
        lineItems: [
            { id: '1', description: 'Web Development - Homepage', quantity: 1, rate: 2500, amount: 2500 },
            { id: '2', description: 'Web Development - About Page', quantity: 1, rate: 1500, amount: 1500 },
            { id: '3', description: 'SEO Optimization', quantity: 5, rate: 150, amount: 750 },
        ],
        subtotal: 4750,
        tax: 475,
        total: 5225,
        notes: 'Thank you for your business!',
        createdAt: '2025-12-01',
    },
    {
        id: '2',
        invoiceNumber: 'INV-2025-002',
        clientId: '2',
        client: clients[1],
        status: 'sent',
        issueDate: '2025-12-10',
        dueDate: '2025-12-24',
        lineItems: [
            { id: '1', description: 'Mobile App Development - Phase 1', quantity: 1, rate: 8000, amount: 8000 },
            { id: '2', description: 'UI/UX Design', quantity: 20, rate: 125, amount: 2500 },
        ],
        subtotal: 10500,
        tax: 1050,
        total: 11550,
        createdAt: '2025-12-10',
    },
    {
        id: '3',
        invoiceNumber: 'INV-2025-003',
        clientId: '3',
        client: clients[2],
        status: 'overdue',
        issueDate: '2025-11-15',
        dueDate: '2025-11-30',
        lineItems: [
            { id: '1', description: 'Brand Identity Package', quantity: 1, rate: 3500, amount: 3500 },
            { id: '2', description: 'Logo Design', quantity: 1, rate: 1200, amount: 1200 },
            { id: '3', description: 'Business Card Design', quantity: 1, rate: 300, amount: 300 },
        ],
        subtotal: 5000,
        tax: 500,
        total: 5500,
        notes: 'Payment overdue. Please remit payment as soon as possible.',
        createdAt: '2025-11-15',
    },
    {
        id: '4',
        invoiceNumber: 'INV-2025-004',
        clientId: '4',
        client: clients[3],
        status: 'draft',
        issueDate: '2025-12-28',
        dueDate: '2026-01-11',
        lineItems: [
            { id: '1', description: 'Legal Website Consultation', quantity: 4, rate: 200, amount: 800 },
            { id: '2', description: 'Content Writing', quantity: 10, rate: 75, amount: 750 },
        ],
        subtotal: 1550,
        tax: 155,
        total: 1705,
        createdAt: '2025-12-28',
    },
    {
        id: '5',
        invoiceNumber: 'INV-2025-005',
        clientId: '5',
        client: clients[4],
        status: 'paid',
        issueDate: '2025-12-05',
        dueDate: '2025-12-19',
        lineItems: [
            { id: '1', description: 'Environmental Dashboard Development', quantity: 1, rate: 6000, amount: 6000 },
            { id: '2', description: 'Data Visualization Components', quantity: 8, rate: 350, amount: 2800 },
            { id: '3', description: 'API Integration', quantity: 1, rate: 1500, amount: 1500 },
        ],
        subtotal: 10300,
        tax: 1030,
        total: 11330,
        notes: 'Thank you for choosing us for your sustainability project!',
        createdAt: '2025-12-05',
    },
    {
        id: '6',
        invoiceNumber: 'INV-2025-006',
        clientId: '6',
        client: clients[5],
        status: 'sent',
        issueDate: '2025-12-20',
        dueDate: '2026-01-03',
        lineItems: [
            { id: '1', description: 'Cloud Infrastructure Setup', quantity: 1, rate: 4500, amount: 4500 },
            { id: '2', description: 'DevOps Consulting', quantity: 10, rate: 175, amount: 1750 },
        ],
        subtotal: 6250,
        tax: 625,
        total: 6875,
        createdAt: '2025-12-20',
    },
    {
        id: '7',
        invoiceNumber: 'INV-2025-007',
        clientId: '7',
        client: clients[6],
        status: 'paid',
        issueDate: '2025-11-25',
        dueDate: '2025-12-09',
        lineItems: [
            { id: '1', description: 'Social Media Campaign', quantity: 1, rate: 2000, amount: 2000 },
            { id: '2', description: 'Video Production', quantity: 3, rate: 800, amount: 2400 },
            { id: '3', description: 'Photography Session', quantity: 2, rate: 450, amount: 900 },
        ],
        subtotal: 5300,
        tax: 530,
        total: 5830,
        createdAt: '2025-11-25',
    },
    {
        id: '8',
        invoiceNumber: 'INV-2025-008',
        clientId: '8',
        client: clients[7],
        status: 'draft',
        issueDate: '2026-01-05',
        dueDate: '2026-01-19',
        lineItems: [
            { id: '1', description: 'Financial Dashboard Development', quantity: 1, rate: 7500, amount: 7500 },
            { id: '2', description: 'Real-time Data Integration', quantity: 1, rate: 2500, amount: 2500 },
        ],
        subtotal: 10000,
        tax: 1000,
        total: 11000,
        createdAt: '2026-01-05',
    },
];

// Helper to get invoice by ID
export const getInvoiceById = (id: string): Invoice | undefined =>
    invoices.find(i => i.id === id);

// Metrics
export const metrics = {
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pendingAmount: invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0),
    overdueAmount: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0),
    totalClients: clients.length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    pendingInvoices: invoices.filter(i => i.status === 'sent').length,
    overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
    draftInvoices: invoices.filter(i => i.status === 'draft').length,
};
