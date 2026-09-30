import { FiAlertTriangle } from 'react-icons/fi';

/**
 * 🛡️ [FIX] This page previously simulated a full cash-application workflow
 * (fake receipt, fake invoices, a client-side setTimeout state machine for
 * "Confirm & Post") with zero backend call anywhere in the file - an admin
 * clicking through it would believe they'd applied real cash to real
 * invoices.
 *
 * Traced the real backend domain this page is meant to front
 * (src/modules/erp/finance/ar/* and api/cash-application-query.service.ts
 * in the main repo): the AR/cash-application engine is fully built and
 * covered by extensive chaos/integrity tests, but nothing anywhere in the
 * live order/payment flow ever creates an ArOpenItem, CustomerInvoice, or
 * CashReceipt record - there is no write path connecting real orders to
 * this domain at all, and no customer-list endpoint exists to even
 * discover a valid customerId to query (the query service's own
 * displayName field is a hardcoded literal with a comment admitting
 * "Mock display name"). Wiring the real read-only query endpoints here
 * would produce a page that can never show anything, which isn't
 * meaningfully more useful than the fake demo it would replace.
 *
 * This page has no nav entry (route-only, unreachable by normal
 * navigation) so it isn't actively misleading anyone today the way
 * SupportWorkspace was. Left as an honest status page rather than a fake
 * interactive one - connecting real orders to the AR engine is a larger,
 * separate decision, not an admin-page wiring task.
 */
export function CashApplicationWorkbench() {
  return (
    <div className="w-full max-w-4xl mx-auto shadow-lg border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-800">Cash Application Workbench</h2>
      </div>

      <div className="p-8 text-center space-y-4">
        <FiAlertTriangle className="text-amber-500 mx-auto" size={32} />
        <h3 className="font-semibold text-slate-800 text-lg">Not Yet Connected</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          The AR (Accounts Receivable) and cash-application engine this page is meant to front exists in the
          backend and is thoroughly tested, but nothing in the live order/payment flow currently creates the
          records it needs (open items, invoices, receipts). There is nothing real to apply cash to yet.
        </p>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Connecting real orders to this engine is a larger platform decision, not something this page can
          resolve on its own.
        </p>
      </div>
    </div>
  );
}

export default CashApplicationWorkbench;
