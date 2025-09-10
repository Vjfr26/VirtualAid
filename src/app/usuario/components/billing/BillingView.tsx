import React from 'react';
import BillingHeader from './BillingHeader';
import BillingProfileSection from './BillingProfileSection';
import AddressSection from './AddressSection';
import PaymentMethodsSection from './PaymentMethodsSection';
import InvoicesSection from './InvoicesSection';
import CouponSection from './CouponSection';

interface BillingProfile {
  id: number;
  legal_name?: string | null;
  tax_id?: string | null;
}

interface BillingAddress {
  id?: number;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  is_billing?: boolean;
}

interface PaymentMethod {
  id: number;
  provider: string;
  brand?: string | null;
  last4?: string | null;
  exp_month?: number | null;
  exp_year?: number | null;
  token?: string | null;
  is_default: boolean;
  status?: string;
  billing_profile_id: number;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at?: string;
}

interface BillingViewProps {
  billingProfiles: BillingProfile[];
  currentProfile: BillingProfile | null;
  billingAddress: BillingAddress;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  loadingProfiles: boolean;
  loadingPaymentMethods: boolean;
  loadingInvoices: boolean;
  showCreateProfile: boolean;
  showEditProfile: boolean;
  showAddPayment: boolean;
  editingPayment: PaymentMethod | null;
  newProfile: { legal_name: string; tax_id: string };
  newPaymentMethod: {
    type: string;
    provider: string;
    holder_name: string;
    email: string;
  };
  setShowCreateProfile: (show: boolean) => void;
  setShowEditProfile: (show: boolean) => void;
  setShowAddPayment: (show: boolean) => void;
  setEditingPayment: (payment: PaymentMethod | null) => void;
  setNewProfile: (profile: { legal_name: string; tax_id: string }) => void;
  setNewPaymentMethod: (method: {
    type: string;
    provider: string;
    holder_name: string;
    email: string;
  }) => void;
  setBillingAddress: (address: BillingAddress) => void;
  handleCreateProfile: () => void;
  handleEditProfile: () => void;
  handleSaveAddress: () => void;
  handleAddPaymentMethod: () => void;
  handleEditPaymentMethod: () => void;
  handleDeletePaymentMethod: (id: number) => void;
  handleSetDefaultPayment: (id: number) => void;
}

const BillingView: React.FC<BillingViewProps> = ({
  billingProfiles,
  currentProfile,
  billingAddress,
  paymentMethods,
  invoices,
  loadingProfiles,
  loadingPaymentMethods,
  loadingInvoices,
  showCreateProfile,
  showEditProfile,
  showAddPayment,
  editingPayment,
  newProfile,
  newPaymentMethod,
  setShowCreateProfile,
  setShowEditProfile,
  setShowAddPayment,
  setEditingPayment,
  setNewProfile,
  setNewPaymentMethod,
  setBillingAddress,
  handleCreateProfile,
  handleEditProfile,
  handleSaveAddress,
  handleAddPaymentMethod,
  handleEditPaymentMethod,
  handleDeletePaymentMethod,
  handleSetDefaultPayment,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <BillingHeader />
      
      {loadingProfiles ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 h-12 w-12 mb-2"></div>
          <p className="text-blue-600">Cargando facturación...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BillingProfileSection
            billingProfiles={billingProfiles}
            currentProfile={currentProfile}
            loadingProfiles={loadingProfiles}
            showCreateProfile={showCreateProfile}
            showEditProfile={showEditProfile}
            newProfile={newProfile}
            setShowCreateProfile={setShowCreateProfile}
            setShowEditProfile={setShowEditProfile}
            setNewProfile={setNewProfile}
            handleCreateProfile={handleCreateProfile}
            handleEditProfile={handleEditProfile}
          />

          <PaymentMethodsSection
            paymentMethods={paymentMethods}
            loadingPaymentMethods={loadingPaymentMethods}
            showAddPayment={showAddPayment}
            editingPayment={editingPayment}
            newPaymentMethod={newPaymentMethod}
            setShowAddPayment={setShowAddPayment}
            setEditingPayment={setEditingPayment}
            setNewPaymentMethod={setNewPaymentMethod}
            handleAddPaymentMethod={handleAddPaymentMethod}
            handleEditPaymentMethod={handleEditPaymentMethod}
            handleDeletePaymentMethod={handleDeletePaymentMethod}
            handleSetDefaultPayment={handleSetDefaultPayment}
          />

          <div className="lg:col-span-2">
            <AddressSection
              billingAddress={billingAddress}
              setBillingAddress={setBillingAddress}
              handleSaveAddress={handleSaveAddress}
            />
          </div>

          <div className="lg:col-span-2">
            <InvoicesSection
              invoices={invoices}
              loadingInvoices={loadingInvoices}
            />
          </div>

          <CouponSection />
        </div>
      )}
    </div>
  );
};

export default BillingView;
