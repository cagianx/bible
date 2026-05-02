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
  {
    title: 'Glossario',
    description:
      'Termini tecnici e di dominio usati nella documentazione e nel codice. Un linguaggio condiviso, senza sinonimi né traduzioni casuali.',
    to: '/docs/glossario',
  },
  {
    title: 'Indice analitico',
    description:
      'Punto di partenza per cercare concetti nella documentazione. Mappa ogni argomento alla pagina dove è trattato per esteso.',
    to: '/docs/indice-analitico',
  },
  {
    title: 'Uso con IA',
    description:
      'Come integrare questa guida in un progetto reale come knowledge base per agenti IA: sottomodulo git, riferimenti puntuali, glossario condiviso.',
    to: '/docs/uso-con-ia',
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
              Una posizione sullo sviluppo software. Regole, principi e processi
              per scrivere codice che si lascia leggere, modificare e mantenere
              nel tempo.
            </p>
            <p className={styles.subtitle}>
              Non verità universali: una prospettiva argomentata, più o meno
              condivisibile, indipendente da chi la legge.
            </p>
            <div className={styles.cta}>
              <Link className="button button--primary button--lg" to="/docs/">
                Vai alla documentazione
              </Link>
            </div>
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
