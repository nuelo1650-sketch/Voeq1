import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "Press — Voeq",
  description: "Media inquiries and press resources for Voeq.",
};

export default function PressPage() {
  return (
    <InfoPageShell title="Press">
      <div className="info-page-content">
        <section className="info-section">
          <p className="info-lead">
            Voeq is building the campus marketplace connecting students with 
            vendors across Nigerian universities. For media inquiries, interviews, 
            or press materials, reach out below.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">About Voeq</h2>
          <p>
            Voeq (pronounced "voke") is a free campus marketplace platform that 
            connects students with vendors serving their school. From food delivery 
            to fashion, tech repairs to tutoring services, Voeq makes it easy for 
            students to discover and connect with trusted campus vendors.
          </p>
          <p>
            Unlike traditional e-commerce platforms, Voeq doesn't process payments 
            or take commissions. We simply facilitate the connection — vendors list 
            for free, students discover for free, and transactions happen directly 
            between the two parties.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Key Facts</h2>
          <ul className="info-list">
            <li>Free listing for all campus vendors</li>
            <li>No transaction fees or commissions</li>
            <li>Multi-campus platform with campus-specific marketplaces</li>
            <li>Categories include Food, Fashion, Tech, Services, Health & Beauty, 
            and Stationery</li>
            <li>Direct connection model — students message vendors through Voeq's 
            in-app chat</li>
          </ul>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Press Kit</h2>
          <p>
            Brand assets, logos, screenshots, and founder information available 
            upon request. Contact us using the information below and specify what 
            materials you need.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Media Contact</h2>
          <p>
            For press inquiries, interviews, or partnership discussions:
          </p>
          <p>
            Email:{' '}
            <a href="mailto:press@voeq.ng" className="info-link">press@voeq.ng</a>
          </p>
          <p className="info-muted">
            We typically respond to media inquiries within 24 hours.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-heading">Recent Updates</h2>
          <div className="press-update">
            <h3 className="press-update-title">Voeq Launches Campus Marketplace</h3>
            <p className="press-update-date">August 2026</p>
            <p>
              Voeq officially launches its campus marketplace platform, starting 
              with select Nigerian universities. The platform aims to solve the 
              scattered nature of campus commerce by centralizing vendor discovery 
              in one place.
            </p>
          </div>
        </section>
      </div>
    </InfoPageShell>
  );
}
