import {
  ArrowRight,
  Bot,
  Code2,
  Database,
  Globe2,
  Mail,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Smartphone,
  Workflow,
  Zap,
} from "lucide-react";

const services = [
  {
    icon: Bot,
    title: "AI automatizacija",
    text: "AI asistent za upite klijenata, kvalifikaciju leadova, slanje odgovora i unos u CRM ili Google Sheets.",
  },
  {
    icon: Globe2,
    title: "Vercel landing stranice",
    text: "Brzi moderni sajtovi za firme, servise, agencije, knjige, aplikacije i lokalne usluge.",
  },
  {
    icon: Workflow,
    title: "Workflow sistemi",
    text: "Povezivanje forme, emaila, WhatsApp-a, tabela, notifikacija i jednostavne administracije.",
  },
  {
    icon: Smartphone,
    title: "Web i mobilne aplikacije",
    text: "Prototipovi i MVP aplikacije za realne poslovne procese, prijave, rezervacije i interne evidencije.",
  },
];

const projects = [
  {
    title: "AI sistem za male firme",
    tag: "AI + CRM",
    text: "Chat forma koja prima upite, beleži podatke, obaveštava vlasnika i priprema odgovor klijentu.",
  },
  {
    title: "ReffGuard",
    tag: "Sports admin",
    text: "Aplikacija za objavu utakmica, prijavu sudija i pregled delegiranja kroz jednostavan admin panel.",
  },
  {
    title: "ShiftGuard Pro",
    tag: "SaaS",
    text: "Sistem za smene, prisustvo, rizike rada i mesečnu evidenciju za firme sa radnicima.",
  },
  {
    title: "RailGuard",
    tag: "Safety app",
    text: "Koncept aplikacije za upozorenje kod pružnih prelaza i bolju bezbednost u saobraćaju.",
  },
];

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Supabase",
  "Vercel",
  "Stripe",
  "Google Sheets",
  "Apps Script",
  "OpenAI API",
  "n8n",
  "GitHub",
  "Tailwind-style CSS",
];

const steps = [
  "Kratka analiza problema",
  "Predlog jednostavnog rešenja",
  "Izrada prve verzije",
  "Testiranje na telefonu i računaru",
  "Deploy na Vercel",
  "Dalje povezivanje sa AI/CRM sistemom",
];

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <a href="#" className="logo">
          <span>MD</span>
          Marjan.Dev
        </a>

        <div className="navLinks">
          <a href="#services">Usluge</a>
          <a href="#projects">Projekti</a>
          <a href="#process">Proces</a>
          <a href="#contact">Kontakt</a>
        </div>
      </nav>

      <section className="hero">
        <div className="heroText">
          <div className="eyebrow">
            <Zap size={16} />
            AI automatizacija · web aplikacije · Vercel sajtovi
          </div>

          <h1>
            Moderni sajtovi i AI sistemi za firme koje žele više klijenata.
          </h1>

          <p>
            Pravim brze, pregledne i funkcionalne web stranice, interne alate i
            AI workflow sisteme koji pomažu firmama da ne gube upite, termine i
            potencijalne kupce.
          </p>

          <div className="heroActions">
            <a className="primaryBtn" href="#contact">
              Zatraži ponudu <ArrowRight size={18} />
            </a>
            <a className="secondaryBtn" href="#projects">
              Pogledaj projekte
            </a>
          </div>

          <div className="stats">
            <div>
              <strong>24/7</strong>
              <span>AI prijem upita</span>
            </div>
            <div>
              <strong>3 jezika</strong>
              <span>SR · CS · EN</span>
            </div>
            <div>
              <strong>Vercel</strong>
              <span>brz deploy</span>
            </div>
          </div>
        </div>

        <div className="heroCard">
          <div className="cardTop">
            <div className="dots">
              <span />
              <span />
              <span />
            </div>
            <span>live-preview.tsx</span>
          </div>

          <div className="terminal">
            <p><span>$</span> create modern-business-site</p>
            <p><span>✓</span> responsive layout</p>
            <p><span>✓</span> contact workflow</p>
            <p><span>✓</span> AI lead capture</p>
            <p><span>✓</span> deploy ready</p>
          </div>

          <div className="floatingBadge one">
            <Bot size={18} /> AI assistant
          </div>
          <div className="floatingBadge two">
            <ShieldCheck size={18} /> business ready
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="sectionHead">
          <span>Šta mogu da napravim</span>
          <h2>Od običnog sajta do automatizovanog sistema za klijente.</h2>
        </div>

        <div className="grid servicesGrid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article className="serviceCard" key={service.title}>
                <div className="iconBox">
                  <Icon size={24} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section split">
        <div>
          <span className="miniTitle">Zašto ovakav sajt?</span>
          <h2>Izgleda profesionalno, brzo se učitava i odmah objašnjava vrednost.</h2>
        </div>

        <div className="featureList">
          <div>
            <Code2 size={22} />
            <p>Čist kod spreman za GitHub i Vercel.</p>
          </div>
          <div>
            <Rocket size={22} />
            <p>Landing struktura koja vodi posetioca ka kontaktu.</p>
          </div>
          <div>
            <Database size={22} />
            <p>Lako se kasnije povezuje sa formom, CRM-om ili bazom.</p>
          </div>
        </div>
      </section>

      <section className="section" id="projects">
        <div className="sectionHead">
          <span>Primeri projekata</span>
          <h2>Portfolio blok za prikaz realnih rešenja.</h2>
        </div>

        <div className="grid projectGrid">
          {projects.map((project) => (
            <article className="projectCard" key={project.title}>
              <span>{project.tag}</span>
              <h3>{project.title}</h3>
              <p>{project.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="process">
        <div className="sectionHead">
          <span>Proces rada</span>
          <h2>Jednostavno, bez komplikovanog IT jezika.</h2>
        </div>

        <div className="steps">
          {steps.map((step, index) => (
            <div className="step" key={step}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="stackBox">
          <div>
            <span className="miniTitle">Tehnologije</span>
            <h2>Stack za moderne male i srednje projekte.</h2>
          </div>

          <div className="stack">
            {stack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="cta" id="contact">
        <div>
          <span>Kontakt</span>
          <h2>Imaš firmu, uslugu ili aplikaciju koju treba predstaviti?</h2>
          <p>
            Pošalji kratak opis problema. Mogu da napravim landing stranu,
            formular, AI odgovor klijentu i osnovni CRM tok.
          </p>
        </div>

        <div className="contactActions">
          <a href="mailto:marjan.posao@gmail.com" className="primaryBtn">
            <Mail size={18} /> Pošalji email
          </a>
          <a href="https://wa.me/" className="secondaryBtn">
            <MessageCircle size={18} /> WhatsApp
          </a>
        </div>
      </section>

      <footer>
        <p>© {new Date().getFullYear()} Marjan.Dev. Built for Vercel.</p>
        <a href="mailto:marjan.posao@gmail.com">marjan.posao@gmail.com</a>
      </footer>
    </main>
  );
}
