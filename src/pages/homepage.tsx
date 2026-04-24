import BugBountySection from "../components/homepage/bugbounty";
import ContestSection from "../components/homepage/contests";
import HackathonSection from "../components/homepage/hackathons";
import HeaderComponent from "../components/homepage/header";
import LandingComponent from "../components/homepage/landingComponent";
import PlatformCoveredMarquee from "../components/homepage/platforms";
import ContestStats from "../components/homepage/stats";

export default function Homepage() {
  return (
    <>
    <HeaderComponent/>
    <LandingComponent/>
    <ContestSection/>
    <PlatformCoveredMarquee/>
    <HackathonSection/>
    <ContestStats/>
    <BugBountySection/>
    </>
  )
}