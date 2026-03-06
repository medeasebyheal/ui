import Hero from '../components/Hero'
import WhyChoose from '../components/WhyChoose'
import About from '../components/About'
import CommunityFollow from '../components/CommunityFollow'
import Plan from '../components/Plan'
import Testimonial from '../components/Testimonial'

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-x-hidden">
      <div data-aos="fade-up"><Hero /></div>
      <div data-aos="fade-down"><WhyChoose /></div>
      <div data-aos="fade-up"><About /></div>
      <div data-aos="fade-down"><CommunityFollow /></div>
      <div data-aos="fade-up"><Plan /></div>
      <div data-aos="fade-down"><Testimonial /></div>
    </div>
  )
}

export default Home

