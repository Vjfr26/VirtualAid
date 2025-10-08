import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './legalContent.module.css';

type PrivacySection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

export default function PrivacyContent() {
  const { t } = useTranslation('common');
  const sections = t('legal.privacy.sections', { returnObjects: true }) as PrivacySection[];

  return (
    <div className={styles.modalBody}>
      <h1 className={styles.sectionTitle}>{t('legal.privacy.title')}</h1>
      <p className={styles.highlight}>{t('legal.privacy.highlight')}</p>
      <div className={styles.contentCard}>
        {sections.map((section, sectionIndex) => (
          <Fragment key={`${section.title}-${sectionIndex}`}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <p key={`privacy-paragraph-${sectionIndex}-${paragraphIndex}`}>{paragraph}</p>
            ))}
            {section.list?.length ? (
              <ul className={styles.contentList}>
                {section.list.map((item, itemIndex) => (
                  <li key={`privacy-item-${sectionIndex}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
