import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title}>
      <main className={styles.heroBanner}>
        <div className="container">
          <Heading as="h1">{siteConfig.title}</Heading>
          <Link className="button button--primary button--lg" to="/docs/">
            Vai alla documentazione
          </Link>
        </div>
      </main>
    </Layout>
  );
}
