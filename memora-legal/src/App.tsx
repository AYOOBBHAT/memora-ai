import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AccountDeletionPage } from './pages/AccountDeletionPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/privacy" replace />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="account-deletion" element={<AccountDeletionPage />} />
        <Route path="*" element={<Navigate to="/privacy" replace />} />
      </Route>
    </Routes>
  );
}
