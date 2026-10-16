import { Link } from 'react-router'
import Navigation from './Navigation'
import PageContainer from './PageContainer'

export default function Header() {
  return (
    <header className="site-header">
      <PageContainer className="header-content">
        <Link className="brand" to="/" aria-label="Math Practice home">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <span>Math Practice</span>
        </Link>
        <Navigation />
      </PageContainer>
    </header>
  )
}
