import { useEffect } from 'react';

import styles from '../components/LegalDocument.module.css';

const DELETION_EMAIL = 'ayoob324005@gmail.com';
const DELETION_SUBJECT = 'Account Deletion Request';
const DELETION_MAILTO = `mailto:${DELETION_EMAIL}?subject=${encodeURIComponent(DELETION_SUBJECT)}`;

const DELETED_ITEMS = [
  'Account',
  'Profile information',
  'Documents and notes',
  'Collections',
  'AI chat history',
  'Uploaded files associated with the account',
];

export function AccountDeletionPage() {
  useEffect(() => {
    document.title = 'Account Deletion Request — Memora AI';

    const description =
      'Request deletion of your Memora AI account and associated data. Email instructions for Google Play account deletion compliance.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, []);

  return (
    <article className={styles.article} aria-labelledby="account-deletion-title">
      <header className={styles.header}>
        <h1 id="account-deletion-title" className={styles.title}>
          Account Deletion Request
        </h1>
        <p className={styles.meta}>
          Request permanent deletion of your Memora AI account and associated data.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="how-to-request">
        <h2 id="how-to-request" className={styles.sectionTitle}>
          How to Request Deletion
        </h2>
        <p className={styles.paragraph}>
          Users can request deletion of their Memora AI account by emailing:{' '}
          <a href={DELETION_MAILTO}>
            <strong>{DELETION_EMAIL}</strong>
          </a>
        </p>
        <p className={styles.paragraph}>
          Subject: <strong>{DELETION_SUBJECT}</strong>
        </p>
        <p className={styles.paragraph}>
          Please include the email address associated with your Memora AI account so we can verify
          your identity and locate your data.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="what-is-deleted">
        <h2 id="what-is-deleted" className={styles.sectionTitle}>
          What Will Be Deleted
        </h2>
        <p className={styles.paragraph}>
          After verification, the following will be permanently deleted:
        </p>
        <ul className={styles.list}>
          {DELETED_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="retention">
        <h2 id="retention" className={styles.sectionTitle}>
          Data Retention
        </h2>
        <p className={styles.paragraph}>
          Some information may be retained if required by law or to resolve disputes, enforce our
          agreements, or protect the security and integrity of Memora AI.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="processing-time">
        <h2 id="processing-time" className={styles.sectionTitle}>
          Processing Time
        </h2>
        <p className={styles.paragraph}>
          Deletion requests are normally processed within <strong>7 business days</strong> after we
          confirm your identity and account ownership.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="contact">
        <h2 id="contact" className={styles.sectionTitle}>
          Contact
        </h2>
        <p className={styles.paragraph}>
          For account deletion requests, email{' '}
          <a href={DELETION_MAILTO}>
            <strong>{DELETION_EMAIL}</strong>
          </a>{' '}
          with the subject line <strong>{DELETION_SUBJECT}</strong>.
        </p>
      </section>
    </article>
  );
}
