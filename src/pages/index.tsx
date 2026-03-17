import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const sections = [
  {
    title: 'Regole',
    description:
      'Principi permanenti che governano il sistema: dominio, architettura, testing, git, logging, autenticazione, configurazione e versionamento.',
    to: '/docs/regole/dominio',
  },
  {
    title: 'Processi',
    description:
      'Come si lavora: dall\'analisi tecnica allo sviluppo, dalla pipeline CI/CD al ciclo di rilascio.',
    to: '/docs/processi/analisi-tecnica',
  },
];

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title}>
      <main>
        <div className={styles.heroBanner}>
          <div className="container">
            <Heading as="h1">{siteConfig.title}</Heading>
            <p className={styles.subtitle}>
              Regole, principi e processi che guidano lo sviluppo software del team.
              Una fonte di verità condivisa, versionata insieme al codice.
            </p>
            <Link className="button button--primary button--lg" to="/docs/">
              Vai alla documentazione
            </Link>
          </div>
        </div>

        <div className="container">
          <div className={styles.sections}>
            {sections.map(({title, description, to}) => (
              <Link key={title} to={to} className={styles.card}>
                <Heading as="h2">{title}</Heading>
                <p>{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
