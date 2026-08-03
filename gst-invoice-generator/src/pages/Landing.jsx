import './Landing.css'
import Nav from '../components/landing/Nav'
import Hero from '../components/landing/Hero'
import Solutions from '../components/landing/Solutions'
import Features from '../components/landing/Features'
import Delivery from '../components/landing/Delivery'
import Reviews from '../components/landing/Reviews'
import Pricing from '../components/landing/Pricing'
import Faq from '../components/landing/Faq'
import Footer from '../components/landing/Footer'

/**
 * Marketing site. Sections are ordered as a narrative:
 * what it is -> who it's for -> what it does -> how it reaches the customer
 * -> proof -> price -> objections -> close.
 */
export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Nav />
      <main id="main">
        <Hero />
        <Solutions />
        <Features />
        <Delivery />
        <Reviews />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
