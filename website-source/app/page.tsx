import profile from '@/data/profile.json';
import scholar from '@/data/scholar.json';
import ResearchMap from '@/components/research-map';
import PublicationFigure from '@/components/publication-figure';

const metricsDate = new Date(
  scholar.asOf + (scholar.asOf.length === 7 ? '-01' : '') + 'T00:00:00Z',
).toLocaleDateString('en-GB', {
  day: scholar.lastSuccessfulSync ? 'numeric' : undefined,
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const nav = [
  ['research-map', 'Research atlas'],
  ['publications', 'Publications'],
  ['research', 'About'],
  ['experience', 'Background'],
];
const pubs = [...profile.publications].sort(
  (a, b) =>
    Number(b.kind.match(/20\d{2}/)?.[0] || 0) -
    Number(a.kind.match(/20\d{2}/)?.[0] || 0),
);
function Paper({ paper }: { paper: (typeof pubs)[number] }) {
  return (
    <article className="paper" id={paper.id}>
      <div className="paper-aside">
        <div className="paper-meta">{paper.kind.replace(/\[.*?\] · /, '')}</div>
        <PublicationFigure
          publicationId={paper.id.replace(/^full-/, '')}
          title={paper.title}
        />
      </div>
      <div>
        <h3>
          {paper.url ? (
            <a href={paper.url}>
              {paper.title.replace('✦', '')} <span aria-hidden="true">↗</span>
            </a>
          ) : (
            paper.title.replace('✦', '')
          )}
        </h3>
        <p className="authors">
          {paper.authors
            .split(/(Zhang, H\.)/g)
            .map((part, i) =>
              part === 'Zhang, H.' ? <strong key={i}>{part}</strong> : part,
            )}
        </p>
        <p className="venue">{paper.venue}</p>
        {paper.venue.includes('Honorable Mention') && (
          <span className="paper-award">Best Paper Honorable Mention</span>
        )}
        <p className="paper-note">{paper.note}</p>
        <div className="tags">
          {paper.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="nav">
        <a href="#" className="wordmark" aria-label="He Albert Zhang home">
          HZ<span> / </span>Research
        </a>
        <nav aria-label="Main navigation">
          {nav.map(([id, label]) => (
            <a href={'#' + id} key={id}>
              {label}
            </a>
          ))}
        </nav>
        <a className="contact" href={'mailto:' + profile.links.email}>
          Get in touch <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="name">
          <div className="hero-top">
            <span className="eyebrow">
              Human–computer interaction · Penn State
            </span>
            <span className="location">University Park, PA</span>
          </div>
          <div className="hero-grid">
            <div>
              <h1 id="name">
                He <span>“Albert”</span> Zhang
              </h1>
              <p className="role">
                Ph.D. candidate in Informatics
                <br />
                College of Information Sciences and Technology
              </p>
              <p className="availability">Available December 2026</p>
              <div className="hero-links">
                <a href={'mailto:' + profile.links.email}>Email ↗</a>
                <a href={profile.links.github}>GitHub ↗</a>
                {profile.links.scholar && (
                  <a href={profile.links.scholar}>Google Scholar ↗</a>
                )}
                {profile.links.linkedin && (
                  <a href={profile.links.linkedin}>LinkedIn ↗</a>
                )}
              </div>
            </div>
            <div className="hero-portrait">
              <img
                src="/he-zhang-portrait-nyc.jpeg"
                alt="He Albert Zhang at the NYC installation"
                width={3296}
                height={3296}
                fetchPriority="high"
              />
            </div>
          </div>
          <div className="metrics">
            <div>
              <strong>
                {scholar.citations.toLocaleString('en-US')}
                {scholar.approximate ? '+' : ''}
              </strong>
              <span>Citations</span>
            </div>
            <div>
              <strong>{scholar.hIndex}</strong>
              <span>h-index</span>
            </div>
            {scholar.i10Index !== null && (
              <div>
                <strong>{scholar.i10Index}</strong>
                <span>i10-index</span>
              </div>
            )}
            <div>
              <strong>30+</strong>
              <span>Peer-reviewed papers</span>
            </div>
            <p>
              <a href={profile.links.scholar}>Google Scholar ↗</a>
              <br />
              <time dateTime={scholar.lastSuccessfulSync || scholar.asOf}>
                {metricsDate} UTC
              </time>
              <br />
              Checked monthly
            </p>
          </div>
        </section>
        <ResearchMap />
        <section className="section about" id="research">
          <div className="section-label">
            <span>02 / About</span>
            <h2>
              Building systems.
              <br />
              Understanding people.
            </h2>
          </div>
          <div className="about-body">
            <p className="lead">
              I study what happens when AI systems become the interpreters of
              intimate human data.
            </p>
            <p>
              I am a Ph.D. candidate at Penn State, advised by Distinguished
              Prof. John M. Carroll, and a student member of the Center for
              Socially Responsible Artificial Intelligence.
            </p>
            <p>
              My dissertation,{' '}
              <em>
                Integrating Large Language Models into the Qualitative Research
                Process
              </em>
              , examines how scholars work with models when confidential
              participant data is involved.
            </p>
            <div className="research-arcs">
              <div>
                <span>01</span>
                <h3>Build</h3>
                <p>Tools, datasets, testbeds, and defences.</p>
              </div>
              <div>
                <span>02</span>
                <h3>Understand</h3>
                <p>Evidence of how people actually use AI.</p>
              </div>
              <div>
                <span>03</span>
                <h3>Question</h3>
                <p>Consequences for trust, ethics, and institutions.</p>
              </div>
            </div>
            <details className="bio">
              <summary>
                Background & collaborations <span>+</span>
              </summary>
              {profile.about
                .filter(
                  (p) =>
                    p.startsWith('My dissertation') ||
                    p.startsWith('Before Penn'),
                )
                .map((p) => (
                  <p key={p}>{p}</p>
                ))}
            </details>
          </div>
        </section>

        <section className="topics section">
          <div className="section-label">
            <span>Research themes</span>
            <h2>
              Six connected
              <br />
              lines of inquiry.
            </h2>
          </div>
          <div className="topic-grid">
            {profile.topics.map((t, i) => (
              <details className="topic" key={t.title}>
                <summary>
                  <span className="topic-number">0{i + 1}</span>
                  <h3>{t.title}</h3>
                  <span className="topic-toggle" aria-hidden="true">
                    ↗
                  </span>
                </summary>
                <p>{t.description}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="section publication-section" id="publications">
          <div className="section-heading">
            <div>
              <span className="section-kicker">03 / Publications</span>
              <h2>Selected work</h2>
            </div>
            <a className="text-link" href="#all-publications">
              All {pubs.length} works ↓
            </a>
          </div>
          <div>
            {pubs
              .filter((p) => p.selected)
              .map((p) => (
                <Paper key={p.id} paper={p} />
              ))}
          </div>
          <details id="all-publications" className="all-publications">
            <summary>
              Browse the complete publication list{' '}
              <span>{pubs.length} works +</span>
            </summary>
            {[2026, 2025, 2024, 2023, 2022].map((year) => (
              <div key={year} className="year-group">
                <h3 className="year">{year}</h3>
                {pubs
                  .filter((p) => p.kind.includes(String(year)))
                  .map((p) => (
                    <Paper key={p.id} paper={{ ...p, id: 'full-' + p.id }} />
                  ))}
              </div>
            ))}
          </details>
        </section>
        <section className="section news-section" id="news">
          <div className="section-label">
            <span>04 / News</span>
            <h2>Recently.</h2>
          </div>
          <div className="news-list">
            {profile.news.slice(0, 5).map((n, i) => (
              <article key={i}>
                <span className="news-date">{n.date}</span>
                <p>
                  {n.text.startsWith(n.date)
                    ? n.text.slice(n.date.length).trim()
                    : n.text}
                </p>
              </article>
            ))}
            <details className="news-archive">
              <summary>Earlier updates +</summary>
              {profile.news.slice(5).map((n, i) => (
                <article key={i}>
                  <span className="news-date">{n.date}</span>
                  <p>
                    {n.text.startsWith(n.date)
                      ? n.text.slice(n.date.length).trim()
                      : n.text}
                  </p>
                </article>
              ))}
            </details>
          </div>
        </section>
        <section className="section" id="mentoring">
          <div className="section-label">
            <span>05 / People & community</span>
            <h2>
              Research grows
              <br />
              through people.
            </h2>
            <div className="mentoring-stat">
              <strong>31</strong>
              <span>
                students mentored
                <br />
                across 14 institutions
              </span>
            </div>
          </div>
          <div className="community">
            <h3>Mentoring & teaching</h3>
            {profile.mentoring.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <div className="experience-list">
              {profile.mentoring.items.map((x, i) => (
                <article key={i}>
                  <span>{x.when}</span>
                  <div>
                    <h4>{x.what}</h4>
                    <p>{x.det}</p>
                  </div>
                </article>
              ))}
            </div>
            <details className="service">
              <summary>
                Academic service <span>+</span>
              </summary>
              <div className="experience-list">
                {profile.service.items.map((x, i) => (
                  <article key={i}>
                    <span>{x.when}</span>
                    <div>
                      <h4>{x.what}</h4>
                      <p>{x.det}</p>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          </div>
        </section>
        <section className="section experience-section" id="experience">
          <div className="section-label">
            <span>06 / Background</span>
            <h2>
              Education
              <br />
              and recognition.
            </h2>
          </div>
          <div>
            <h3 className="subheading">Education</h3>
            <div className="experience-list">
              {profile.education.map((x) => (
                <article key={x.what}>
                  <span>{x.when}</span>
                  <div>
                    <h4>{x.what}</h4>
                    <p>{x.det}</p>
                  </div>
                </article>
              ))}
            </div>
            <details className="service">
              <summary>
                Awards & funding <span>+</span>
              </summary>
              <div className="experience-list">
                {profile.awards.map((x) => (
                  <article key={x.what}>
                    <span>{x.when}</span>
                    <div>
                      <h4>{x.what}</h4>
                      <p>{x.det}</p>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          </div>
        </section>
        <footer>
          <div>
            <span className="eyebrow">Let’s connect</span>
            <h2>
              Good questions
              <br />
              start conversations.
            </h2>
            <a href={'mailto:' + profile.links.email}>
              {profile.links.email} ↗
            </a>
          </div>
          <div className="footer-bottom">
            <span>He “Albert” Zhang · Penn State</span>
            <a href="#">Back to top ↑</a>
          </div>
        </footer>
      </main>
    </>
  );
}
