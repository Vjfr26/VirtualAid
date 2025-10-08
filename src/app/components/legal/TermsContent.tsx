import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './legalContent.module.css';

type TermsSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

export default function TermsContent() {
  const { t } = useTranslation('common');
  const sections = t('legal.terms.sections', { returnObjects: true }) as TermsSection[];

  return (
    <div className={styles.modalBody}>
  <h1 className={styles.sectionTitle}>{t('legal.terms.title')}</h1>
  <p className={styles.highlight}>{t('legal.terms.highlight')}</p>
      <div className={styles.contentCard}>
        {sections.map((section, sectionIndex) => (
          <Fragment key={`${section.title}-${sectionIndex}`}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <p key={`terms-paragraph-${sectionIndex}-${paragraphIndex}`}>{paragraph}</p>
            ))}
            {section.list?.length ? (
              <ul className={styles.contentList}>
                {section.list.map((item, itemIndex) => (
                  <li key={`terms-item-${sectionIndex}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
